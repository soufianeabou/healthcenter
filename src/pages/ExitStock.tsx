import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye } from 'lucide-react';
import { ExitStock } from '../types/stock';

const ExitStockPage: React.FC = () => {
  const [exitStocks, setExitStocks] = useState<ExitStock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<ExitStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedStock, setSelectedStock] = useState<ExitStock | null>(null);

  useEffect(() => {
    fetchExitStocks();
  }, []);

  useEffect(() => {
    filterStocks();
  }, [exitStocks, searchTerm, filterDate]);

  const fetchExitStocks = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await fetch('/api/sortie-stock');
      if (response.ok) {
        const data = await response.json();
        setExitStocks(data);
      } else {
        throw new Error('Failed to fetch exit stocks');
      }
    } catch (error) {
      setError('Erreur lors du chargement des sorties de stock');
      console.error('Error fetching exit stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStocks = () => {
    let filtered = [...exitStocks];

    if (searchTerm) {
      filtered = filtered.filter(stock =>
        stock.medicament.nomMedicament.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.medicament.codeBarre39.includes(searchTerm) ||
        stock.motif.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (stock.beneficiaire && stock.beneficiaire.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterDate) {
      filtered = filtered.filter(stock =>
        stock.dateSortie.startsWith(filterDate)
      );
    }

    setFilteredStocks(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-800">Consultation des Sorties de Stock</h1>
          <p className="text-gray-600">Consultez l'historique des sorties de médicaments</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par médicament, code-barres, motif ou bénéficiaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400" size={20} />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Médicament
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de Sortie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motif
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bénéficiaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || filterDate ? 'Aucun résultat trouvé' : 'Aucune sortie de stock'}
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {stock.medicament.nomMedicament}
                        </div>
                        <div className="text-sm text-gray-500">
                          {stock.medicament.codeBarre39}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(stock.dateSortie)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{stock.qte}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={stock.motif}>
                        {stock.motif}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stock.beneficiaire || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedStock(stock)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Voir les détails"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Total: <span className="font-medium">{filteredStocks.length}</span> sortie(s)
          </div>
          <button
            onClick={() => {
              // Export functionality can be implemented here
              console.log('Export clicked');
            }}
            className="px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Détails de la Sortie de Stock</h2>
              <button
                onClick={() => setSelectedStock(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Médicament</h3>
                  <p className="text-lg font-medium text-gray-900">{selectedStock.medicament.nomMedicament}</p>
                  <p className="text-sm text-gray-500">{selectedStock.medicament.codeBarre39}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Date de Sortie</h3>
                  <p className="text-lg font-medium text-gray-900">{formatDate(selectedStock.dateSortie)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Quantité</h3>
                  <p className="text-lg font-medium text-gray-900">{selectedStock.qte}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Bénéficiaire</h3>
                  <p className="text-lg font-medium text-gray-900">
                    {selectedStock.beneficiaire || 'Non spécifié'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Motif</h3>
                  <p className="text-lg font-medium text-gray-900">{selectedStock.motif}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedStock(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExitStockPage;
