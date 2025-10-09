import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Package } from 'lucide-react';
import { Materiel, Supplier, getCategorieDisplayName, getCategorieBadgeColors, getStatusDisplayName, getStatusBadgeColors } from '../types/materiel';
import Modal from '../components/Modal';

const MaterielDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [materiel, setMateriel] = useState<Materiel | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState<Materiel | null>(null);

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

  const fetchMateriel = async () => {
    try {
      setLoading(true);
      const res = await fetch(`https://hc.aui.ma/api/consultations/materials/${id}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMateriel(data);
      setFormData(data);
    } catch (e) {
      setError("Erreur lors du chargement du matériel");
    } finally {
      setLoading(false);
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
    fetchMateriel();
    fetchSuppliers();
  }, [id]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    try {
      const response = await fetch(`https://hc.aui.ma/api/consultations/materials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update');
      
      await fetchMateriel();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating material:', error);
      setError('Erreur lors de la mise à jour');
    }
  };

  const getSupplierName = (supplierId?: number) => {
    if (!supplierId) return 'N/A';
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || 'N/A';
  };

  if (loading) return <div className="p-6">Chargement...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!materiel) return <div className="p-6">Matériel non trouvé</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>
        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Edit className="w-4 h-4" />
          <span>Modifier</span>
        </button>
      </div>

      {/* Material Details */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{materiel.name}</h1>
            <div className="flex items-center space-x-3 mt-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategorieBadgeColors(materiel.category)}`}>
                {getCategorieDisplayName(materiel.category)}
              </span>
              {materiel.status && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColors(materiel.status)}`}>
                  {getStatusDisplayName(materiel.status)}
                </span>
              )}
            </div>
          </div>
          <Package className="w-12 h-12 text-blue-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Information Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Informations</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-gray-500">Catégorie</div>
              <div className="text-gray-900">{getCategorieDisplayName(materiel.category)}</div>
              
              <div className="text-gray-500">Quantité en stock</div>
              <div className={`font-medium ${materiel.quantity <= materiel.minThreshold ? 'text-red-600' : 'text-gray-900'}`}>
                {materiel.quantity} {materiel.unit}
              </div>
              
              <div className="text-gray-500">Seuil minimum</div>
              <div className="text-gray-900">{materiel.minThreshold} {materiel.unit}</div>
              
              <div className="text-gray-500">Unité</div>
              <div className="text-gray-900">{materiel.unit}</div>
              
              <div className="text-gray-500">Fournisseur</div>
              <div className="text-gray-900">{getSupplierName(materiel.supplierId)}</div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Description</h2>
            <p className="text-sm text-gray-600">{materiel.description || 'Aucune description'}</p>
          </div>
        </div>

        {/* Stock Alert */}
        {materiel.quantity <= materiel.minThreshold && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              ⚠️ <strong>Alerte stock faible:</strong> La quantité en stock est inférieure ou égale au seuil minimum.
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier Matériel"
      >
        {formData && (
          <form onSubmit={handleEdit} className="space-y-4 p-6">
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
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Mettre à jour
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default MaterielDetails;
