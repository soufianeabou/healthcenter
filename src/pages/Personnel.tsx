import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, User, Mail, Phone, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import PersonnelForm from '../components/PersonnelForm';

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

const Personnel = () => {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);

  // Fetch personnel from API
  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://hc.aui.ma/api/consultations/personnels', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      setPersonnel(data);
    } catch (err) {
      console.error('Error fetching personnel:', err);
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError('CORS Error: Cannot connect to backend. Make sure your backend allows requests from this origin.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch personnel');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const filteredPersonnel = personnel.filter(person => {
    const matchesSearch = `${person.prenom} ${person.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.specialite.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || person.status === statusFilter;
    const matchesRole = roleFilter === 'ALL' || person.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleAddPersonnel = async (personnelData: Omit<Personnel, 'id'>) => {
    try {
      const response = await fetch('https://hc.aui.ma/api/consultations/personnels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personnelData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the personnel list
      await fetchPersonnel();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error adding personnel:', err);
      setError(err instanceof Error ? err.message : 'Failed to add personnel');
    }
  };

  const handleEditPersonnel = async (personnelData: Omit<Personnel, 'id'>) => {
    if (editingPersonnel) {
      try {
        const response = await fetch(`https://hc.aui.ma/api/consultations/personnels/${editingPersonnel.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(personnelData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Refresh the personnel list
        await fetchPersonnel();
        setEditingPersonnel(null);
        setIsModalOpen(false);
      } catch (err) {
        console.error('Error updating personnel:', err);
        setError(err instanceof Error ? err.message : 'Failed to update personnel');
      }
    }
  };

  const handleDeletePersonnel = async (id: number) => {
    if (confirm('Are you sure you want to delete this personnel record?')) {
      try {
        const response = await fetch(`https://hc.aui.ma/api/consultations/personnels/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Refresh the personnel list
        await fetchPersonnel();
      } catch (err) {
        console.error('Error deleting personnel:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete personnel');
      }
    }
  };

  const openEditModal = (person: Personnel) => {
    setEditingPersonnel(person);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPersonnel(null);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'ACTIF': 'bg-green-100 text-green-800',
      'INACTIF': 'bg-red-100 text-red-800',
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-red-100 text-red-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'SUSPENDED': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
      }`}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      'ADMIN': 'bg-purple-100 text-purple-800',
      'MEDECIN': 'bg-blue-100 text-blue-800',
      'INFIRMIER': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
      }`}>
        {role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading personnel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={fetchPersonnel}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Personnel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion du personnel du centre de santé</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPersonnel}
            className="border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: personnel.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Actifs', value: personnel.filter(p => p.status === 'ACTIF' || p.status === 'ACTIVE').length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Rôles', value: new Set(personnel.map(p => p.role)).size, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Spécialités', value: new Set(personnel.map(p => p.specialite)).size, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <User className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Recherche par nom, email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">Tous les rôles</option>
              {Array.from(new Set(personnel.map(p => p.role))).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">Tous les statuts</option>
              {Array.from(new Set(personnel.map(p => p.status))).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Personnel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username & Specialty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPersonnel.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {person.prenom} {person.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {person.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{person.username}</div>
                    <div className="text-sm text-gray-500">{person.specialite}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                      <Mail className="w-4 h-4" />
                      <span>{person.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{person.telephone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(person.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(person.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(person)}
                        className="text-green-600 hover:text-green-900 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePersonnel(person.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPersonnel.length === 0 && (
          <div className="p-12 text-center">
            <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-700 mb-1">Aucun personnel trouvé</h3>
            <p className="text-sm text-gray-500 mb-4">Ajustez vos filtres ou ajoutez un nouveau membre.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Ajouter
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingPersonnel ? 'Modifier le personnel' : 'Ajouter du personnel'}
      >
        <PersonnelForm
          initialData={editingPersonnel}
          onSubmit={editingPersonnel ? handleEditPersonnel : handleAddPersonnel}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
};

export default Personnel;