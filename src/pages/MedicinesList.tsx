import React, { useState, useEffect } from 'react';
import { Search, Filter, Package, AlertTriangle, Eye, Edit, Trash2 } from 'lucide-react';
import { Medicine, getCategorieDisplayName, getUniteDisplayName, getCategorieBadgeColors } from '../types/medicine';
import MedicineForm from '../components/MedicineForm';

const MedicinesList = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
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

  // Filter medicines based on search term, category, and stock
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

    if (stockFilter !== 'all') {
      switch (stockFilter) {
        case 'low':
          filtered = filtered.filter(medicine => medicine.qteStock <= medicine.qteMinimum);
          break;
        case 'out':
          filtered = filtered.filter(medicine => medicine.qteStock === 0);
          break;
        case 'normal':
          filtered = filtered.filter(medicine => medicine.qteStock > medicine.qteMinimum);
          break;
      }
    }

    setFilteredMedicines(filtered);
  }, [medicines, searchTerm, selectedCategory, stockFilter]);

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
      setShowForm(false);
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
          <h1 className="text-2xl font-bold text-gray-800">Liste des Médicaments</h1>
          <p className="text-gray-600">Vue d'ensemble de tous les médicaments en stock</p>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-medium">{filteredMedicines.length}</span> médicament(s) trouvé(s)
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">État du stock</label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tous les états</option>
              <option value="normal">Stock normal</option>
              <option value="low">Stock faible</option>
              <option value="out">Rupture de stock</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => window.location.href = '/medicines'}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>Vue grille</span>
            </button>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Médicament
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMedicines.map((medicine) => (
                <tr key={medicine.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {medicine.nomMedicament}
                        </div>
                        <div className="text-sm text-gray-500">
                          {medicine.dosage} {getUniteDisplayName(medicine.uniteDosage)}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {medicine.codeBarre39}
                        </div>
                      </div>
                      {isLowStock(medicine) && (
                        <AlertTriangle className="w-5 h-5 text-yellow-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategorieBadgeColors(medicine.categorie)}`}>
                      {getCategorieDisplayName(medicine.categorie)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className={`font-semibold ${getStockStatusColor(medicine)}`}>
                        {medicine.qteStock}
                      </span>
                      {!medicine.perPile && ` / ${medicine.defaultSize}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getStockStatusText(medicine)}
                    </div>
                    {medicine.compteurPiles !== undefined && medicine.compteurPiles > 0 && (
                      <div className="text-xs text-blue-600">
                        Compteur: {medicine.compteurPiles}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {medicine.perPile ? 'À l\'unité' : 'En paquet'}
                    </div>
                    {!medicine.perPile && (
                      <div className="text-xs text-gray-500">
                        {medicine.defaultSize} unités
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(medicine)}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMedicine(medicine.id!)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredMedicines.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun médicament trouvé</h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory !== 'all' || stockFilter !== 'all'
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
          onSubmit={handleEditMedicine}
          onCancel={closeForm}
        />
      )}
    </div>
  );
};

export default MedicinesList;
