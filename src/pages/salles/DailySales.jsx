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
  const [formData, setFormData] = useState({
    item_id: '',
    quantity_sold: 1,
    unit_price: 0,
    notes: '',
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedItem = items.find(item => item.id === formData.item_id);
    const totalAmount = formData.unit_price * formData.quantity_sold;

    const saleData = {
      ...formData,
      total_amount: totalAmount,
    };

    const { error } = await supabase.from('daily_sales').insert([saleData]);

    if (error) {
      Swal.fire('Erreur', error.message, 'error');
    } else {
      await supabase
        .from('sales_items')
        .update({ stock_quantity: selectedItem.stock_quantity - formData.quantity_sold })
        .eq('id', formData.item_id);

      Swal.fire('Succès', 'Vente enregistrée!', 'success');
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
    setFormData({
      item_id: '',
      quantity_sold: 1,
      unit_price: 0,
      notes: '',
    });
  };

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
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Nouvelle Vente</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Article</label>
                  <select
                    value={formData.item_id}
                    onChange={(e) => {
                      const item = items.find(i => i.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        item_id: e.target.value,
                        unit_price: item?.sale_price || 0
                      });
                    }}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Choisir un article</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - Stock: {item.stock_quantity}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity_sold}
                    onChange={(e) => setFormData({ ...formData, quantity_sold: parseInt(e.target.value) })}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Prix Unitaire (DH)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Notes (Optionnel)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
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
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Enregistrer
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
