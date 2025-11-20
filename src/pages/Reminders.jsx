import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';
import { useLanguage } from '../context/LanguageContext';
import Swal from 'sweetalert2';
import { Plus, Trash2, Search, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

function Reminders() {
  const { t } = useLanguage();
  const [reminders, setReminders] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    rental_id: '',
    reminder_date: '',
    message: '',
  });

  useEffect(() => {
    fetchReminders();
    fetchActiveRentals();
  }, []);

  const fetchReminders = async () => {
    const { data, error } = await supabase
      .from('reminders')
      .select(`
        *,
        rentals (
          customers (name),
          costumes (name)
        )
      `)
      .order('reminder_date', { ascending: true });

    if (!error && data) {
      setReminders(data);
    }
  };

  const fetchActiveRentals = async () => {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        customers (name),
        costumes (name)
      `)
      .eq('status', 'active')
      .order('expected_return_date');

    if (!error && data) {
      setRentals(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from('reminders').insert([formData]);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire('Success', 'Reminder created successfully!', 'success');
      fetchReminders();
      closeModal();
    }
  };

  const handleMarkAsSent = async (id) => {
    const { error } = await supabase
      .from('reminders')
      .update({ sent: true })
      .eq('id', id);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire('Success', 'Reminder marked as sent!', 'success');
      fetchReminders();
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Reminder?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('reminders').delete().eq('id', id);

      if (error) {
        Swal.fire('Error', error.message, 'error');
      } else {
        Swal.fire('Deleted!', 'Reminder has been deleted.', 'success');
        fetchReminders();
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      rental_id: '',
      reminder_date: '',
      message: '',
    });
  };

  const filteredReminders = reminders.filter(reminder =>
    reminder.rentals?.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reminder.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t('remindersTitle')}</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-neutral-600">{t('remindersSubtitle')}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1 sm:space-x-2 bg-primary-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">{t('createReminder')}</span>
            <span className="sm:hidden">Créer</span>
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search reminders..."
              placeholder={t('searchReminders')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-x-auto">
          <table className="w-full min-w-[768px]">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">{t('customer')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">{t('costume')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">{t('message')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">{t('date')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">{t('status')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredReminders.map((reminder) => (
                <tr key={reminder.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                    {reminder.rentals?.customers?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {reminder.rentals?.costumes?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{reminder.message}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {format(new Date(reminder.reminder_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      reminder.sent ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {reminder.sent ? t('sent') : t('pending')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      {!reminder.sent && (
                        <button
                          onClick={() => handleMarkAsSent(reminder.id)}
                          className="flex items-center space-x-1 bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>{t('markSent')}</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(reminder.id)}
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
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Create Reminder</h2>
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">{t('createReminder')}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Select Rental
                  </label>
                  <select
                    value={formData.rental_id}
                    onChange={(e) => setFormData({ ...formData, rental_id: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Choose a rental</option>
                    {rentals.map((rental) => (
                      <option key={rental.id} value={rental.id}>
                        {rental.customers?.name} - {rental.costumes?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Reminder Date
                  </label>
                  <input
                    type="date"
                    value={formData.reminder_date}
                    onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Enter reminder message..."
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
                    {t('createReminder')}
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

export default Reminders;
