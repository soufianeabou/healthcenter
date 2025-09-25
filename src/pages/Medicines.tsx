import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import MedicineForm from '../components/MedicineForm';
import { Medicine, getCategorieDisplayName, getUniteDisplayName, getCategorieBadgeColors } from '../types/medicine';

const Medicines = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch medicines from API
  const fetchMedicines = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/medicaments');
      if (!response.ok) {
        throw new Error('Failed to fetch medicines');
      }
      const data = await response.json();
      setMedicines(data);
      setFilteredMedicines(data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      setError('Erreur lors du chargement des médicaments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Filter medicines based on search term and category
  useEffect(() => {
    let filtered = medicines;

    if (searchTerm) {
      filtered = filtered.filter(medicine =>
        medicine.nomMedicament.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.codeBarre39.includes(searchTerm)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(medicine => medicine.categorie === selectedCategory);
    }

    setFilteredMedicines(filtered);
  }, [medicines, searchTerm, selectedCategory]);

  // Add new medicine
  const handleAddMedicine = async (medicineData: Omit<Medicine, 'id' | 'compteurPiles'>) => {
    try {
      const response = await fetch('/api/medicaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(medicineData),
      });

      if (!response.ok) {
        throw new Error('Failed to add medicine');
      }

      const newMedicine = await response.json();
      setMedicines(prev => [...prev, newMedicine]);
      setShowForm(false);
      return true;
    } catch (error) {
      console.error('Error adding medicine:', error);
      setError('Erreur lors de l\'ajout du médicament');
      return false;
    }
  };

  // Update existing medicine
  const handleEditMedicine = async (medicineData: Omit<Medicine, 'id' | 'compteurPiles'>) => {
    if (!editingMedicine?.id) return false;

    try {
      const response = await fetch(`/api/medicaments/${editingMedicine.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(medicineData),
      });

      if (!response.ok) {
        throw new Error('Failed to update medicine');
      }

      const updatedMedicine = await response.json();
      setMedicines(prev =>
        prev.map(med => med.id === editingMedicine.id ? updatedMedicine : med)
      );
      setEditingMedicine(null);
      return true;
    } catch (error) {
      console.error('Error updating medicine:', error);
      setError('Erreur lors de la mise à jour du médicament');
      return false;
    }
  };

  // Delete medicine
  const handleDeleteMedicine = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce médicament ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/medicaments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete medicine');
      }

      setMedicines(prev => prev.filter(med => med.id !== id));
    } catch (error) {
      console.error('Error deleting medicine:', error);
      setError('Erreur lors de la suppression du médicament');
    }
  };

  // Open edit form
  const openEditModal = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setShowForm(true);
  };

  // Close form
  const closeForm = () => {
    setShowForm(false);
    setEditingMedicine(null);
    setError('');
  };

  // Check if stock is low
  const isLowStock = (medicine: Medicine) => medicine.qteStock <= medicine.qteMinimum;

  // Get stock status color
  const getStockStatusColor = (medicine: Medicine) => {
    if (medicine.qteStock === 0) return 'text-red-600';
    if (isLowStock(medicine)) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Get stock status text
  const getStockStatusText = (medicine: Medicine) => {
    if (medicine.qteStock === 0) return 'Rupture de stock';
    if (isLowStock(medicine)) return 'Stock faible';
    return 'En stock';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Médicaments</h1>
          <p className="text-gray-600">Gérez votre inventaire de médicaments</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter un médicament</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Nom, description ou code-barres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Toutes les catégories</option>
              <option value="ANTIBIOTIQUE">Antibiotique</option>
              <option value="ANTI_INFLAMMATOIRE">Anti-inflammatoire</option>
              <option value="ANTALGIQUE">Antalgique</option>
              <option value="ANTIPYRETIQUE">Antipyrétique</option>
              <option value="ANTIVIRAL">Antiviral</option>
              <option value="VITAMINE">Vitamine</option>
              <option value="VACCIN">Vaccin</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredMedicines.length}</span> médicament(s) trouvé(s)
            </div>
          </div>
        </div>
      </div>

      {/* Medicines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMedicines.map((medicine) => (
          <div key={medicine.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {medicine.nomMedicament}
                  </h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategorieBadgeColors(medicine.categorie)}`}>
                      {getCategorieDisplayName(medicine.categorie)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {medicine.dosage} {getUniteDisplayName(medicine.uniteDosage)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/medicines/${medicine.id}`}
                    state={{ medicine }}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="Détails"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => openEditModal(medicine)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMedicine(medicine.id!)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {medicine.description}
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Code-barres:</span>
                  <span className="font-mono text-gray-900">{medicine.codeBarre39}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Vente:</span>
                  <span className="text-gray-900">
                    {medicine.perPile ? 'À l\'unité' : 'En paquet'}
                  </span>
                </div>

                {!medicine.perPile && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Taille paquet:</span>
                    <span className="text-gray-900">{medicine.defaultSize}</span>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Stock</span>
                  <span className={`text-sm font-semibold ${getStockStatusColor(medicine)}`}>
                    {medicine.qteStock}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{getStockStatusText(medicine)}</span>
                  {isLowStock(medicine) && (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                </div>

                {medicine.compteurPiles !== undefined && medicine.compteurPiles > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Compteur unités: {medicine.compteurPiles}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMedicines.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun médicament trouvé</h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Essayez de modifier vos critères de recherche'
              : 'Commencez par ajouter votre premier médicament'
            }
          </p>
        </div>
      )}

      {/* Medicine Form Modal */}
      {showForm && (
        <MedicineForm
          initialData={editingMedicine}
          onSubmit={editingMedicine ? handleEditMedicine : handleAddMedicine}
          onCancel={closeForm}
        />
      )}
    </div>
  );
};

export default Medicines;