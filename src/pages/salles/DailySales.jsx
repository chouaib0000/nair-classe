import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import SallesNavigation from '../../components/SallesNavigation';
import Swal from 'sweetalert2';
import { Plus, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';

function DailySales() {
  const [sales, setSales] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [globalNotes, setGlobalNotes] = useState('');

  useEffect(() => {
    fetchSales();
    fetchItems();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('daily_sales')
      .select(`
        *,
        sales_items (name, item_id)
      `)
      .order('sale_date', { ascending: false });

    if (!error && data) {
      setSales(data);
    }
    setLoading(false);
  };

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('sales_items')
      .select('*')
      .order('name');

    if (!error && data) {
      setItems(data);
    }
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.id === itemId);
      if (existing) {
        return prev.filter(item => item.id !== itemId);
      } else {
        const item = items.find(i => i.id === itemId);
        return [...prev, {
          id: itemId,
          name: item.name,
          sale_price: item.sale_price,
          quantity: 1
        }];
      }
    });
  };

  const updateItemQuantity = (itemId, quantity) => {
    setSelectedItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity: parseInt(quantity) || 1 } : item
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      Swal.fire('Erreur', 'Veuillez sélectionner au moins un article', 'error');
      return;
    }

    const salesToInsert = selectedItems.map(selectedItem => {
      const totalAmount = selectedItem.sale_price * selectedItem.quantity;
      return {
        item_id: selectedItem.id,
        quantity_sold: selectedItem.quantity,
        unit_price: selectedItem.sale_price,
        total_amount: totalAmount,
        notes: globalNotes
      };
    });

    const { error } = await supabase.from('daily_sales').insert(salesToInsert);

    if (error) {
      Swal.fire('Erreur', error.message, 'error');
    } else {
      for (const selectedItem of selectedItems) {
        const item = items.find(i => i.id === selectedItem.id);
        if (item) {
          await supabase
            .from('sales_items')
            .update({ stock_quantity: item.stock_quantity - selectedItem.quantity })
            .eq('id', selectedItem.id);
        }
      }

      Swal.fire('Succès', `${selectedItems.length} vente(s) enregistrée(s)!`, 'success');
      fetchSales();
      fetchItems();
      closeModal();
    }
  };

  const handleDelete = async (id, itemId, quantity) => {
    const result = await Swal.fire({
      title: 'Supprimer Vente?',
      text: "Cette action est irréversible!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, supprimer!'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('daily_sales').delete().eq('id', id);

      if (error) {
        Swal.fire('Erreur', error.message, 'error');
      } else {
        const item = items.find(i => i.id === itemId);
        if (item) {
          await supabase
            .from('sales_items')
            .update({ stock_quantity: item.stock_quantity + quantity })
            .eq('id', itemId);
        }

        Swal.fire('Supprimé!', 'Vente supprimée.', 'success');
        fetchSales();
        fetchItems();
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItems([]);
    setSearchTerm('');
    setGlobalNotes('');
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <SallesNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-neutral-600">Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <SallesNavigation />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Ventes Quotidiennes</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-neutral-600">
              Enregistrer les ventes du jour
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1 sm:space-x-2 bg-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Nouvelle Vente</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Article</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Quantité</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Prix Unitaire</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                    {sale.sales_items?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{sale.quantity_sold}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{sale.unit_price} DH</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">{sale.total_amount} DH</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {format(new Date(sale.sale_date), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDelete(sale.id, sale.item_id, sale.quantity_sold)}
                      className="flex items-center space-x-1 bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Supprimer</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Nouvelle Vente</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Rechercher Articles
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, ID ou catégorie..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3">
                    Sélectionner Articles ({selectedItems.length} sélectionné{selectedItems.length !== 1 ? 's' : ''})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                    {filteredItems.map((item) => {
                      const isSelected = selectedItems.find(si => si.id === item.id);
                      return (
                        <div
                          key={item.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-green-600 bg-green-50'
                              : 'border-neutral-200 hover:border-green-300'
                          }`}
                          onClick={() => toggleItemSelection(item.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <input
                                type="checkbox"
                                checked={!!isSelected}
                                onChange={() => {}}
                                className="mt-1 w-5 h-5 text-green-600 border-neutral-300 rounded focus:ring-green-500"
                              />
                              <div className="flex-1">
                                <p className="font-semibold text-neutral-900">{item.name}</p>
                                <p className="text-sm text-neutral-600">ID: {item.item_id}</p>
                                <p className="text-sm text-neutral-600">Catégorie: {item.category}</p>
                                <p className="text-sm font-semibold text-green-600 mt-1">
                                  {item.sale_price} DH • Stock: {item.stock_quantity}
                                </p>
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-neutral-200" onClick={(e) => e.stopPropagation()}>
                              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                Quantité
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={item.stock_quantity}
                                value={isSelected.quantity}
                                onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {filteredItems.length === 0 && (
                    <p className="text-center text-neutral-600 py-8">Aucun article trouvé</p>
                  )}
                </div>

                {selectedItems.length > 0 && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Articles Sélectionnés</h4>
                    <div className="space-y-2">
                      {selectedItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-neutral-900">{item.name} × {item.quantity}</span>
                          <span className="font-semibold text-green-600">
                            {(item.sale_price * item.quantity).toFixed(2)} DH
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-green-300 flex items-center justify-between font-bold">
                        <span className="text-green-900">Total</span>
                        <span className="text-green-600 text-lg">{totalAmount.toFixed(2)} DH</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Notes (Optionnel)</label>
                  <textarea
                    value={globalNotes}
                    onChange={(e) => setGlobalNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Notes pour toutes les ventes..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={selectedItems.length === 0}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Enregistrer ({selectedItems.length})
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DailySales;
