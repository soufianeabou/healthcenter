import React from 'react';
import { X, Edit, Trash2, Download } from 'lucide-react';
import { EntryStock } from '../types/stock';

interface BadgeDetailProps {
  badge: string;
  stocks: EntryStock[];
  onClose: () => void;
  onEdit: (stock: EntryStock) => void;
  onDelete: (id: number) => void;
}

const BadgeDetail: React.FC<BadgeDetailProps> = ({ 
  badge, 
  stocks, 
  onClose, 
  onEdit, 
  onDelete 
}) => {
  if (stocks.length === 0) return null;

  const firstStock = stocks[0];
  const totalQuantity = stocks.reduce((sum, stock) => sum + stock.qte, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const handleExport = () => {
    // Export functionality for this specific badge
    const data = {
      badge,
      supplier: firstStock.fournisseur,
      dateEntre: firstStock.dateEntre,
      totalMedicines: stocks.length,
      totalQuantity,
      medicines: stocks.map(stock => ({
        nom: stock.medicament.nomMedicament,
        dosage: `${stock.medicament.dosage} ${stock.medicament.uniteDosage}`,
        codeBarre: stock.medicament.codeBarre39,
        quantite: stock.qte
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lot-${badge}-${formatDate(firstStock.dateEntre)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Détails du Lot: {badge}</h2>
            <p className="text-gray-600">Informations complètes sur ce lot d'entrée de stock</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              className="px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Exporter</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Batch Summary */}
        <div className="p-6 bg-blue-50 border-b border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{stocks.length}</div>
              <div className="text-sm text-blue-700">Médicaments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{totalQuantity}</div>
              <div className="text-sm text-blue-700">Quantité totale</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">{firstStock.fournisseur.nomFournisseur}</div>
              <div className="text-sm text-blue-700">Fournisseur</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">{formatDate(firstStock.dateEntre)}</div>
              <div className="text-sm text-blue-700">Date d'entrée</div>
            </div>
          </div>
        </div>

        {/* Supplier Information */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du fournisseur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Nom</label>
              <p className="text-sm text-gray-900">{firstStock.fournisseur.nomFournisseur}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Téléphone</label>
              <p className="text-sm text-gray-900">{firstStock.fournisseur.telephone || 'Non spécifié'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Type</label>
              <p className="text-sm text-gray-900">{firstStock.fournisseur.typeFournisseur || 'Non spécifié'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Adresse</label>
              <p className="text-sm text-gray-900">{firstStock.fournisseur.adresse || 'Non spécifiée'}</p>
            </div>
          </div>
        </div>

        {/* Medicines List */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Médicaments du lot</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Médicament
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dosage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code-barres
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {stock.medicament.nomMedicament}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stock.medicament.dosage} {stock.medicament.uniteDosage}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {stock.medicament.codeBarre39}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {stock.qte}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onEdit(stock)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => stock.id && onDelete(stock.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default BadgeDetail;
