import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, RefreshCw } from 'lucide-react';
import { Materiel, Supplier, getCategorieDisplayName, getCategorieBadgeColors, getStatusDisplayName, getStatusBadgeColors } from '../types/materiel';
import Modal from '../components/Modal';

const Materiels = () => {
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredMateriels, setFilteredMateriels] = useState<Materiel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMateriel, setEditingMateriel] = useState<Materiel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<Materiel>({
    name: '',
    category: 'OTHER',
    description: '',
    quantity: 0,
    unit: 'pièce',
    minThreshold: 10,
    supplierId: undefined,
    status: 'AVAILABLE'
  });

  const categories = [
    { value: 'MEDICAL', label: 'Matériel médical' },
    { value: 'DISPOSABLE', label: 'Matériel jetable' },
    { value: 'SUPPLIES', label: 'Fournitures' },
    { value: 'EQUIPMENT', label: 'Équipement' },
    { value: 'INSTRUMENTS', label: 'Instruments' },
    { value: 'PROTECTION', label: 'Protection' },
    { value: 'HYGIENE', label: 'Hygiène' },
    { value: 'OTHER', label: 'Autre' }
  ];

  const fetchMateriels = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://hc.aui.ma/api/consultations/materials');
      if (!response.ok) throw new Error('Failed to fetch materials');
      const data = await response.json();
      setMateriels(data);
      setFilteredMateriels(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Erreur lors du chargement des matériels');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('https://hc.aui.ma/api/consultations/fournisseurs');
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  useEffect(() => {
    fetchMateriels();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    let filtered = materiels;
    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }
    setFilteredMateriels(filtered);
  }, [materiels, searchTerm, selectedCategory]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'OTHER',
      description: '',
      quantity: 0,
      unit: 'pièce',
      minThreshold: 10,
      supplierId: undefined,
      status: 'AVAILABLE'
    });
  };

  const openAddForm = () => {
    resetForm();
    setEditingMateriel(null);
    setShowForm(true);
  };

  const openEditForm = (mat: Materiel) => {
    setFormData(mat);
    setEditingMateriel(mat);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingMateriel(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingMateriel 
        ? `https://hc.aui.ma/api/consultations/materials`
        : 'https://hc.aui.ma/api/consultations/materials';
      
      const method = editingMateriel ? 'PUT' : 'POST';
      const dataToSubmit = editingMateriel ? { ...formData, id: editingMateriel.id } : formData;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save material: ${errorText}`);
      }

      await fetchMateriels();
      closeForm();
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce matériel ?')) return;
    try {
      const response = await fetch(`https://hc.aui.ma/api/consultations/materials/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete');
      await fetchMateriels();
    } catch (error) {
      console.error('Error:', error);
      setError('Erreur lors de la suppression');
    }
  };

  const getSupplierName = (supplierId?: number) => {
    if (!supplierId) return 'N/A';
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || 'N/A';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Package className="w-6 h-6 mr-2 text-blue-600" />
            Gestion des Matériels
          </h1>
          <p className="text-gray-600 mt-1">Gérer l'inventaire des matériels médicaux</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau Matériel</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un matériel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Materials Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : filteredMateriels.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun matériel trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seuil Min</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fournisseur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMateriels.map((materiel) => (
                  <tr key={materiel.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{materiel.name}</div>
                      <div className="text-xs text-gray-500">{materiel.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategorieBadgeColors(materiel.category)}`}>
                        {getCategorieDisplayName(materiel.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${materiel.quantity <= materiel.minThreshold ? 'text-red-600' : 'text-gray-900'}`}>
                        {materiel.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{materiel.unit}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{materiel.minThreshold}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{getSupplierName(materiel.supplierId)}</td>
                    <td className="px-6 py-4">
                      {materiel.status && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColors(materiel.status)}`}>
                          {getStatusDisplayName(materiel.status)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => openEditForm(materiel)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => materiel.id && handleDelete(materiel.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editingMateriel ? 'Modifier Matériel' : 'Nouveau Matériel'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unité *</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="pièce, boîte, etc."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seuil Minimum *</label>
            <input
              type="number"
              value={formData.minThreshold}
              onChange={(e) => setFormData({ ...formData, minThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
            <select
              value={formData.supplierId || ''}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Aucun fournisseur</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingMateriel ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Materiels;
