import React, { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { ExitStock } from '../types/stock';
import { Medicine } from '../types/medicine';

interface ExitStockFormProps {
  initialData?: ExitStock | null;
  onSubmit: (data: Omit<ExitStock, 'id'>) => Promise<boolean>;
  onCancel: () => void;
  isEdit?: boolean;
}

const ExitStockForm: React.FC<ExitStockFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isEdit = false 
}) => {
  const [formData, setFormData] = useState({
    medicamentId: '',
    dateSortie: new Date().toISOString().split('T')[0],
    qte: 1,
    motif: '',
    beneficiaire: ''
  });

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMedicines();
    
    if (initialData) {
      setFormData({
        medicamentId: String(initialData.medicament.id),
        dateSortie: initialData.dateSortie.split('T')[0],
        qte: initialData.qte,
        motif: initialData.motif,
        beneficiaire: initialData.beneficiaire || ''
      });
    }
  }, [initialData]);

  const fetchMedicines = async () => {
    try {
      const response = await fetch('/api/medicaments');
      if (response.ok) {
        const data = await response.json();
        setMedicines(data);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.medicamentId) {
      newErrors.medicamentId = 'Le médicament est requis';
    }

    if (!formData.dateSortie) {
      newErrors.dateSortie = 'La date de sortie est requise';
    }

    if (formData.qte <= 0) {
      newErrors.qte = 'La quantité doit être supérieure à 0';
    }

    if (!formData.motif.trim()) {
      newErrors.motif = 'Le motif est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const selectedMedicine = medicines.find(m => m.id === parseInt(formData.medicamentId));

      if (!selectedMedicine) {
        throw new Error('Médicament non trouvé');
      }

      const submitData = {
        medicament: {
          id: selectedMedicine.id!,
          nomMedicament: selectedMedicine.nomMedicament,
          codeBarre39: selectedMedicine.codeBarre39
        },
        dateSortie: new Date(formData.dateSortie).toISOString(),
        qte: formData.qte,
        motif: formData.motif,
        beneficiaire: formData.beneficiaire || undefined
      };

      const success = await onSubmit(submitData);
      if (success) {
        onCancel();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Modifier la sortie de stock' : 'Nouvelle sortie de stock'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Médicament */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Médicament *
              </label>
              <select
                name="medicamentId"
                value={formData.medicamentId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.medicamentId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner un médicament</option>
                {medicines.map((medicine) => (
                  <option key={medicine.id} value={medicine.id}>
                    {medicine.nomMedicament} - {medicine.codeBarre39}
                  </option>
                ))}
              </select>
              {errors.medicamentId && (
                <p className="mt-1 text-sm text-red-600">{errors.medicamentId}</p>
              )}
            </div>

            {/* Date de sortie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de sortie *
              </label>
              <input
                type="date"
                name="dateSortie"
                value={formData.dateSortie}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.dateSortie ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.dateSortie && (
                <p className="mt-1 text-sm text-red-600">{errors.dateSortie}</p>
              )}
            </div>

            {/* Quantité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité *
              </label>
              <input
                type="number"
                name="qte"
                value={formData.qte}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.qte ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.qte && (
                <p className="mt-1 text-sm text-red-600">{errors.qte}</p>
              )}
            </div>

            {/* Bénéficiaire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bénéficiaire
              </label>
              <input
                type="text"
                name="beneficiaire"
                value={formData.beneficiaire}
                onChange={handleChange}
                placeholder="Nom du bénéficiaire (optionnel)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Motif */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif *
              </label>
              <textarea
                name="motif"
                value={formData.motif}
                onChange={handleChange}
                rows={3}
                placeholder="Décrivez le motif de la sortie..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.motif ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.motif && (
                <p className="mt-1 text-sm text-red-600">{errors.motif}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Plus size={16} />
                  <span>{isEdit ? 'Modifier' : 'Créer'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExitStockForm;
