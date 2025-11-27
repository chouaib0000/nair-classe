import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';
import DocumentUpload from '../components/DocumentUpload';
import VoiceRecorder from '../components/VoiceRecorder';
import { useLanguage } from '../context/LanguageContext';
import Swal from 'sweetalert2';
import { Plus, Edit, Trash2, Search, ShoppingBag, History } from 'lucide-react';
import { format } from 'date-fns';

function Customers() {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [costumeSearchTerm, setCostumeSearchTerm] = useState('');
  const [rentalStartDate, setRentalStartDate] = useState('');
  const [upfrontPayment, setUpfrontPayment] = useState('');
  const [availableCostumes, setAvailableCostumes] = useState([]);
  const [costumesPage, setCostumesPage] = useState(1);
  const [hasMoreCostumes, setHasMoreCostumes] = useState(true);
  const [loadingCostumes, setLoadingCostumes] = useState(false);
  const [costumesCache, setCostumesCache] = useState([]);
  const [selectedCostumes, setSelectedCostumes] = useState([]);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [rentalNotes, setRentalNotes] = useState('');
  const [customerHistory, setCustomerHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const customersPerPage = 50;
  const [formData, setFormData] = useState({
    name: '',
    national_id: '',
    date_of_birth: '',
    phone_number: '',
    cin_recto_url: '',
    cin_verso_url: '',
    voice_note_url: '',
    other_documents_url: '',
  });

  useEffect(() => {
    fetchCustomers();
    fetchAvailableCostumesBasic();
  }, []);

  const fetchCustomers = async (pageNum = 1, append = false) => {
    setLoading(true);
    const { data, error, count } = await supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * customersPerPage, pageNum * customersPerPage - 1);

    if (!error && data) {
      setCustomers(prev => append ? [...prev, ...data] : data);
      setHasMore(data.length === customersPerPage);
    } else if (error) {
      Swal.fire('Erreur', error.message, 'error');
    }
    setLoading(false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCustomers(nextPage, true);
  };

  const fetchAvailableCostumesBasic = async (pageNum = 1, append = false) => {
    setLoadingCostumes(true);
    const pageSize = 20;
    
    const { data, error } = await supabase
      .from('costumes')
      .select('id, costume_id, name, size, rental_price, available_quantity, quantity')
      .range((pageNum - 1) * pageSize, pageNum * pageSize - 1);

    if (!error && data) {
      if (append) {
        const combined = [...availableCostumes, ...data];
        setAvailableCostumes(combined);
        setCostumesCache(combined);
      } else {
        setAvailableCostumes(data);
        setCostumesCache(data);
      }
      setHasMoreCostumes(data.length === pageSize);
    }
    setLoadingCostumes(false);
  };

  const loadMoreCostumes = () => {
    const nextPage = costumesPage + 1;
    setCostumesPage(nextPage);
    fetchAvailableCostumesBasic(nextPage, true);
  };

  const fetchCustomerHistory = async (customerId) => {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        costumes (name, costume_id, image_url)
      `)
      .eq('customer_id', customerId)
      .order('rental_date', { ascending: false });

    if (!error && data) {
      setCustomerHistory(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingCustomer) {
      const { error } = await supabase
        .from('customers')
        .update(formData)
        .eq('id', editingCustomer.id);

      if (error) {
        Swal.fire('Error', error.message, 'error');
      } else {
        Swal.fire('Success', 'Customer updated successfully!', 'success');
        fetchCustomers();
        closeModal();
      }
    } else {
      const { error } = await supabase.from('customers').insert([formData]);

      if (error) {
        Swal.fire('Error', error.message, 'error');
      } else {
        Swal.fire('Success', 'Customer added successfully!', 'success');
        fetchCustomers();
        closeModal();
      }
    }
  };

  const handleRentCostumes = async () => {
    if (selectedCostumes.length === 0) {
      Swal.fire('Error', 'Please select at least one costume', 'error');
      return;
    }

    if (!expectedReturnDate) {
      Swal.fire('Error', 'Please select expected return date', 'error');
      return;
    }

    const rentals = selectedCostumes.map(costumeId => {
      const totalPrice = parseFloat(upfrontPayment) || 0;
      const pricePerItem = selectedCostumes.length > 0 ? totalPrice / selectedCostumes.length : 0;
      const costume = availableCostumes.find(c => c.id === costumeId);
      return {
        customer_id: selectedCustomer.id,
        costume_id: costumeId,
        rental_date: rentalStartDate || new Date().toISOString(),
        expected_return_date: expectedReturnDate,
        status: 'active',
        notes: rentalNotes,
        price: pricePerItem,
        payment_status: pricePerItem > 0 ? 'completed' : 'pending'
      };
    });

    // Insert rentals
    const { error: rentalError } = await supabase.from('rentals').insert(rentals);

    if (rentalError) {
      Swal.fire('Error', rentalError.message, 'error');
      return;
    }

    // Decrease available quantity for each rented costume
    for (const costumeId of selectedCostumes) {
      const costume = availableCostumes.find(c => c.id === costumeId);
      if (costume) {
        const newQuantity = (costume.available_quantity || 0) - 1;
        const { error: updateError } = await supabase
          .from('costumes')
          .update({ available_quantity: newQuantity })
          .eq('id', costumeId);

        if (updateError) {
          Swal.fire('Error', updateError.message, 'error');
          return;
        }
      }
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      national_id: customer.national_id,
      date_of_birth: customer.date_of_birth,
      phone_number: customer.phone_number,
      cin_recto_url: customer.cin_recto_url || '',
      cin_verso_url: customer.cin_verso_url || '',
      voice_note_url: customer.voice_note_url || '',
      other_documents_url: customer.other_documents_url || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Customer?',
      text: "This will also delete all rental history!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete!'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('customers').delete().eq('id', id);

      if (error) {
        Swal.fire('Error', error.message, 'error');
      } else {
        Swal.fire('Deleted!', 'Customer has been deleted.', 'success');
        fetchCustomers();
      }
    }
  };

  const openRentalModal = (customer) => {
    setSelectedCustomer(customer);
    if (costumesCache.length > 0) {
      setAvailableCostumes(costumesCache);
    } else {
      fetchAvailableCostumesBasic();
    }
    checkBlacklist(customer);
  };

  const checkBlacklist = async (customer) => {
    // Vérifier si le client est dans la liste noire
    const { data: blacklistData, error } = await supabase
      .from('blacklist')
      .select('*')
      .eq('customer_id', customer.id)
      .limit(1);

    if (error) {
      Swal.fire('Erreur', 'Impossible de vérifier la liste noire', 'error');
      return;
    }

    if (blacklistData && blacklistData.length > 0) {
      Swal.fire({
        title: 'Client dans la Liste Noire',
        text: `Ce client est dans la liste noire. Raison: ${blacklistData[0].reason}`,
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
      return;
    }

    // Si le client n'est pas dans la liste noire, ouvrir le modal de location
    setSelectedCustomer(customer);
    setShowRentalModal(true);
  };

  const fetchCostumeImage = async (costumeId) => {
    try {
      const { data, error } = await supabase
        .from('costumes')
        .select('image_url')
        .eq('id', costumeId)
        .single();
      
      if (!error && data) {
        return data.image_url;
      }
    } catch (err) {
      console.error('Error fetching costume image:', err);
    }
    return null;
  };

  const openHistoryModal = async (customer) => {
    setSelectedCustomer(customer);
    await fetchCustomerHistory(customer.id);
    setShowHistoryModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      national_id: '',
      date_of_birth: '',
      cin_recto_url: '',
      cin_verso_url: '',
      voice_note_url: '',
      other_documents_url: '',
      phone_number: '',
    });
  };

  const toggleCostumeSelection = (costumeId) => {
    setSelectedCostumes(prev =>
      prev.includes(costumeId)
        ? prev.filter(id => id !== costumeId)
        : [...prev, costumeId]
    );
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.national_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-neutral-600">Chargement des clients...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t('customersTitle')}</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-neutral-600">{t('customersSubtitle')}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1 sm:space-x-2 bg-primary-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">{t('addCustomer')}</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search customers..."
              placeholder={t('searchCustomers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">{t('name')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">{t('nationalId')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">{t('dateOfBirth')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">{t('phoneNumber')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm text-neutral-900">{customer.name}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{customer.national_id}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {format(new Date(customer.date_of_birth), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{customer.phone_number}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openHistoryModal(customer)}
                        className="flex items-center space-x-1 bg-purple-50 text-purple-600 px-3 py-1 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <History className="w-3 h-3" />
                        <span>{t('history')}</span>
                      </button>
                      <button
                        onClick={() => openRentalModal(customer)}
                        className="flex items-center space-x-1 bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>{t('rent')}</span>
                      </button>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="flex items-center space-x-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        <span>{t('edit')}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="flex items-center space-x-1 bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t('delete')}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!searchTerm && hasMore && (
            <div className="p-6 border-t border-neutral-100 text-center">
              <button
                onClick={loadMore}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Charger Plus
              </button>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                {editingCustomer ? t('editCustomer') : t('addCustomer')}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">{t('name')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">{t('nationalId')}</label>
                  <input
                    type="text"
                    value={formData.national_id}
                    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">{t('dateOfBirth')}</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">{t('phoneNumber')}</label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DocumentUpload
                    label={t('cinRecto')}
                    type="image"
                    currentDocument={formData.cin_recto_url}
                    onDocumentChange={(url) => setFormData({ ...formData, cin_recto_url: url })}
                  />
                  <DocumentUpload
                    label={t('cinVerso')}
                    type="image"
                    currentDocument={formData.cin_verso_url}
                    onDocumentChange={(url) => setFormData({ ...formData, cin_verso_url: url })}
                  />
                </div>

                <VoiceRecorder
                  currentRecording={formData.voice_note_url}
                  onRecordingComplete={(url) => setFormData({ ...formData, voice_note_url: url })}
                />

                <DocumentUpload
                  label={t('otherDocuments')}
                  type="document"
                  currentDocument={formData.other_documents_url}
                  onDocumentChange={(url) => setFormData({ ...formData, other_documents_url: url })}
                />

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {editingCustomer ? t('save') : t('addCustomer')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showRentalModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                Louer Costumes à {selectedCustomer.name}
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Date de Location (Quand vous donnez le costume)
                </label>
                <input
                  type="date"
                  value={rentalStartDate}
                  onChange={(e) => setRentalStartDate(e.target.value)}
                  max={expectedReturnDate || undefined}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Date de Retour Prévue
                </label>
                <input
                  type="date"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  min={rentalStartDate || new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Paiement Reçu Aujourd'hui (DH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={upfrontPayment}
                  onChange={(e) => setUpfrontPayment(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Montant payé maintenant"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Notes (Optionnel)
                </label>
                <textarea
                  value={rentalNotes}
                  onChange={(e) => setRentalNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Ajouter des notes spéciales..."
                />
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">Sélectionner Costumes</h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom de costume..."
                    value={costumeSearchTerm}
                    onChange={(e) => setCostumeSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                  {availableCostumes.length === 0 ? (
                    <div className="col-span-2 text-center py-8">
                      {loadingCostumes ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                          <p className="text-neutral-600 text-sm">Chargement...</p>
                        </div>
                      ) : (
                        <p className="text-neutral-600">Aucun costume disponible</p>
                      )}
                    </div>
                  ) : (
                    availableCostumes
                      .filter(costume => 
                        costume.name.toLowerCase().includes(costumeSearchTerm.toLowerCase()) ||
                        costume.costume_id.toLowerCase().includes(costumeSearchTerm.toLowerCase())
                      )
                      .map((costume) => (
                        <div
                          key={costume.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            selectedCostumes.includes(costume.id)
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-neutral-200 hover:border-primary-300'
                          }`}
                          onClick={() => toggleCostumeSelection(costume.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedCostumes.includes(costume.id)}
                              onChange={() => {}}
                              className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <div>
                              <p className="font-semibold text-neutral-900">{costume.name}</p>
                              <p className="text-sm text-neutral-600">ID: {costume.costume_id} • Size: {costume.size}</p>
                              <p className="text-sm font-semibold text-primary-600">
                                {costume.rental_price || 0} DH • Stock: {costume.available_quantity || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
                {hasMoreCostumes && !loadingCostumes && availableCostumes.length > 0 && (
                  <button
                    type="button"
                    onClick={loadMoreCostumes}
                    className="w-full mt-4 px-4 py-2 text-sm bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
                  >
                    Charger Plus ({availableCostumes.length} chargés)
                  </button>
                )}
                {loadingCostumes && availableCostumes.length > 0 && (
                  <div className="text-center mt-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRentalModal(false);
                    setSelectedCostumes([]);
                    setRentalStartDate('');
                    setCostumeSearchTerm('');
                    setExpectedReturnDate('');
                    setUpfrontPayment('');
                    setRentalNotes('');
                  }}
                  className="flex-1 px-4 py-3 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRentCostumes}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Louer Sélectionné ({selectedCostumes.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {showHistoryModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                Rental History - {selectedCustomer.name}
              </h2>
              <div className="space-y-4">
                {customerHistory.map((rental) => (
                  <div key={rental.id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-4">
                        <div className="w-20 h-20 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                          {rental.costumes?.image_url ? (
                            <img
                              src={rental.costumes.image_url}
                              alt={rental.costumes.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-neutral-900">{rental.costumes?.name}</h4>
                          <p className="text-sm text-neutral-600">ID: {rental.costumes?.costume_id}</p>
                          <p className="text-sm text-neutral-600 mt-2">
                            Rented: {format(new Date(rental.rental_date), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm text-neutral-600">
                            Expected Return: {format(new Date(rental.expected_return_date), 'MMM dd, yyyy')}
                          </p>
                          {rental.actual_return_date && (
                            <p className="text-sm text-green-600">
                              Returned: {format(new Date(rental.actual_return_date), 'MMM dd, yyyy')}
                            </p>
                          )}
                          {rental.price > 0 && (
                            <p className="text-sm font-semibold text-primary-600 mt-1">
                              Price: ${rental.price.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        rental.status === 'returned' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {rental.status === 'returned' ? 'Returned' : 'Active'}
                      </span>
                    </div>
                  </div>
                ))}
                {customerHistory.length === 0 && (
                  <p className="text-center text-neutral-600 py-8">No rental history found</p>
                )}
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="mt-6 w-full px-4 py-3 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Customers;
