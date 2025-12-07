import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';
import { useLanguage } from '../context/LanguageContext';
import Swal from 'sweetalert2';
import { Search, Clock, CheckCircle, XCircle, DollarSign, Eye, Calendar } from 'lucide-react';
import { format, isPast, isFuture, parseISO } from 'date-fns';

function Rentals() {
  const { t } = useLanguage();
  const [rentals, setRentals] = useState([]);
  const [groupedRentals, setGroupedRentals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedForReturn, setSelectedForReturn] = useState([]);

  useEffect(() => {
    fetchRentals();
  }, []);

  useEffect(() => {
    // Group rentals by customer and rental date
    const grouped = {};
    rentals.forEach(rental => {
      const key = `${rental.customer_id}_${rental.rental_date}`;
      if (!grouped[key]) {
        grouped[key] = {
          customer: rental.customers,
          rentalDate: rental.rental_date,
          expectedReturnDate: rental.expected_return_date,
          items: []
        };
      }
      grouped[key].items.push(rental);
    });
    setGroupedRentals(Object.values(grouped));
  }, [rentals]);

  const toggleGroupExpansion = (groupIndex) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupIndex]: !prev[groupIndex]
    }));
  };

  const fetchRentals = async () => {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        customers (name, phone_number),
        costumes (id, costume_id, name, size, image_url)
      `)
      .order('rental_date', { ascending: false });

    if (!error && data) {
      setRentals(data);
    }
  };

  const handleReturnCostumes = async (group) => {
    if (selectedForReturn.length === 0) {
      Swal.fire('Erreur', 'Veuillez sélectionner au moins un costume à retourner', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Traiter Retour',
      html: `
        <div class="text-left">
          <p class="mb-4"><strong>Client:</strong> ${group.customer?.name}</p>
          <p class="mb-4"><strong>Costumes sélectionnés:</strong> ${selectedForReturn.length}</p>
          <p class="mb-4"><strong>Date location:</strong> ${format(new Date(group.rentalDate), 'dd/MM/yyyy')}</p>
          <label for="returnPrice" class="block text-sm font-semibold mb-2">Prix Total (DH):</label>
          <input type="number" id="returnPrice" class="swal2-input w-full" placeholder="Entrer le prix total" step="0.01" min="0" value="0">
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Confirmer Retour',
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        const price = document.getElementById('returnPrice').value;
        if (!price || parseFloat(price) < 0) {
          Swal.showValidationMessage('Veuillez entrer un prix valide');
          return false;
        }
        return parseFloat(price);
      }
    });

    if (result.isConfirmed) {
      const totalPrice = result.value;
      const pricePerItem = totalPrice / selectedForReturn.length;

      // Process each selected rental
      for (const rentalId of selectedForReturn) {
        const rental = group.items.find(r => r.id === rentalId);
        if (!rental) continue;

        // Update rental status
        const { error: rentalError } = await supabase
          .from('rentals')
          .update({
            actual_return_date: new Date().toISOString(),
            status: 'returned',
            price: pricePerItem,
            payment_status: 'completed'
          })
          .eq('id', rentalId);

        if (rentalError) {
          Swal.fire('Erreur', rentalError.message, 'error');
          return;
        }

        // Increase available quantity
        const { data: costumeData, error: fetchError } = await supabase
          .from('costumes')
          .select('available_quantity, quantity')
          .eq('id', rental.costume_id)
          .single();

        if (fetchError) {
          Swal.fire('Erreur', fetchError.message, 'error');
          return;
        }

        const newAvailableQuantity = Math.min(
          (costumeData.available_quantity || 0) + 1,
          costumeData.quantity || 1
        );

        await supabase
          .from('costumes')
          .update({ available_quantity: newAvailableQuantity })
          .eq('id', rental.costume_id);
      }

      Swal.fire('Succès', `${selectedForReturn.length} costume(s) retourné(s)! Prix total: ${totalPrice.toFixed(2)} DH`, 'success');
      setSelectedForReturn([]);
      fetchRentals();
    }
  };

  const getStatusBadge = (status, rentalDate, expectedReturnDate) => {
    // Check if rental is in the future (reserved)
    if (isFuture(parseISO(rentalDate))) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700 flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>Réservé</span>
        </span>
      );
    }
    
    if (status === 'returned') {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Retourné</span>;
    }
    const isOverdue = isPast(new Date(expectedReturnDate));
    if (isOverdue) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">En Retard</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Actif</span>;
  };

  const toggleRentalSelection = (rentalId) => {
    setSelectedForReturn(prev =>
      prev.includes(rentalId)
        ? prev.filter(id => id !== rentalId)
        : [...prev, rentalId]
    );
  };

  const isReserved = (rentalDate) => {
    return isFuture(parseISO(rentalDate));
  };

  const filteredGroups = groupedRentals.filter(group => {
    const matchesSearch = group.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.items.some(item => item.costumes?.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'reserved') {
      return matchesSearch && group.items.some(item => isReserved(item.rental_date));
    }
    if (filterStatus === 'active') {
      return matchesSearch && group.items.some(item => 
        item.status === 'active' && !isReserved(item.rental_date)
      );
    }
    if (filterStatus === 'returned') return matchesSearch && group.items.every(item => item.status === 'returned');
    if (filterStatus === 'overdue') {
      return matchesSearch && group.items.some(item => 
        item.status === 'active' && isPast(new Date(item.expected_return_date))
      );
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">{t('rentalsTitle')}</h1>
          <p className="mt-2 text-neutral-600">{t('rentalsSubtitle')}</p>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search rentals..."
              placeholder={t('searchRentals')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">{t('allRentals')}</option>
            <option value="reserved">Réservé</option>
            <option value="active">{t('active')}</option>
            <option value="overdue">{t('overdue')}</option>
            <option value="returned">{t('returned')}</option>
          </select>
        </div>

        <div className="space-y-8">
          {filteredGroups.map((group, groupIndex) => {
            const hasActiveRentals = group.items.some(item => 
              item.status === 'active' && !isReserved(item.rental_date)
            );
            const activeRentalsInGroup = group.items.filter(item => 
              item.status === 'active' && !isReserved(item.rental_date)
            );
            const hasReservedRentals = group.items.some(item => isReserved(item.rental_date));
            const selectedInGroup = selectedForReturn.filter(id => 
              group.items.some(item => item.id === id)
            );

            return (
              <div key={groupIndex} className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
                {/* Group Header */}
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-4 sm:p-6 border-b border-neutral-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-neutral-900">{group.customer?.name}</h3>
                      <p className="text-xs sm:text-sm text-neutral-600 mt-1">{group.customer?.phone_number}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-neutral-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span>Location: {format(new Date(group.rentalDate), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-neutral-600">
                        <Clock className="w-4 h-4" />
                        <span>Retour: {format(new Date(group.expectedReturnDate), 'dd/MM/yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Costumes List */}
                <div className="divide-y divide-neutral-100">
                  {group.items.map((rental) => (
                    <div key={rental.id} className={`p-3 sm:p-6 transition-colors ${
                      isReserved(rental.rental_date) ? 'bg-cyan-50 hover:bg-cyan-100' : 'hover:bg-neutral-50'
                    }`}>
                      <div className="flex items-start gap-3 sm:gap-6">
                        {/* Checkbox for active rentals */}
                        {rental.status === 'active' && !isReserved(rental.rental_date) && (
                          <div className="flex items-center pt-1 sm:pt-2">
                            <input
                              type="checkbox"
                              checked={selectedForReturn.includes(rental.id)}
                              onChange={() => toggleRentalSelection(rental.id)}
                              className="w-6 h-6 sm:w-5 sm:h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 cursor-pointer"
                            />
                          </div>
                        )}
                        {!expandedGroups[groupIndex] && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroupExpansion(groupIndex);
                            }}
                            className="flex items-center space-x-2 bg-primary-50 text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-100 transition-colors text-sm font-semibold"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Voir Détails</span>
                          </button>
                        )}

                        {/* Costume Details - only show when expanded */}
                        {expandedGroups[groupIndex] && (
                          <>
                            {/* Costume Image */}
                        <div className="w-20 h-20 sm:w-32 sm:h-32 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                          {rental.costumes?.image_url ? (
                            <img
                              src={rental.costumes.image_url}
                              alt={rental.costumes.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                              Pas d'image
                            </div>
                          )}
                        </div>

                        {/* Costume Info */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row items-start justify-between mb-2 gap-2">
                            <div>
                              <h4 className="text-base sm:text-lg font-bold text-neutral-900">{rental.costumes?.name}</h4>
                              <p className="text-xs sm:text-sm text-neutral-600">ID: {rental.costumes?.costume_id}</p>
                            </div>
                            {getStatusBadge(rental.status, rental.rental_date, rental.expected_return_date)}
                          </div>

                          {rental.actual_return_date && (
                            <div className="flex items-center space-x-2 text-xs sm:text-sm text-green-600 mb-2">
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="text-xs sm:text-sm">Retourné le: {format(new Date(rental.actual_return_date), 'dd/MM/yyyy')}</span>
                            </div>
                          )}

                          {rental.price > 0 && (
                            <div className="flex items-center space-x-2 mb-2">
                              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                              <span className="text-xs sm:text-sm font-semibold text-green-600">
                                {rental.price.toFixed(2)} DH
                              </span>
                            </div>
                          )}

                          {rental.notes && (
                            <div className="mt-2">
                              <p className="text-xs sm:text-xs font-semibold text-neutral-500">Notes:</p>
                              <p className="text-xs sm:text-sm text-neutral-600">{rental.notes}</p>
                            </div>
                          )}
                        </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reserved Rentals Info */}
                {hasReservedRentals && !hasActiveRentals && (
                  <div className="bg-cyan-50 p-4 sm:p-6 border-t border-cyan-200">
                    <div className="flex items-center space-x-2 text-cyan-700">
                      <Calendar className="w-5 h-5" />
                      <p className="text-sm font-semibold">
                        Location réservée - Les costumes seront disponibles le {format(new Date(group.rentalDate), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Group Actions - Only for active (not reserved) rentals */}
                {hasActiveRentals && (
                  <div className="bg-neutral-50 p-4 sm:p-6 border-t border-neutral-200">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-0">
                      <div className="text-xs sm:text-sm text-neutral-600">
                        {selectedInGroup.length > 0 ? (
                          <span className="font-semibold text-primary-600">
                            {selectedInGroup.length} costume(s) sélectionné(s) pour retour
                          </span>
                        ) : (
                          <span>
                            {activeRentalsInGroup.length} costume(s) actif(s) • Cochez pour sélectionner
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleReturnCostumes(group)}
                        disabled={selectedInGroup.length === 0}
                        className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-4 sm:py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base w-full sm:w-auto"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>{t('processReturn')} ({selectedInGroup.length})</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-neutral-600">{t('noRentalsFound')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Rentals;
