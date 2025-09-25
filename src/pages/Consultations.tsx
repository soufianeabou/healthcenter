import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, User, FileText, Pill, Clock, Eye, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConsultationBackendForm from '../components/ConsultationBackendForm';
import SortieStockForm from '../components/SortieStockForm';
import MultiSortieStockForm from '../components/MultiSortieStockForm';
import { useAuth } from '../context/AuthContext';

interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface ConsultationRow {
  id: number;
  patientId: number;
  patientName: string;
  doctorName: string;
  consultationDate: string; // ISO
  notes: string; // mapped from motif/diagnostic/traitement
  status: 'COMPLETED' | 'PENDING' | 'FOLLOW_UP';
  prescriptionItems: PrescriptionItem[]; // optional visualization
}

const Consultations = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'FOLLOW_UP'>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState<ConsultationRow | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRow | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSortieModalOpen, setIsSortieModalOpen] = useState(false);
  const [sortieConsultationId, setSortieConsultationId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const fetchConsultations = async () => {
    try {
      setError('');
      const res = await fetch('/api/consultations');
      if (!res.ok) throw new Error('Failed to fetch consultations');
      const data = await res.json();
      const rows: ConsultationRow[] = data.map((c: any) => ({
        id: c.id,
        patientId: c.patient?.id,
        patientName: `${c.patient?.prenom || ''} ${c.patient?.nom || ''}`.trim() || `Patient #${c.patient?.id}`,
        doctorName: `${c.personnel?.prenom || ''} ${c.personnel?.nom || ''}`.trim() || 'Médecin',
        consultationDate: c.dateConsultation,
        notes: [c.motif, c.diagnostic, c.traitement].filter(Boolean).join(' | '),
        status: 'COMPLETED',
        prescriptionItems: []
      }));
      setConsultations(rows);
    } catch (e) {
      console.error(e);
      setError('Erreur lors du chargement des consultations');
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = consultation.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultation.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || consultation.status === statusFilter;
    const matchesDate = !dateFilter || (consultation.consultationDate || '').slice(0,10) === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const readErrorText = async (res: Response) => {
    try {
      const txt = await res.text();
      return txt || res.statusText;
    } catch {
      return res.statusText;
    }
  };

  const handleAddConsultation = async (payload: any) => {
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id: null })
      });
      if (!res.ok) throw new Error(`Create failed (${res.status}): ${await readErrorText(res)}`);
      setIsModalOpen(false);
      await fetchConsultations();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erreur lors de la création de la consultation');
    }
  };

  const handleEditConsultation = async (payload: any) => {
    if (!editingConsultation) return;
    try {
      const res = await fetch(`/api/consultations/${editingConsultation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id: editingConsultation.id })
      });
      if (!res.ok) throw new Error(`Update failed (${res.status}): ${await readErrorText(res)}`);
      setEditingConsultation(null);
      setIsModalOpen(false);
      await fetchConsultations();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erreur lors de la mise à jour de la consultation');
    }
  };

  const handleDeleteConsultation = async (id: number) => {
    if (!confirm('Supprimer cette consultation ?')) return;
    try {
      const res = await fetch(`/api/consultations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed (${res.status}): ${await readErrorText(res)}`);
      await fetchConsultations();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression');
    }
  };

  const openEditModal = (consultation: ConsultationRow) => {
    setEditingConsultation(consultation);
    setIsModalOpen(true);
  };

  const openViewModal = (consultation: ConsultationRow) => {
    setSelectedConsultation(consultation);
    setIsViewModalOpen(true);
  };

  const openSortieModal = (consultation: ConsultationRow) => {
    setSortieConsultationId(consultation.id);
    setIsSortieModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingConsultation(null);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedConsultation(null);
  };

  const closeSortieModal = () => {
    setIsSortieModalOpen(false);
    setSortieConsultationId(null);
  };

  const handleCreateSortie = async (payload: any) => {
    try {
      const res = await fetch('/api/sortie-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Sortie failed (${res.status}): ${await readErrorText(res)}`);
      setIsSortieModalOpen(false);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erreur lors de la création de la sortie de stock');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FileText className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'FOLLOW_UP':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Calendar className="w-3 h-3 mr-1" />
            Follow-up
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusCounts = () => {
    const completed = consultations.filter(c => c.status === 'COMPLETED').length;
    const pending = consultations.filter(c => c.status === 'PENDING').length;
    const followUp = consultations.filter(c => c.status === 'FOLLOW_UP').length;
    return { completed, pending, followUp, total: consultations.length };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Doctor Consultations</h1>
          <p className="text-gray-600">Manage patient consultations and prescriptions</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Consultation</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 whitespace-pre-wrap">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Consultations</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{statusCounts.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{statusCounts.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{statusCounts.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Follow-up</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{statusCounts.followUp}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
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
                placeholder="Search by patient or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FOLLOW_UP">Follow-up</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-5 h-5" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
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
              {filteredConsultations.map((consultation) => (
                <tr key={consultation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{consultation.patientName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{consultation.doctorName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(consultation.consultationDate).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(consultation.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openViewModal(consultation)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(consultation)}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openSortieModal(consultation)}
                        className="text-purple-600 hover:text-purple-900 transition-colors"
                        title="Sortie de stock"
                      >
                        <Pill className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConsultation(consultation.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete"
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

        {filteredConsultations.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No consultations found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or add a new consultation.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              New Consultation
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingConsultation ? 'Edit Consultation' : 'New Consultation'}
      >
        <ConsultationBackendForm
          personnelId={user?.id as number}
          initial={editingConsultation ? {
            id: editingConsultation.id,
            patient: { id: editingConsultation.patientId },
            personnel: { id: user?.id as number },
            dateConsultation: editingConsultation.consultationDate,
            motif: editingConsultation.notes,
            diagnostic: '',
            traitement: ''
          } : null}
          onSubmit={editingConsultation ? handleEditConsultation : handleAddConsultation}
          onCancel={closeModal}
        />
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        title="Consultation Details"
      >
        {selectedConsultation && (
          <div className="space-y-3 text-sm">
            <div><span className="font-medium">Patient:</span> {selectedConsultation.patientName}</div>
            <div><span className="font-medium">Doctor:</span> {selectedConsultation.doctorName}</div>
            <div><span className="font-medium">Date & Time:</span> {new Date(selectedConsultation.consultationDate).toLocaleString()}</div>
            <div><span className="font-medium">Notes:</span> {selectedConsultation.notes}</div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isSortieModalOpen}
        onClose={closeSortieModal}
        title="Ajouter des Médicaments"
      >
        {sortieConsultationId && (
          <MultiSortieStockForm
            consultationId={sortieConsultationId}
            onSubmitted={() => { closeSortieModal(); }}
            onCancel={closeSortieModal}
          />)
        }
      </Modal>
    </div>
  );
};

export default Consultations;