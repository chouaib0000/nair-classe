import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';
import ImageUpload from '../components/ImageUpload';
import { useLanguage } from '../context/LanguageContext';
import Swal from 'sweetalert2';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

function Costumes() {
  const { t } = useLanguage();
  const [costumes, setCostumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const costumesPerPage = 50;
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCostume, setEditingCostume] = useState(null);
  const [formData, setFormData] = useState({
    costume_id: '',
    name: '',
    size: '',
    image_url: '',
    rental_price: 0,
    rental_price_display: '',
    quantity: 1,
    available_quantity: 1,
  });

  useEffect(() => {
    fetchCostumesBasic(1, false);
  }, []);

  const fetchCostumesBasic = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('costumes')
        .select('id, costume_id, name, size, rental_price, quantity, available_quantity, created_at')
        .order('created_at', { ascending: false })
        .range((pageNum - 1) * costumesPerPage, pageNum * costumesPerPage - 1);

      if (error) {
        console.error('Error fetching costumes:', error);
        Swal.fire('Error', `Failed to fetch costumes: ${error.message}`, 'error');
        setCostumes(prev => append ? prev : []);
      } else {
        setCostumes(prev => append ? [...prev, ...data] : (data || []));
        setHasMore(data.length === costumesPerPage);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      Swal.fire('Error', 'An unexpected error occurred', 'error');
      setCostumes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCostumesBasic(nextPage, true);
  };

  const fetchCostumeDetails = async (costumeId) => {
    try {
      const { data, error } = await supabase
        .from('costumes')
        .select('*')
        .eq('id', costumeId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching costume details:', err);
      Swal.fire('Error', 'Failed to load costume details', 'error');
      return null;
    }
  };

  const handleViewDetails = async (costume) => {
    const details = await fetchCostumeDetails(costume.id);
    if (details) {
      setEditingCostume(details);
      setFormData({
        costume_id: details.costume_id,
        name: details.name,
        size: details.size,
        image_url: details.image_url || '',
        rental_price: details.rental_price || 0,
        rental_price_display: (details.rental_price || 0).toString(),
        quantity: details.quantity || 1,
        available_quantity: details.available_quantity || 1,
      });
      setShowModal(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      rental_price: parseFloat(formData.rental_price_display) || 0
    };
    delete submitData.rental_price_display;

    if (editingCostume) {
      const { error } = await supabase
        .from('costumes')
        .update(submitData)
        .eq('id', editingCostume.id);

      if (error) {
        Swal.fire('Error', error.message, 'error');
      } else {
        Swal.fire('Success', 'Costume updated successfully!', 'success');
        fetchCostumesBasic();
        closeModal();
      }
    } else {
      const { error } = await supabase.from('costumes').insert([submitData]);

      if (error) {
        Swal.fire('Error', error.message, 'error');
      } else {
        Swal.fire('Success', 'Costume added successfully!', 'success');
        fetchCostumesBasic();
        closeModal();
      }
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Costume?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('costumes').delete().eq('id', id);

      if (error) {
        Swal.fire('Error', error.message, 'error');
      } else {
        Swal.fire('Deleted!', 'Costume has been deleted.', 'success');
        fetchCostumesBasic();
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCostume(null);
    setFormData({
      costume_id: '',
      name: '',
      size: '',
      image_url: '',
      rental_price: 0,
      rental_price_display: '',
      quantity: 1,
      available_quantity: 1,
    });
  };

  const filteredCostumes = costumes.filter(costume =>
    costume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    costume.costume_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
        <Navigation />
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-neutral-600">{t('loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      <Navigation />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">{t('costumesTitle')}</h1>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-neutral-600">{t('costumesSubtitle')}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">{t('addCostume')}</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search costumes..."
              placeholder={t('searchCostumes')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base border border-neutral-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {filteredCostumes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-600 text-lg">
              {searchTerm ? 'Aucun costume trouvé' : 'Aucun costume dans la base de données'}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Ajouter votre premier costume</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
            {filteredCostumes.map((costume) => (
            <div 
              key={costume.id} 
              onClick={() => handleViewDetails(costume)}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-neutral-100 overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className="aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden flex items-center justify-center">
                <div className="text-center p-6">
                  <p className="text-4xl font-bold text-neutral-300 mb-2">{costume.costume_id}</p>
                  <p className="text-sm text-neutral-400">Cliquez pour voir les détails</p>
                </div>
              </div>
              <div className="p-7">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900">{costume.name}</h3>
                    <p className="text-sm text-neutral-500 font-medium mt-1">ID: {costume.costume_id}</p>
                    <p className="text-sm text-neutral-500 font-medium">Size: {costume.size}</p>
                    <p className="text-base font-bold text-primary-600 mt-3">
                      {costume.rental_price || 0} DH/location
                    </p>
                    <p className="text-sm text-neutral-600 mt-1">
                      <span className="font-semibold">{t('stock')}:</span> {costume.available_quantity || 0}/{costume.quantity || 0}
                    </p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                    (costume.available_quantity || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {(costume.available_quantity || 0) > 0 ? `${costume.available_quantity} ${t('available')}` : t('outOfStock')}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(costume.id);
                  }}
                    className="flex-1 flex items-center justify-center space-x-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl hover:bg-red-100 hover:shadow-md transition-all duration-200 font-medium"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                  <span>{t('delete')}</span>
                </button>
              </div>
            </div>
            ))}
          </div>
        )}

        {!searchTerm && hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold"
            >
              Charger Plus
            </button>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8 my-8 shadow-2xl">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-8">
                {editingCostume ? t('editCostume') : t('addCostume')}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      {t('costumeId')}
                    </label>
                    <input
                      type="text"
                      value={formData.costume_id}
                      onChange={(e) => setFormData({ ...formData, costume_id: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      {t('name')}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      {t('size')}
                    </label>
                    <input
                      type="text"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      {t('rentalPrice')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.rental_price_display}
                      onChange={(e) => setFormData({ ...formData, rental_price_display: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      {t('totalQuantity')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 1;
                        setFormData({ 
                          ...formData, 
                          quantity: newQuantity,
                          available_quantity: Math.min(formData.available_quantity, newQuantity)
                        });
                      }}
                      required
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      {t('availableQuantity')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={formData.quantity}
                      value={formData.available_quantity}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        available_quantity: Math.min(parseInt(e.target.value) || 0, formData.quantity)
                      })}
                      required
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                <ImageUpload
                  onImageUrlChange={(url) => setFormData({ ...formData, image_url: url })}
                  currentImageUrl={formData.image_url}
                />
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3.5 border-2 border-neutral-200 rounded-xl text-neutral-700 font-semibold hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {editingCostume ? t('save') : t('addCostume')}
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

export default Costumes;
