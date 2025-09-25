import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Download, Eye, PackagePlus } from 'lucide-react';
import { EntryStock } from '../types/stock';
import EntryStockForm from '../components/EntryStockForm';

const EntryStockPage: React.FC = () => {
  const [entryStocks, setEntryStocks] = useState<EntryStock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<EntryStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStock, setEditingStock] = useState<EntryStock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  useEffect(() => {
    fetchEntryStocks();
  }, []);

  useEffect(() => {
    filterStocks();
  }, [entryStocks, searchTerm, filterDate]);

  const fetchEntryStocks = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await fetch('/api/entreStocks');
      if (response.ok) {
        const data = await response.json();
        setEntryStocks(data);
      } else {
        throw new Error('Failed to fetch entry stocks');
      }
    } catch (error) {
      setError('Erreur lors du chargement des entrées de stock');
      console.error('Error fetching entry stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStocks = () => {
    let filtered = [...entryStocks];

    if (searchTerm) {
      filtered = filtered.filter(stock =>
        stock.medicament.nomMedicament.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.medicament.dosage?.toString().includes(searchTerm) ||
        stock.medicament.uniteDosage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.medicament.codeBarre39.includes(searchTerm) ||
        stock.fournisseur.nomFournisseur.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.fournisseur.telephone?.includes(searchTerm) ||
        stock.fournisseur.typeFournisseur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.badge.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDate) {
      filtered = filtered.filter(stock =>
        stock.dateEntre.startsWith(filterDate)
      );
    }

    setFilteredStocks(filtered);
  };

  const handleCreate = async (data: { supplier: any; badge: string; dateEntre: string; medicines: any[] }) => {
    try {
      // Create multiple entry stocks - one for each medicine
      const promises = data.medicines.map(async (medicine) => {
        const entryStockData = {
          medicament: {
            id: parseInt(medicine.medicamentId),
            nomMedicament: '', // Will be filled by backend
            codeBarre39: '' // Will be filled by backend
          },
          fournisseur: {
            id: data.supplier.id,
            nomFournisseur: data.supplier.nomFournisseur
          },
          dateEntre: data.dateEntre,
          qte: medicine.qte,
          badge: data.badge,
          unite_prix: medicine.unitPrice
        };

        console.log('Sending entry stock data:', entryStockData);
        console.log('Medicine unit price:', medicine.unitPrice);

        const response = await fetch('/api/entreStocks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entryStockData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create entry stock for medicine ${medicine.medicamentId}`);
        }

        return response.json();
      });

      // Wait for all entries to be created
      await Promise.all(promises);
      
      // Refresh the list
      await fetchEntryStocks();
      return true;
    } catch (error) {
      console.error('Error creating entry stocks:', error);
      return false;
    }
  };

  const handleUpdate = async (data: { supplier: any; badge: string; dateEntre: string; medicines: { medicamentId: string; qte: number; unitPrice?: number }[] }) => {
    if (!editingStock?.id) return false;

    try {
      // In edit mode we only allow a single medicine row; take the first
      const first = data.medicines[0];
      if (!first) throw new Error('Aucun médicament sélectionné');

      // Build backend-expected payload
      const payload = {
        id: editingStock.id,
        medicament: {
          id: parseInt(first.medicamentId)
        },
        fournisseur: {
          id: data.supplier.id
        },
        dateEntre: data.dateEntre, // YYYY-MM-DD
        qte: first.qte,
        badge: data.badge,
        unite_prix: first.unitPrice
      };

      console.log('Sending update payload:', payload);
      console.log('First medicine unit price:', first.unitPrice);

      const response = await fetch(`/api/entreStocks/${editingStock.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchEntryStocks();
        return true;
      } else {
        throw new Error('Failed to update entry stock');
      }
    } catch (error) {
      console.error('Error updating entry stock:', error);
      return false;
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette entrée de stock ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/entreStocks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchEntryStocks();
      } else {
        throw new Error('Failed to delete entry stock');
      }
    } catch (error) {
      console.error('Error deleting entry stock:', error);
    }
  };

  const handleEdit = (stock: EntryStock) => {
    setEditingStock(stock);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingStock(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Group stocks by badge
  const stocksByBadge = filteredStocks.reduce((acc, stock) => {
    if (!acc[stock.badge]) {
      acc[stock.badge] = [];
    }
    acc[stock.badge].push(stock);
    return acc;
  }, {} as Record<string, EntryStock[]>);

  const getUnitPrice = (s: EntryStock) => s.unitPrice ?? s.unite_prix ?? 0;
  const itemTotal = (s: EntryStock) => (s.qte || 0) * getUnitPrice(s);

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
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Entrées de Stock</h1>
          <p className="text-gray-600">Gérez les entrées de médicaments en stock par lots</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <PackagePlus size={16} />
          <span>Nouveau Lot</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom médicament, dosage, code-barres, fournisseur, type fournisseur ou badge..."
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

      {/* Badge Groups */}
      <div className="space-y-6">
        {Object.keys(stocksByBadge).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">
              {searchTerm || filterDate ? 'Aucun résultat trouvé' : 'Aucune entrée de stock'}
            </p>
          </div>
        ) : (
          Object.entries(stocksByBadge).map(([badge, stocks]) => (
            <div key={badge} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Badge Header */}
              <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Lot: {badge}</h3>
                    <div className="text-sm text-blue-700">
                      <span className="font-medium">{stocks.length}</span> médicament(s) • 
                      Fournisseur: <span className="font-medium">{stocks[0].fournisseur.nomFournisseur}</span> • 
                      Date: <span className="font-medium">{formatDate(stocks[0].dateEntre)}</span>
                      {/* Badge total */}
                      <span className="ml-2 font-semibold text-blue-900">• Total lot: {stocks.reduce((sum, s) => sum + itemTotal(s), 0)} MAD</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBadge(selectedBadge === badge ? null : badge)}
                    className="text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-2"
                  >
                    <Eye size={16} />
                    <span>{selectedBadge === badge ? 'Masquer' : 'Voir détails'}</span>
                  </button>
                </div>
              </div>

              {/* Badge Details */}
              {selectedBadge === badge && (
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stocks.map((stock) => (
                      <div key={stock.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{stock.medicament.nomMedicament}</h4>
                            <p className="text-sm text-gray-500">
                              {stock.medicament.dosage} {stock.medicament.uniteDosage}
                            </p>
                            <p className="text-sm text-gray-500">Code: {stock.medicament.codeBarre39}</p>
                            <p className="text-sm font-medium text-green-600">Quantité: {stock.qte}</p>
                            <p className="text-sm text-gray-700">Prix unitaire: {getUnitPrice(stock)} MAD</p>
                            <p className="text-sm font-semibold text-gray-900">Total: {itemTotal(stock)} MAD</p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleEdit(stock)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => stock.id && handleDelete(stock.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Total: <span className="font-medium">{Object.keys(stocksByBadge).length}</span> lot(s) • 
            <span className="font-medium"> {filteredStocks.length}</span> entrée(s)
          </div>
          <div className="text-sm text-gray-900 font-semibold">
            Montant total filtré: {filteredStocks.reduce((sum, s) => sum + itemTotal(s), 0)} MAD
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <EntryStockForm
          initialData={editingStock}
          onSubmit={editingStock ? handleUpdate : handleCreate}
          onCancel={handleCancelForm}
          isEdit={!!editingStock}
        />
      )}
    </div>
  );
};

export default EntryStockPage;
