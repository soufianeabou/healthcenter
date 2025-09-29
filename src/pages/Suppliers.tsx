import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Phone, Mail, MapPin, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import SupplierForm from '../components/SupplierForm';

interface Supplier {
  id: number;
  nomFournisseur: string;
  adresse: string;
  telephone: string;
  email: string;
  dateJointure: string;
  typeFournisseur: string;
  status: string;
}

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://196.12.203.182/api/consultations/fournisseurs');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      setSuppliers(data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.nomFournisseur.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.typeFournisseur.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || supplier.typeFournisseur === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || supplier.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAddSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    try {
      const response = await fetch('https://196.12.203.182/api/consultations/fournisseurs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add supplier: ${errorText}`);
      }

      await fetchSuppliers();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error adding supplier:', err);
      setError(err instanceof Error ? err.message : 'Failed to add supplier');
    }
  };

  const handleEditSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    if (editingSupplier) {
      try {
        const response = await fetch(`https://196.12.203.182/api/consultations/fournisseurs/${editingSupplier.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(supplierData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update supplier: ${errorText}`);
        }

        await fetchSuppliers();
        setEditingSupplier(null);
        setIsModalOpen(false);
      } catch (err) {
        console.error('Error updating supplier:', err);
        setError(err instanceof Error ? err.message : 'Failed to update supplier');
      }
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      try {
        const response = await fetch(`https://196.12.203.182/api/consultations/fournisseurs/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to delete supplier: ${errorText}`);
        }

        await fetchSuppliers();
      } catch (err) {
        console.error('Error deleting supplier:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete supplier');
      }
    }
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      'Médicaments génériques': 'bg-blue-100 text-blue-800',
      'Médicaments spécialisés': 'bg-purple-100 text-purple-800',
      'Équipements médicaux': 'bg-green-100 text-green-800',
      'Matériel de premiers secours': 'bg-red-100 text-red-800',
      'Vitamines et compléments': 'bg-yellow-100 text-yellow-800',
      'Dispositifs médicaux': 'bg-indigo-100 text-indigo-800',
      'Produits d\'hygiène': 'bg-pink-100 text-pink-800',
      'Autre': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
      }`}>
        {type}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des fournisseurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Fournisseurs</h1>
          <p className="text-gray-600">Gérez les fournisseurs pharmaceutiques et leurs contacts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchSuppliers}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Actualiser</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter Fournisseur</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 underline text-sm mt-2">Fermer</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Fournisseurs</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{suppliers.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Types</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {new Set(suppliers.map(s => s.typeFournisseur)).size}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Filter className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                {suppliers.filter(s => s.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cette Année</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                {suppliers.filter(s => new Date(s.dateJointure).getFullYear() === new Date().getFullYear()).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher des fournisseurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">Tous les types</option>
              {Array.from(new Set(suppliers.map(s => s.typeFournisseur))).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">Tous les statuts</option>
              {Array.from(new Set(suppliers.map(s => s.status))).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{supplier.nomFournisseur}</h3>
                  {getTypeBadge(supplier.typeFournisseur)}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(supplier)}
                    className="text-green-600 hover:text-green-900 transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSupplier(supplier.id)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{supplier.adresse}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{supplier.telephone}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{supplier.email}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Depuis <span className="font-medium">{new Date(supplier.dateJointure).getFullYear()}</span>
                  </span>
                  {getStatusBadge(supplier.status)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="p-12 text-center">
            <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun fournisseur trouvé</h3>
            <p className="text-gray-600 mb-4">Essayez d'ajuster vos critères de recherche ou ajoutez un nouveau fournisseur.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Ajouter Fournisseur
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSupplier ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}
      >
        <SupplierForm
          initialData={editingSupplier}
          onSubmit={editingSupplier ? handleEditSupplier : handleAddSupplier}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
};

export default Suppliers;