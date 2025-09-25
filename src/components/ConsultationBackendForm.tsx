import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ConsultationDTO } from '../types/consultation';
import { Patient } from '../types/patient';

interface Props {
  personnelId: number;
  initial?: ConsultationDTO | null;
  onSubmit: (payload: ConsultationDTO) => void;
  onCancel: () => void;
}

const ConsultationBackendForm: React.FC<Props> = ({ personnelId, initial, onSubmit, onCancel }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(initial?.patient?.id || null);

  const [date, setDate] = useState<string>(() => initial?.dateConsultation?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(() => initial?.dateConsultation ? new Date(initial.dateConsultation).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5));
  const [motif, setMotif] = useState<string>(initial?.motif || '');
  const [diagnostic, setDiagnostic] = useState<string>(initial?.diagnostic || '');
  const [traitement, setTraitement] = useState<string>(initial?.traitement || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const term = patientSearch.trim();
    if (!term || !/^\d{3,}$/.test(term)) {
      setPatients([]);
      return () => controller.abort();
    }
    setLoadingPatients(true);
    const timer = setTimeout(async () => {
      try {
        console.log("Searching for patient:", term); const res = await fetch(`https://196.12.203.182/api/patients/${term}`, { signal: controller.signal });
        console.log("Patient search response:", res.status); if (!res.ok) {
          setPatients([]);
          return;
        }
        const r = await res.json(); console.log("Patient data:", r);
        // Map API shape to local Patient shape; map idNum -> id
        const mapped: Patient[] = [{
          id: (r.idNum ?? r.id) as number,
          nom: r.nom || '',
          prenom: r.prenom || '',
          cne: r.cne || '',
          dateNaissance: r.dateNaissance || '',
          sexe: r.sexe || '',
          telephone: r.telephone || '',
          email: r.email || ''
        }];
        setPatients(mapped);
      } catch (e) {
        setPatients([]);
      } finally {
        setLoadingPatients(false);
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [patientSearch]);

  const filteredPatients = useMemo(() => patients, [patients]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedPatientId) e.patient = 'Sélectionner un patient';
    if (!motif.trim()) e.motif = 'Motif requis';
    if (!diagnostic.trim()) e.diagnostic = 'Diagnostic requis';
    if (!traitement.trim()) e.traitement = 'Traitement requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const dateTimeLocal = `${date}T${time}:00`;
    onSubmit({
      patientId: { id: selectedPatientId as number },
      personnelId: { id: personnelId },
      dateConsultation: dateTimeLocal,
      motif,
      diagnostic,
      traitement
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Saisir l'ID (idNum) du patient"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
          {loadingPatients ? (
            <div className="p-3 text-sm text-gray-500">Chargement...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">Aucun patient</div>
          ) : (
            filteredPatients.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setSelectedPatientId(p.id!); setPatientSearch(`${p.prenom} ${p.nom}`); }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${selectedPatientId === p.id ? 'bg-green-50' : ''}`}
              >
                <div className="text-sm font-medium text-gray-800">{p.prenom} {p.nom}</div>
                <div className="text-xs text-gray-500">{p.cne} • {p.email}</div>
              </button>
            ))
          )}
        </div>
        {errors.patient && <p className="text-red-600 text-sm mt-1">{errors.patient}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Motif *</label>
        <input type="text" value={motif} onChange={(e) => setMotif(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
        {errors.motif && <p className="text-red-600 text-sm mt-1">{errors.motif}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnostic *</label>
        <textarea value={diagnostic} onChange={(e) => setDiagnostic(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-md" />
        {errors.diagnostic && <p className="text-red-600 text-sm mt-1">{errors.diagnostic}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Traitement *</label>
        <textarea value={traitement} onChange={(e) => setTraitement(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-md" />
        {errors.traitement && <p className="text-red-600 text-sm mt-1">{errors.traitement}</p>}
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md">Annuler</button>
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">{initial ? 'Mettre à jour' : 'Enregistrer'}</button>
      </div>
    </form>
  );
};

export default ConsultationBackendForm;
