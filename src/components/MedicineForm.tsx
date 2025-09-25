import React, { useState, useEffect } from 'react';
import { X, Save, Edit } from 'lucide-react';
import { Medicine, CategorieMedicament, Unite, getCategorieDisplayName, getUniteDisplayName } from '../types/medicine';

interface MedicineFormProps {
  initialData?: Medicine | null;
  onSubmit: (data: Omit<Medicine, 'id' | 'compteurPiles'>) => Promise<boolean>;
  onCancel: () => void;
}

const MedicineForm: React.FC<MedicineFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    nomMedicament: '',
    description: '',
    codeBarre39: '',
    perPile: false,
    categorie: CategorieMedicament.AUTRE,
    dosage: 0,
    uniteDosage: Unite.MG,
    defaultSize: 1,
    qteStock: 0,
    qteMinimum: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [dosageInput, setDosageInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        nomMedicament: initialData.nomMedicament,
        description: initialData.description,
        codeBarre39: initialData.codeBarre39,
        perPile: initialData.perPile,
        categorie: initialData.categorie,
        dosage: initialData.dosage,
        uniteDosage: initialData.uniteDosage,
        defaultSize: initialData.defaultSize,
        qteStock: initialData.qteStock,
        qteMinimum: initialData.qteMinimum
      });
      setDosageInput(String(initialData.dosage ?? ''));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'dosageInput') {
      setDosageInput(value);
      const normalized = (value || '').replace(',', '.');
      const parsed = parseFloat(normalized);
      setFormData(prev => ({ ...prev, dosage: isNaN(parsed) ? 0 : parsed }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
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

    if (!formData.nomMedicament.trim()) {
      newErrors.nomMedicament = 'Le nom du médicament est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (!formData.codeBarre39.trim()) {
      newErrors.codeBarre39 = 'Le code-barres est requis';
    }

    if (formData.dosage <= 0) {
      newErrors.dosage = 'La taille du dosage doit être supérieure à 0';
    }

    if (formData.defaultSize <= 0) {
      newErrors.defaultSize = 'La taille par défaut doit être supérieure à 0';
    }

    if (formData.qteStock < 0) {
      newErrors.qteStock = 'La quantité en stock ne peut pas être négative';
    }

    if (formData.qteMinimum < 0) {
      newErrors.qteMinimum = 'La quantité minimum ne peut pas être négative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await onSubmit(formData);
      if (success) {
        onCancel(); // Close form on success
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Modifier le médicament' : 'Ajouter un nouveau médicament'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du médicament *
              </label>
              <input
                type="text"
                name="nomMedicament"
                value={formData.nomMedicament}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.nomMedicament ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Paracétamol"
              />
              {errors.nomMedicament && (
                <p className="mt-1 text-sm text-red-600">{errors.nomMedicament}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code-barres *
              </label>
              <input
                type="text"
                name="codeBarre39"
                value={formData.codeBarre39}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.codeBarre39 ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: 1234567890123"
              />
              {errors.codeBarre39 && (
                <p className="mt-1 text-sm text-red-600">{errors.codeBarre39}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Description détaillée du médicament"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Category and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {Object.values(CategorieMedicament).map((categorie) => (
                  <option key={categorie} value={categorie}>
                    {getCategorieDisplayName(categorie)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosage *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  inputMode="decimal"
                  name="dosageInput"
                  value={dosageInput}
                  onChange={handleChange}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.dosage ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1.5"
                />
                <select
                  name="uniteDosage"
                  value={formData.uniteDosage}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {Object.values(Unite).map((unite) => (
                    <option key={unite} value={unite}>
                      {getUniteDisplayName(unite)}
                    </option>
                  ))}
                </select>
              </div>
              {errors.dosage && (
                <p className="mt-1 text-sm text-red-600">{errors.dosage}</p>
              )}
            </div>
          </div>

          {/* Unit sale toggle - separate full row */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vente à l'unité
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="perPile"
                checked={formData.perPile}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">
                {formData.perPile ? 'Vendu à l\'unité' : 'Vendu en paquet'}
              </span>
            </label>
          </div>

          {/* Stock Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taille par paquet *
              </label>
              <input
                type="number"
                name="defaultSize"
                value={formData.defaultSize}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.defaultSize ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="20"
              />
              {errors.defaultSize && (
                <p className="mt-1 text-sm text-red-600">{errors.defaultSize}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité en stock *
              </label>
              <input
                type="number"
                name="qteStock"
                value={formData.qteStock}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.qteStock ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="100"
              />
              {errors.qteStock && (
                <p className="mt-1 text-sm text-red-600">{errors.qteStock}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité minimum (alerte) *
              </label>
              <input
                type="number"
                name="qteMinimum"
                value={formData.qteMinimum}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.qteMinimum ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="10"
              />
              {errors.qteMinimum && (
                <p className="mt-1 text-sm text-red-600">{errors.qteMinimum}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  {initialData ? <Edit className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  <span>{initialData ? 'Mettre à jour' : 'Enregistrer'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicineForm;