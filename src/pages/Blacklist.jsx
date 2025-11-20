import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';
import { useLanguage } from '../context/LanguageContext';
import Swal from 'sweetalert2';
import { Plus, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';

function Blacklist() {
  const { t } = useLanguage();
  const [blacklist, setBlacklist] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    reason: '',
    added_by: '',
  });

  useEffect(() => {
    fetchBlacklist();
    fetchCustomers();
  }, []);

  const fetchBlacklist = async () => {
    const { data, error } = await supabase
      .from('blacklist')
      .select(`
        *,
        customers (name, national_id)
      `)
      .order('added_date', { ascending: false });

    if (!error && data) {
      setBlacklist(data);
    }
  };

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (!error && data) {
      setCustomers(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from('blacklist').insert([formData]);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire('Success', 'Customer added to blacklist!', 'success');
      fetchBlacklist();
      closeModal();
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Remove from Blacklist?',
      text: "This customer will be allowed to rent again.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('blacklist').delete().eq('id', id);

      if (error) {
        Swal.fire('Error', error.message, 'error');
      } else {
        Swal.fire('Removed!', 'Customer removed from blacklist.', 'success');
        fetchBlacklist();
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      customer_id: '',
      reason: '',
      added_by: '',
    });
  };

  const filteredBlacklist = blacklist.filter(item =>
    item.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customers?.national_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t('blacklistTitle')}</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-neutral-600">{t('blacklistSubtitle')}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1 sm:space-x-2 bg-primary-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">{t('addToBlacklist')}</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search blacklist..."
              placeholder={t('searchBlacklist')}
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">{t('reason')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">{t('addedBy')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">{t('date')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredBlacklist.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                    {item.customers?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {item.customers?.national_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{item.reason}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{item.added_by || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {format(new Date(item.added_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center space-x-1 bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{t('removeFromBlacklist')}</span>
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
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Add to Blacklist</h2>
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">{t('addToBlacklist')}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Select Customer
                  </label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Choose a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.national_id}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Describe the reason for blacklisting..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Added By (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.added_by}
                    onChange={(e) => setFormData({ ...formData, added_by: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
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
                    {t('addToBlacklist')}
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

export default Blacklist;
