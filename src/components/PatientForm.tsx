import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Patient, PatientFormData, PatientType } from '../types/patient';

interface PatientFormProps {
  patient?: Patient | null;
  onSubmit: (data: PatientFormData) => void;
  onCancel: () => void;
}

const PatientForm: React.FC<PatientFormProps> = ({ patient, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<PatientFormData>({
    nom: '',
    prenom: '',
    cne: '',
    dateNaissance: '',
    sexe: 'Homme',
    telephone: '',
    email: '',
    departement: '',
    typePatient: PatientType.STUDENT
  });

  const [errors, setErrors] = useState<Partial<PatientFormData>>({});

  useEffect(() => {
    if (patient) {
      setFormData({
        nom: patient.nom,
        prenom: patient.prenom,
        cne: patient.cne,
        dateNaissance: patient.dateNaissance,
        sexe: patient.sexe,
        telephone: patient.telephone,
        email: patient.email,
        departement: patient.departement || '',
        typePatient: patient.typePatient || PatientType.STUDENT
      });
    }
  }, [patient]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PatientFormData> = {};

    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!formData.cne.trim()) newErrors.cne = 'Le CNE est requis';
    if (!formData.dateNaissance) newErrors.dateNaissance = 'La date de naissance est requise';
    if (!formData.sexe) newErrors.sexe = 'Le sexe est requis';
    if (!formData.telephone.trim()) newErrors.telephone = 'Le téléphone est requis';
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Phone validation (10 digits only)
    const phoneRegex = /^\d{10}$/;
    if (formData.telephone && !phoneRegex.test(formData.telephone)) {
      newErrors.telephone = 'Le téléphone doit contenir exactement 10 chiffres';
    }

    // Department validation for STAFF and GUEST
    if ((formData.typePatient === PatientType.STAFF || formData.typePatient === PatientType.GUEST) && !formData.departement?.trim()) {
      newErrors.departement = 'Le département est requis pour le personnel et les invités';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        ...formData,
        typePatient: formData.typePatient || null,
        departement: (formData.typePatient === PatientType.STAFF || formData.typePatient === PatientType.GUEST) 
          ? formData.departement 
          : null
      };
      onSubmit(submitData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof PatientFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {patient ? 'Modifier le patient' : 'Ajouter un nouveau patient'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nom ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nom du patient"
              />
              {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
            </div>

            {/* Prénom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.prenom ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Prénom du patient"
              />
              {errors.prenom && <p className="text-red-500 text-sm mt-1">{errors.prenom}</p>}
            </div>

            {/* CNE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CNE *
              </label>
              <input
                type="text"
                name="cne"
                value={formData.cne}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cne ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="CNE123456"
              />
              {errors.cne && <p className="text-red-500 text-sm mt-1">{errors.cne}</p>}
            </div>

            {/* Date de naissance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de naissance *
              </label>
              <input
                type="date"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dateNaissance ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.dateNaissance && <p className="text-red-500 text-sm mt-1">{errors.dateNaissance}</p>}
            </div>

            {/* Sexe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sexe *
              </label>
              <select
                name="sexe"
                value={formData.sexe}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sexe ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
              {errors.sexe && <p className="text-red-500 text-sm mt-1">{errors.sexe}</p>}
            </div>

            {/* Type de patient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de patient *
              </label>
              <select
                name="typePatient"
                value={formData.typePatient}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Non défini</option>
                <option value={PatientType.STUDENT}>Étudiant</option>
                <option value={PatientType.STAFF}>Personnel</option>
                <option value={PatientType.GUEST}>Invité</option>
                <option value={PatientType.AUTHER}>Autre</option>
              </select>
            </div>

            {/* Département (conditionnel) */}
            {(formData.typePatient === PatientType.STAFF || formData.typePatient === PatientType.GUEST) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Département *
                </label>
                <input
                  type="text"
                  name="departement"
                  value={formData.departement}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.departement ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nom du département"
                />
                {errors.departement && <p className="text-red-500 text-sm mt-1">{errors.departement}</p>}
              </div>
            )}

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone *
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.telephone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0612345678"
              />
              {errors.telephone && <p className="text-red-500 text-sm mt-1">{errors.telephone}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="patient@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {patient ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;
