import React, { useState, useEffect } from 'react';

interface Personnel {
  id: number;
  nom: string;
  prenom: string;
  username: string;
  passwd: string;
  role: string;
  specialite: string;
  telephone: string;
  email: string;
  status: string;
}

interface PersonnelFormProps {
  initialData?: Personnel | null;
  onSubmit: (data: Omit<Personnel, 'id'>) => void;
  onCancel: () => void;
}

const PersonnelForm: React.FC<PersonnelFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const isEditMode = !!initialData;
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    username: '',
    passwd: '',
    role: 'INFIRMIER',
    specialite: '',
    telephone: '',
    email: '',
    status: 'ACTIF'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nom: initialData.nom,
        prenom: initialData.prenom,
        username: initialData.username,
        passwd: initialData.passwd,
        role: initialData.role,
        specialite: initialData.specialite,
        telephone: initialData.telephone,
        email: initialData.email,
        status: initialData.status
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const roles = ['ADMIN', 'MEDECIN', 'INFIRMIER'];
  const statuses = ['ACTIF', 'INACTIF'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isEditMode && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Mode édition :</strong> Vous pouvez uniquement modifier le rôle et le statut du personnel.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Prénom *
          </label>
          <input
            type="text"
            name="prenom"
            value={formData.prenom}
            onChange={handleChange}
            disabled={isEditMode}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
              isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
            }`}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nom *
          </label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            disabled={isEditMode}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
              isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
            }`}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nom d'utilisateur *
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={isEditMode}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
              isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
            }`}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Mot de passe *
          </label>
          <input
            type="password"
            name="passwd"
            value={formData.passwd}
            onChange={handleChange}
            disabled={isEditMode}
            placeholder={isEditMode ? "••••••••" : ""}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
              isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
            }`}
            required={!isEditMode}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isEditMode}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
              isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
            }`}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Téléphone *
          </label>
          <input
            type="tel"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            disabled={isEditMode}
            placeholder="+212 6 XX XX XX XX"
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
              isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
            }`}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Spécialité *
        </label>
        <input
          type="text"
          name="specialite"
          value={formData.specialite}
          onChange={handleChange}
          disabled={isEditMode}
          placeholder="Ex: Cardiologie, Infirmerie générale, Support IT"
          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
            isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
          }`}
          required
        />
      </div>

      {/* Editable fields in edit mode */}
      <div className={`grid grid-cols-2 gap-6 ${isEditMode ? 'p-4 bg-green-50 rounded-lg border-2 border-green-200' : ''}`}>
        {isEditMode && (
          <div className="col-span-2 mb-2">
            <p className="text-sm font-semibold text-green-700">Champs modifiables:</p>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rôle * {isEditMode && <span className="text-green-600">(Modifiable)</span>}
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            required
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Statut * {isEditMode && <span className="text-green-600">(Modifiable)</span>}
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            required
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-6 border-t-2 border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-md hover:shadow-lg"
        >
          {initialData ? '✓ Mettre à jour' : '+ Ajouter Personnel'}
        </button>
      </div>
    </form>
  );
};

export default PersonnelForm;
