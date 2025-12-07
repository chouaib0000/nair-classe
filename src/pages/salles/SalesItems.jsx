import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import SallesNavigation from '../../components/SallesNavigation';
import ImageUpload from '../../components/ImageUpload';
import Swal from 'sweetalert2';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

function SalesItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    item_id: '',
    name: '',
    category: '',
    sale_price: 0,
    cost_price: 0,
    stock_quantity: 0,
    image_url: '',
  });

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 800;

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.7);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingItem) {
      const { error } = await supabase
        .from('sales_items')
        .update(formData)
        .eq('id', editingItem.id);

      if (error) {
        Swal.fire('Erreur', error.message, 'error');
      } else {
        Swal.fire('Succès', 'Article mis à jour!', 'success');
        fetchItems();
        closeModal();
      }
    } else {
      const { error } = await supabase.from('sales_items').insert([formData]);

      if (error) {
        Swal.fire('Erreur', error.message, 'error');
      } else {
        Swal.fire('Succès', 'Article ajouté!', 'success');
        fetchItems();
        closeModal();
      }
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Supprimer Article?',
      text: "Cette action est irréversible!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, supprimer!'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('sales_items').delete().eq('id', id);

      if (error) {
        Swal.fire('Erreur', error.message, 'error');
      } else {
        Swal.fire('Supprimé!', 'Article supprimé.', 'success');
        fetchItems();
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      item_id: '',
      name: '',
      category: '',
      sale_price: 0,
      cost_price: 0,
      stock_quantity: 0,
      image_url: '',
    });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (stockFilter === 'all') return matchesSearch;
    if (stockFilter === 'in-stock') return matchesSearch && item.stock_quantity > 0;
    if (stockFilter === 'out-of-stock') return matchesSearch && item.stock_quantity <= 0;
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
        <SallesNavigation />
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      <SallesNavigation />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              Articles de Vente
            </h1>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-neutral-600">
              Gérer votre inventaire de produits
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Ajouter Article</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Rechercher articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-neutral-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-3.5 border border-neutral-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
          >
            <option value="all">Tous les Articles</option>
            <option value="in-stock">En Stock</option>
            <option value="out-of-stock">Épuisé</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`group rounded-2xl shadow-lg hover:shadow-2xl border overflow-hidden hover:-translate-y-1 transition-all duration-300 ${
                item.stock_quantity <= 0 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-white border-neutral-100'
              }`}
            >
              {item.image_url ? (
                <div className="aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                  <p className="text-neutral-400">Pas d'image</p>
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-neutral-900">{item.name}</h3>
                <p className="text-sm text-neutral-500 font-medium mt-1">ID: {item.item_id}</p>
                <p className="text-sm text-neutral-500 font-medium">Catégorie: {item.category}</p>
                <div className="mt-4 space-y-2">
                  <p className="text-base font-bold text-green-600">{item.sale_price} DH</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-600">Stock: {item.stock_quantity}</p>
                    {item.stock_quantity <= 0 && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white uppercase">
                        Épuisé
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setFormData(item);
                      setShowModal(true);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl hover:bg-blue-100 hover:shadow-md transition-all duration-200 font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl hover:bg-red-100 hover:shadow-md transition-all duration-200 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8 my-8 shadow-2xl">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-8">
                {editingItem ? 'Modifier Article' : 'Ajouter Article'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">ID Article</label>
                    <input
                      type="text"
                      value={formData.item_id}
                      onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Nom</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Catégorie</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Prix de Vente (DH)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) })}
                      required
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Prix d'Achat (DH)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                      required
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Quantité en Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
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
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {editingItem ? 'Sauvegarder' : 'Ajouter'}
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

export default SalesItems;
