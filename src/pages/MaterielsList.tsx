import React, { useState, useEffect } from 'react';
import { Search, Filter, Package, AlertTriangle, Eye, Edit, Trash2 } from 'lucide-react';
import { Materiel, CategorieMateriels, Unite, getCategorieDisplayName, getUniteDisplayName, getCategorieBadgeColors } from '../types/materiel';
import MaterielForm from '../components/MaterielForm';

const MaterielsList = () => {
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [filteredMateriels, setFilteredMateriels] = useState<Materiel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMateriel, setEditingMateriel] = useState<Materiel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch materiels from API
  const fetchMateriels = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://196.12.203.182/api/consultations/medicaments');
      if (!response.ok) {
        throw new Error('Failed to fetch materiels');
      }
      const data = await response.json();
      setMateriels(data);
      setFilteredMateriels(data);
    } catch (error) {
      console.error('Error fetching materiels:', error);
      setError('Erreur lors du chargement des matériels');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMateriels();
  }, []);

  // Filter materiels based on search term, category, and stock
  useEffect(() => {
    let filtered = materiels;

    if (searchTerm) {
      filtered = filtered.filter(materiel =>
        materiel.nomMedicament.toLowerCase().includes(searchTerm.toLowerCase()) ||
        materiel.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        materiel.codeBarre39.includes(searchTerm)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(materiel => materiel.categorie === selectedCategory);
    }

    if (stockFilter !== 'all') {
      switch (stockFilter) {
        case 'low':
          filtered = filtered.filter(materiel => materiel.qteStock <= materiel.qteMinimum);
          break;
        case 'out':
          filtered = filtered.filter(materiel => materiel.qteStock === 0);
          break;
        case 'normal':
          filtered = filtered.filter(materiel => materiel.qteStock > materiel.qteMinimum);
          break;
      }
    }

    setFilteredMateriels(filtered);
  }, [materiels, searchTerm, selectedCategory, stockFilter]);

  // Update existing materiel
  const handleEditMateriel = async (materielData: Omit<Materiel, 'id' | 'compteurPiles'>) => {
    if (!editingMateriel?.id) return false;

    try {
      const response = await fetch(`https://196.12.203.182/api/consultations/medicaments/${editingMateriel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materielData),
      });

      if (!response.ok) {
        throw new Error('Failed to update materiel');
      }

      const updatedMateriel = await response.json();
      setMateriels(prev =>
        prev.map(mat => mat.id === editingMateriel.id ? updatedMateriel : mat)
      );
      setEditingMateriel(null);
      setShowForm(false);
      return true;
    } catch (error) {
      console.error('Error updating materiel:', error);
      setError('Erreur lors de la mise à jour du matériel');
      return false;
    }
  };

  // Delete materiel
  const handleDeleteMateriel = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce matériel ?')) {
      return;
    }

    try {
      const response = await fetch(`https://196.12.203.182/api/consultations/medicaments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete materiel');
      }

      setMateriels(prev => prev.filter(mat => mat.id !== id));
    } catch (error) {
      console.error('Error deleting materiel:', error);
      setError('Erreur lors de la suppression du matériel');
    }
  };

  // Open edit form
  const openEditModal = (materiel: Materiel) => {
    setEditingMateriel(materiel);
    setShowForm(true);
  };

  // Close form
  const closeForm = () => {
    setShowForm(false);
    setEditingMateriel(null);
    setError('');
  };

  // Check if stock is low
  const isLowStock = (materiel: Materiel) => materiel.qteStock <= materiel.qteMinimum;

  // Get stock status color
  const getStockStatusColor = (materiel: Materiel) => {
    if (materiel.qteStock === 0) return 'text-red-600';
    if (isLowStock(materiel)) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Get stock status text
  const getStockStatusText = (materiel: Materiel) => {
    if (materiel.qteStock === 0) return 'Rupture de stock';
    if (isLowStock(materiel)) return 'Stock faible';
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
          <h1 className="text-2xl font-bold text-gray-800">Liste des Matériels</h1>
          <p className="text-gray-600">Vue d'ensemble de tous les matériels en stock</p>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-medium">{filteredMateriels.length}</span> matériel(s) trouvé(s)
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
              <option value={CategorieMateriels.EQUIPEMENT_MEDICAL}>Équipement médical</option>
              <option value={CategorieMateriels.MATERIEL_JETABLE}>Matériel jetable</option>
              <option value={CategorieMateriels.MATERIEL_HYGIENE}>Matériel d'hygiène</option>
              <option value={CategorieMateriels.MATERIEL_DIAGNOSTIC}>Matériel de diagnostic</option>
              <option value={CategorieMateriels.MATERIEL_PROTECTION}>Matériel de protection</option>
              <option value={CategorieMateriels.MATERIEL_URGENCE}>Matériel d'urgence</option>
              <option value={CategorieMateriels.FOURNITURE_BUREAU}>Fourniture de bureau</option>
              <option value={CategorieMateriels.AUTRE}>Autre</option>
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
              onClick={() => window.location.href = '/materiels'}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>Vue grille</span>
            </button>
          </div>
        </div>
      </div>

      {/* Materiels Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matériel
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
              {filteredMateriels.map((materiel) => (
                <tr key={materiel.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {materiel.nomMedicament}
                        </div>
                        <div className="text-sm text-gray-500">
                          {materiel.dosage} {getUniteDisplayName(materiel.uniteDosage)}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {materiel.codeBarre39}
                        </div>
                      </div>
                      {isLowStock(materiel) && (
                        <AlertTriangle className="w-5 h-5 text-yellow-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategorieBadgeColors(materiel.categorie)}`}>
                      {getCategorieDisplayName(materiel.categorie)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className={`font-semibold ${getStockStatusColor(materiel)}`}>
                        {materiel.qteStock}
                      </span>
                      {!materiel.perPile && ` / ${materiel.defaultSize}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getStockStatusText(materiel)}
                    </div>
                    {materiel.compteurPiles !== undefined && materiel.compteurPiles > 0 && (
                      <div className="text-xs text-blue-600">
                        Compteur: {materiel.compteurPiles}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {materiel.perPile ? 'À l\'unité' : 'En lot'}
                    </div>
                    {!materiel.perPile && (
                      <div className="text-xs text-gray-500">
                        {materiel.defaultSize} unités
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(materiel)}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMateriel(materiel.id!)}
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
      {filteredMateriels.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun matériel trouvé</h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory !== 'all' || stockFilter !== 'all'
              ? 'Essayez de modifier vos critères de recherche'
              : 'Commencez par ajouter votre premier matériel'
            }
          </p>
        </div>
      )}

      {/* Materiel Form Modal */}
      {showForm && (
        <MaterielForm
          initialData={editingMateriel}
          onSubmit={handleEditMateriel}
          onCancel={closeForm}
        />
      )}
    </div>
  );
};

export default MaterielsList;
