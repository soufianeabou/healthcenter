import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye } from 'lucide-react';

interface Medicament {
  id: number;
  nomMedicament: string;
  codeBarre39: string;
  dosage?: number;
  uniteDosage?: string;
}

interface Consultation {
  id: number;
  patient?: {
    nom: string;
    prenom: string;
    idNum: number;
  };
}

interface ExitStock {
  id: number;
  consultation: Consultation;
  medicament: Medicament;
  parUnite: boolean;
  quantite: number;
  dateSortie: string;
}

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
      const response = await fetch('https://196.12.203.182/api/consultations/sortiestocks');
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
      filtered = filtered.filter(stock => {
        const medicamentMatch = stock.medicament.nomMedicament.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.medicament.codeBarre39.includes(searchTerm);
        
        const patientName = stock.consultation.patient 
          ? `${stock.consultation.patient.prenom} ${stock.consultation.patient.nom}`.toLowerCase()
          : '';
        const patientMatch = patientName.includes(searchTerm.toLowerCase());
        
        return medicamentMatch || patientMatch;
      });
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

  const getPatientDisplay = (consultation: Consultation) => {
    if (consultation.patient) {
      return `${consultation.patient.prenom} ${consultation.patient.nom} #${consultation.patient.idNum}`;
    }
    return `Consultation #${consultation.id}`;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Consultation des Sorties de Stock</h1>
          <p className="text-gray-600">Consultez l'historique des sorties de médicaments</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par médicament, code-barres ou patient..."
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError('')} className="text-red-600 underline text-sm mt-2">Fermer</button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Médicament
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de Sortie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
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
                      <div className="text-sm text-gray-900">
                        {getPatientDisplay(stock.consultation)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(stock.dateSortie)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{stock.quantite}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        stock.parUnite ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {stock.parUnite ? 'Par unité' : 'Par paquet'}
                      </span>
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Total: <span className="font-medium">{filteredStocks.length}</span> sortie(s)
          </div>
          <button
            onClick={() => {
              console.log('Export clicked');
            }}
            className="px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Exporter</span>
          </button>
        </div>
      </div>

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
                  {selectedStock.medicament.dosage && (
                    <p className="text-sm text-gray-500">
                      {selectedStock.medicament.dosage} {selectedStock.medicament.uniteDosage}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Patient</h3>
                  <p className="text-lg font-medium text-gray-900">
                    {getPatientDisplay(selectedStock.consultation)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Date de Sortie</h3>
                  <p className="text-lg font-medium text-gray-900">{formatDate(selectedStock.dateSortie)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Quantité</h3>
                  <p className="text-lg font-medium text-gray-900">{selectedStock.quantite}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Mode de sortie</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedStock.parUnite ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {selectedStock.parUnite ? 'Par unité' : 'Par paquet'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Consultation ID</h3>
                  <p className="text-lg font-medium text-gray-900">#{selectedStock.consultation.id}</p>
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