import React, { useState, useEffect } from 'react';
import { Search, Package } from 'lucide-react';
import { Materiel, getCategorieDisplayName, getCategorieBadgeColors, getStatusDisplayName, getStatusBadgeColors } from '../types/materiel';
import { useNavigate } from 'react-router-dom';

const MaterielsList = () => {
  const navigate = useNavigate();
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [filteredMateriels, setFilteredMateriels] = useState<Materiel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMateriels();
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Package className="w-6 h-6 mr-2 text-blue-600" />
          Liste des Matériels
        </h1>
        <p className="text-gray-600 mt-1">Consulter l'inventaire des matériels disponibles</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMateriels.map((materiel) => (
                  <tr 
                    key={materiel.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/materiels/${materiel.id}`)}
                  >
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
                    <td className="px-6 py-4">
                      {materiel.status && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColors(materiel.status)}`}>
                          {getStatusDisplayName(materiel.status)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterielsList;
