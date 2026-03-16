import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, User, FileText, Pill, Clock, Eye, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConsultationBackendForm from '../components/ConsultationBackendForm';
import MaterielAssignmentForm from '../components/MaterielAssignmentForm';
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
  isExternal?: boolean;
  externalCategory?: string;
}

const Consultations = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [externalConsultations, setExternalConsultations] = useState<ConsultationRow[]>([]);
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
      const res = await fetch('https://hc.aui.ma/api/consultations');
      if (!res.ok) throw new Error('Failed to fetch consultations');
      const data = await res.json();
      
      console.log('Raw API response (first item):', data[0]);
      
      const rows: ConsultationRow[] = data.map((c: any) => {
        const row: any = {
          id: c.id,
          patientId: c.patient?.idNum || c.patientId,
          patientName: c.patient ? 
            `${c.patient.prenom || ''} ${c.patient.nom || ''} #${c.patient.idNum}`.trim() : 
            `#${c.patientId}`,
          doctorName: `${c.personnel?.prenom || ''} ${c.personnel?.nom || ''}`.trim() || 'Médecin',
          consultationDate: c.dateConsultation,
          notes: [c.motif, c.diagnostic, c.traitement].filter(Boolean).join(' | '),
          status: 'COMPLETED',
          prescriptionItems: [],
          // Store full data for editing
          motif: c.motif,
          diagnostic: c.diagnostic,
          traitement: c.traitement,
          patient: c.patient
        };
        
        // Debug: log if id is null
        if (!row.id) {
          console.warn('⚠️ Consultation with null ID:', c);
        }
        
        return row;
      });
      
      console.log('Mapped consultations (first item):', rows[0]);
      
      setConsultations(rows);
    } catch (e) {
      console.error(e);
      setError('Erreur lors du chargement des consultations');
    }
  };

  const loadExternalConsultations = () => {
    try {
      const raw = localStorage.getItem('externalConsultations');
      if (!raw) {
        setExternalConsultations([]);
        return;
      }
      const parsed = JSON.parse(raw) as any[];
      const mapped: ConsultationRow[] = parsed.map((c: any) => ({
        id: c.id,
        patientId: -1,
        patientName: c.patientName,
        doctorName: c.personnelName || 'Médecin',
        consultationDate: c.consultationDate,
        notes: [c.motif, c.diagnostic, c.traitement].filter(Boolean).join(' | '),
        status: 'COMPLETED',
        prescriptionItems: [],
        isExternal: true,
        externalCategory: c.external?.category
      }));
      setExternalConsultations(mapped);
    } catch (err) {
      console.error('Failed to load external consultations:', err);
      setExternalConsultations([]);
    }
  };

  useEffect(() => {
    fetchConsultations();
    loadExternalConsultations();
  }, []);

  const allConsultations = [...externalConsultations, ...consultations];

  const filteredConsultations = allConsultations.filter(consultation => {
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
      // Format current date/time for backend LocalDateTime (ISO-8601 format)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      
      // Backend ConsultationRequest expects patientId to match the patient
      // service ID used elsewhere (idNum). Use idNum when available and fall
      // back to id only if idNum is missing.
      const patientIdForBackend = payload.patient.idNum ?? payload.patient.id;

      const requestBody = {
        patientId: patientIdForBackend,
        personnelId: payload.personnel.id,
        dateConsultation: dateString,
        motif: payload.motif,
        diagnostic: payload.diagnostic,
        traitement: payload.traitement,
      };
      
      console.log('📅 Sending consultation request:', JSON.stringify(requestBody, null, 2));
      
      const res = await fetch('https://hc.aui.ma/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!res.ok) {
        const errorText = await readErrorText(res);
        console.error('❌ Backend error:', errorText);
        throw new Error(`Create failed (${res.status}): ${errorText}`);
      }
      
      const responseData = await res.json();
      console.log('✅ Backend response:', responseData);
      
      setIsModalOpen(false);
      await fetchConsultations();
      loadExternalConsultations();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erreur lors de la création de la consultation');
    }
  };

  const handleEditConsultation = async (payload: any) => {
    if (!editingConsultation) return;
    try {
      // Use the original patientId from the consultation (which is the idNum)
      const updatePayload = {
        id: editingConsultation.id,
        patientId: editingConsultation.patientId, // Use the stored patientId (idNum), not payload.patient.id
        personnelId: payload.personnel.id,
        dateConsultation: payload.dateConsultation,
        motif: payload.motif,
        diagnostic: payload.diagnostic,
        traitement: payload.traitement
      };
      
      console.log('Updating consultation:', updatePayload);
      
      const res = await fetch(`https://hc.aui.ma/api/consultations/${editingConsultation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
      
      if (!res.ok) {
        const errorText = await readErrorText(res);
        throw new Error(`Update failed (${res.status}): ${errorText}`);
      }
      
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
      const res = await fetch(`https://hc.aui.ma/api/consultations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed (${res.status}): ${await readErrorText(res)}`);
      await fetchConsultations();
      loadExternalConsultations();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression');
    }
  };

  const openEditModal = (consultation: ConsultationRow) => {
    // Data is already stored in the consultation object from fetchConsultations
    console.log('Opening edit modal for consultation:', consultation);
    console.log('Consultation ID:', consultation.id);
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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Consultations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des consultations médicales</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nouvelle consultation
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 whitespace-pre-wrap">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: statusCounts.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Terminées', value: statusCounts.completed, icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'En attente', value: statusCounts.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Suivi', value: statusCounts.followUp, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
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
                placeholder="Recherche patient ou médecin…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="COMPLETED">Terminée</option>
              <option value="PENDING">En attente</option>
              <option value="FOLLOW_UP">Suivi</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Effacer
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Doctor
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Status
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConsultations.map((consultation) => (
                <tr key={consultation.id} className="hover:bg-gray-50">
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="ml-4 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {consultation.patientName}
                          {consultation.isExternal && (
                            <span className="ml-2 text-xs inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                              Externe{consultation.externalCategory ? ` • ${consultation.externalCategory}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-900">{consultation.doctorName}</div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {consultation.consultationDate ? 
                        new Date(consultation.consultationDate).toLocaleString() : 
                        'No date'
                      }
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    {getStatusBadge(consultation.status)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openViewModal(consultation)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!consultation.isExternal && (
                        <>
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
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredConsultations.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-700 mb-1">Aucune consultation trouvée</h3>
            <p className="text-sm text-gray-500 mb-4">Ajustez vos filtres ou créez une nouvelle consultation.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Nouvelle consultation
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
            patient: (editingConsultation as any).patient || { id: editingConsultation.patientId, idNum: editingConsultation.patientId },
            personnel: { id: user?.id as number },
            dateConsultation: editingConsultation.consultationDate,
            motif: (editingConsultation as any).motif || editingConsultation.notes,
            diagnostic: (editingConsultation as any).diagnostic || '',
            traitement: (editingConsultation as any).traitement || ''
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
        title="Assigner des Matériels"
      >
        {sortieConsultationId && (
          <MaterielAssignmentForm
            consultationId={sortieConsultationId}
            onSubmitted={() => { closeSortieModal(); }}
            onCancel={closeSortieModal}
          />
        )}
      </Modal>
    </div>
  );
};

export default Consultations;