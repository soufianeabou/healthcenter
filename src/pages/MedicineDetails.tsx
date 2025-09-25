import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Code39Barcode from '../components/Code39Barcode';
import MedicineForm from '../components/MedicineForm';
import { Medicine, getUniteDisplayName, getCategorieDisplayName, getCategorieBadgeColors } from '../types/medicine';

const BatteryBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
  const clamped = Math.max(0, Math.min(max, value));
  const percent = max > 0 ? (clamped / max) * 100 : 0;
  const color = percent === 0 ? 'bg-red-500' : percent < 33 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-48 h-6 border border-gray-300 rounded-sm overflow-hidden bg-gray-100">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-sm text-gray-700">{clamped} / {max}</span>
    </div>
  );
};

const MedicineDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const preloaded: Medicine | undefined = (location.state as any)?.medicine;
  const [medicine, setMedicine] = useState<Medicine | null>(preloaded || null);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    if (preloaded) return;
    const fetchOne = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/medicaments/${id}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setMedicine(data);
      } catch (e) {
        setError("Erreur lors du chargement du médicament");
      } finally {
        setLoading(false);
      }
    };
    fetchOne();
  }, [id, preloaded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error || 'Médicament introuvable'}</p>
      </div>
    );
  }

  const remainingUnits = medicine.perPile ? Math.max(0, (medicine.defaultSize || 0) - (medicine.compteurPiles || 0)) : 0;

  const handleEdit = async (data: Omit<Medicine, 'id' | 'compteurPiles'>) => {
    try {
      const response = await fetch(`/api/medicaments/${medicine?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedMedicine = await response.json();
        setMedicine(updatedMedicine);
        setShowEditForm(false);
        setEditSuccess(true);
        setTimeout(() => setEditSuccess(false), 3000);
        return true;
      } else {
        throw new Error('Failed to update medicine');
      }
    } catch (error) {
      console.error('Error updating medicine:', error);
      return false;
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{medicine.nomMedicament}</h1>
          <div className="flex items-center space-x-3 mt-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategorieBadgeColors(medicine.categorie)}`}>
              {getCategorieDisplayName(medicine.categorie)}
            </span>
            <p className="text-gray-600">{medicine.dosage} {getUniteDisplayName(medicine.uniteDosage)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowEditForm(true)} 
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Modifier</span>
          </button>
          <button onClick={() => navigate(-1)} className="px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Retour</button>
        </div>
      </div>

      {/* Success Message */}
      {editSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">✅ Médicament modifié avec succès !</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Code-barres (Code 3 of 9)</h2>
            <Code39Barcode value={medicine.codeBarre39} height={80} barWidth={2} />
            <div className="text-sm text-gray-600">{medicine.codeBarre39}</div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Informations</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-gray-500">Type de stockage</div>
              <div className="text-gray-900">{medicine.perPile ? "À l'unité" : 'En paquet'}</div>
              <div className="text-gray-500">Taille par paquet</div>
              <div className="text-gray-900">{medicine.defaultSize}</div>
              <div className="text-gray-500">Quantité en stock</div>
              <div className="text-gray-900">{medicine.qteStock}</div>
              <div className="text-gray-500">Quantité minimum</div>
              <div className="text-gray-900">{medicine.qteMinimum}</div>
            </div>

            {medicine.perPile && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Unités restantes (paquet courant)</div>
                <BatteryBar value={remainingUnits} max={medicine.defaultSize || 0} />
              </div>
            )}

            {/* Stock Status */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Statut du stock</div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                medicine.qteStock <= medicine.qteMinimum 
                  ? 'bg-red-100 text-red-800' 
                  : medicine.qteStock <= medicine.qteMinimum * 1.5 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
              }`}>
                {medicine.qteStock <= medicine.qteMinimum 
                  ? 'Stock faible' 
                  : medicine.qteStock <= medicine.qteMinimum * 1.5 
                    ? 'Stock modéré' 
                    : 'Stock suffisant'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
        <p className="text-gray-700 whitespace-pre-line">{medicine.description}</p>
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <MedicineForm
          initialData={medicine}
          onSubmit={handleEdit}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
};

export default MedicineDetails;


