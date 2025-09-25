import React, { useState, useEffect } from 'react';
import { X, Save, Edit, Plus, Trash2 } from 'lucide-react';
import { EntryStock, Supplier } from '../types/stock';
import { Medicine } from '../types/medicine';

interface MedicineEntry {
  medicamentId: string;
  qte: number;
  unitPrice?: number;
}

interface EntryStockFormProps {
  initialData?: EntryStock | null;
  onSubmit: (data: { supplier: any; badge: string; dateEntre: string; medicines: MedicineEntry[] }) => Promise<boolean>;
  onCancel: () => void;
  isEdit?: boolean;
}

const EntryStockForm: React.FC<EntryStockFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isEdit = false 
}) => {
  const [formData, setFormData] = useState({
    fournisseurId: '',
    dateEntre: new Date().toISOString().split('T')[0],
    badge: ''
  });

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medicineEntries, setMedicineEntries] = useState<MedicineEntry[]>([
    { medicamentId: '', qte: 1, unitPrice: 0 }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [medicinesError, setMedicinesError] = useState('');
  const [suppliersError, setSuppliersError] = useState('');
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(false);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // Add a small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      fetchMedicines();
      fetchSuppliers();
    }, 100);
    
    if (initialData) {
      setFormData({
        fournisseurId: String(initialData.fournisseur.id),
        dateEntre: initialData.dateEntre.split('T')[0],
        badge: initialData.badge
      });
      setMedicineEntries([
        { 
          medicamentId: String(initialData.medicament.id), 
          qte: initialData.qte,
          unitPrice: initialData.unitPrice ?? initialData.unite_prix
        }
      ]);
    }
    
    return () => clearTimeout(timer);
  }, [initialData, isMounted]);

  const fetchMedicines = async () => {
    try {
      setIsLoadingMedicines(true);
      setMedicinesError('');
      
      const response = await fetch('/api/medicaments', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          if (isMounted) {
            setMedicines(data);
          }
        } else {
          if (isMounted) {
            setMedicinesError('Aucun médicament trouvé');
          }
        }
      } else {
        if (isMounted) {
          setMedicinesError(`Erreur ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      if (isMounted) {
        setMedicinesError('Erreur de connexion au serveur backend');
      }
    } finally {
      if (isMounted) {
        setIsLoadingMedicines(false);
      }
    }
  };

  const fetchSuppliers = async () => {
    try {
      setIsLoadingSuppliers(true);
      setSuppliersError('');
      
      // Test if the backend is accessible
      const response = await fetch('/api/fournisseurs', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          if (isMounted) {
            setSuppliers(data);
          }
        } else {
          if (isMounted) {
            setSuppliersError('Aucun fournisseur trouvé');
          }
        }
      } else {
        if (isMounted) {
          setSuppliersError(`Erreur ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      if (isMounted) {
        setSuppliersError('Erreur de connexion au serveur backend');
      }
    } finally {
      if (isMounted) {
        setIsLoadingSuppliers(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleMedicineChange = (index: number, field: keyof MedicineEntry, value: string | number) => {
    const newEntries = [...medicineEntries];
    if (field === 'qte') {
      newEntries[index][field] = parseInt(value as string) || 0;
    } else if (field === 'unitPrice') {
      const num = parseFloat(value as string);
      newEntries[index][field] = isNaN(num) ? 0 : Math.max(0, num);
    } else {
      newEntries[index][field] = value as string;
    }
    setMedicineEntries(newEntries);

    // Clear error for this field
    if (errors[`medicine_${index}_${field}`]) {
      setErrors(prev => ({ ...prev, [`medicine_${index}_${field}`]: '' }));
    }
  };

  const addMedicineRow = () => {
    setMedicineEntries([...medicineEntries, { medicamentId: '', qte: 1, unitPrice: 0 }]);
  };

  const removeMedicineRow = (index: number) => {
    if (medicineEntries.length > 1) {
      const newEntries = medicineEntries.filter((_, i) => i !== index);
      setMedicineEntries(newEntries);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fournisseurId) {
      newErrors.fournisseurId = 'Le fournisseur est requis';
    }

    if (!formData.dateEntre) {
      newErrors.dateEntre = 'La date d\'entrée est requise';
    }

    if (!formData.badge.trim()) {
      newErrors.badge = 'Le badge est requis';
    }
    
    if (formData.badge.length > 50) {
      newErrors.badge = 'Le badge ne peut pas dépasser 50 caractères';
    }

    // Validate each medicine entry
    medicineEntries.forEach((entry, index) => {
      if (!entry.medicamentId) {
        newErrors[`medicine_${index}_medicamentId`] = 'Le médicament est requis';
      }
      if (entry.qte <= 0) {
        newErrors[`medicine_${index}_qte`] = 'La quantité doit être supérieure à 0';
      }
      if (entry.qte > 10000) {
        newErrors[`medicine_${index}_qte`] = 'La quantité ne peut pas dépasser 10 000';
      }
      if (entry.unitPrice === undefined || entry.unitPrice === null || entry.unitPrice < 0) {
        newErrors[`medicine_${index}_unitPrice`] = 'Le prix unitaire est requis et doit être ≥ 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const selectedSupplier = suppliers.find(s => s.id === parseInt(formData.fournisseurId));

      if (!selectedSupplier) {
        throw new Error('Fournisseur non trouvé');
      }

      const submitData = {
        supplier: {
          id: selectedSupplier.id!,
          nomFournisseur: selectedSupplier.nomFournisseur
        },
        badge: formData.badge,
        dateEntre: formData.dateEntre, // keep as YYYY-MM-DD
        medicines: medicineEntries
      };

      console.log('Form submit data:', submitData);
      console.log('Medicine entries:', medicineEntries);

      const success = await onSubmit(submitData);
      if (success) {
        setShowSuccess(true);
        setTimeout(() => {
          onCancel();
        }, 1500);
      } else {
        setErrors(prev => ({ ...prev, general: 'Erreur lors de la sauvegarde. Veuillez réessayer.' }));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors(prev => ({ ...prev, general: 'Erreur lors de la sauvegarde. Veuillez réessayer.' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Modifier l\'entrée de stock' : 'Nouvelle entrée de stock (Lot)'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* General Error Display */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{errors.general}</p>
            </div>
          )}
          
          {/* Success Message */}
          {showSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700">✅ Lot de stock sauvegardé avec succès !</p>
            </div>
          )}

          {/* Batch Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-4">Informations du lot</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fournisseur */}
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Fournisseur *
                </label>
                <select
                  name="fournisseurId"
                  value={formData.fournisseurId}
                  onChange={handleChange}
                  disabled={isLoadingSuppliers}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fournisseurId ? 'border-red-500' : 'border-blue-300'
                  } ${isLoadingSuppliers ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">
                    {isLoadingSuppliers ? 'Chargement...' : 'Sélectionner un fournisseur'}
                  </option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.nomFournisseur} {supplier.telephone ? `- ${supplier.telephone}` : ''} {supplier.typeFournisseur ? `(${supplier.typeFournisseur})` : ''}
                    </option>
                  ))}
                </select>
                {errors.fournisseurId && (
                  <p className="mt-1 text-sm text-red-600">{errors.fournisseurId}</p>
                )}
                {suppliersError && (
                  <p className="mt-1 text-sm text-red-600">{suppliersError}</p>
                )}
              </div>

              {/* Date d'entrée */}
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Date d'entrée *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    name="dateEntre"
                    value={formData.dateEntre}
                    onChange={handleChange}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.dateEntre ? 'border-red-500' : 'border-blue-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, dateEntre: new Date().toISOString().split('T')[0] }))}
                    className="px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Aujourd'hui
                  </button>
                </div>
                {errors.dateEntre && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateEntre}</p>
                )}
              </div>

              {/* Badge */}
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Badge du lot * <span className="text-gray-500 text-xs">({formData.badge.length}/50)</span>
                </label>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge}
                  onChange={handleChange}
                  placeholder="Référence du lot"
                  maxLength={50}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.badge ? 'border-red-500' : 'border-blue-300'
                  }`}
                />
                {errors.badge && (
                  <p className="mt-1 text-sm text-red-600">{errors.badge}</p>
                )}
              </div>
            </div>
          </div>

          {/* Medicines List */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Médicaments du lot</h3>
              {!isEdit && (
                <button
                  type="button"
                  onClick={addMedicineRow}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Ajouter un médicament</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {medicineEntries.map((entry, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Médicament {index + 1}</h4>
                    {medicineEntries.length > 1 && !isEdit && (
                      <button
                        type="button"
                        onClick={() => removeMedicineRow(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Médicament */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Médicament *
                      </label>
                      <select
                        value={entry.medicamentId}
                        onChange={(e) => handleMedicineChange(index, 'medicamentId', e.target.value)}
                        disabled={isLoadingMedicines}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors[`medicine_${index}_medicamentId`] ? 'border-red-500' : 'border-gray-300'
                        } ${isLoadingMedicines ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="">
                          {isLoadingMedicines ? 'Chargement...' : 'Sélectionner un médicament'}
                        </option>
                        {medicines.map((medicine) => (
                          <option key={medicine.id} value={medicine.id}>
                            {medicine.nomMedicament} - {medicine.dosage} {medicine.uniteDosage} - Stock: {medicine.qteStock} - {medicine.codeBarre39}
                          </option>
                        ))}
                      </select>
                      {errors[`medicine_${index}_medicamentId`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`medicine_${index}_medicamentId`]}</p>
                      )}
                    </div>

                    {/* Quantité */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantité *
                      </label>
                      <input
                        type="number"
                        value={entry.qte}
                        onChange={(e) => handleMedicineChange(index, 'qte', e.target.value)}
                        min="1"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors[`medicine_${index}_qte`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`medicine_${index}_qte`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`medicine_${index}_qte`]}</p>
                      )}
                    </div>

                    {/* Prix unitaire */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prix unitaire (MAD) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={entry.unitPrice === 0 ? '' : entry.unitPrice}
                        onChange={(e) => handleMedicineChange(index, 'unitPrice', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors[`medicine_${index}_unitPrice`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ex: 12.50"
                      />
                      {errors[`medicine_${index}_unitPrice`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`medicine_${index}_unitPrice`]}</p>
                      )}
                    </div>

                    {/* Total row preview */}
                    <div className="md:col-span-2 text-sm text-gray-600">
                      Total ligne: <span className="font-medium text-gray-900">{(entry.qte || 0) * (entry.unitPrice || 0)} MAD</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {medicinesError && (
              <p className="mt-2 text-sm text-red-600">{medicinesError}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                if (!isEdit) {
                  setFormData({
                    fournisseurId: '',
                    dateEntre: new Date().toISOString().split('T')[0],
                    badge: ''
                  });
                  setMedicineEntries([{ medicamentId: '', qte: 1, unitPrice: 0 }]);
                  setErrors({});
                }
              }}
              className={`px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
                isEdit ? 'invisible' : ''
              }`}
            >
              Effacer le formulaire
            </button>
            
            <div className="flex items-center space-x-3">
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
                className={`px-4 py-2 rounded-lg text-white flex items-center space-x-2 ${
                  isEdit ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'
                } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isEdit ? <Edit size={16} /> : <Save size={16} />}
                <span>{isEdit ? 'Mettre à jour' : 'Enregistrer le lot'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntryStockForm;
