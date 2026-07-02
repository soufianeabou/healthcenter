import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, Calendar, User, FileText, Pill,
  Clock, Trash2, ChevronRight, Activity, AlertCircle, Package, X,
  Stethoscope, Edit2, CalendarClock,
} from 'lucide-react';
import Modal from '../components/Modal';
import ConsultationBackendForm from '../components/ConsultationBackendForm';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/roles';

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
  consultationDate: string;
  notes: string;
  status: 'COMPLETED' | 'PENDING' | 'FOLLOW_UP';
  prescriptionItems: PrescriptionItem[];
  isExternal?: boolean;
  externalCategory?: string;
  motif?: string;
  diagnostic?: string;
  traitement?: string;
  infirmierTraitement?: string;
  patient?: any;
  personnelId?: number;
  consultationType?: string;
  temperature?: string;
  tension?: string;
  pouls?: string;
  saturation?: string;
  gaj?: string;
  frequenceRespiratoire?: string;
  poids?: string;
  taille?: string;
  psyNotes?: string;
  suiviOf?: number;
  prochainRdv?: string;
  rdvList?: Array<{ id: number; rdvDate: string; note?: string; done: boolean }>;
}

/* ─── helpers ─── */
const RDV_KEY = (id: number) => `prochainRdv_${id}`;

const getProchainRdv = (id: number): string =>
  localStorage.getItem(RDV_KEY(id)) || '';

const saveProchainRdv = (id: number, date: string) =>
  date ? localStorage.setItem(RDV_KEY(id), date) : localStorage.removeItem(RDV_KEY(id));

const parseConstantes = (diagnostic: string | undefined) => {
  if (!diagnostic?.startsWith('CONSTANTES:')) return { constantes: null, notes: diagnostic || '' };
  const parts = diagnostic.split('\n\nNOTES:\n');
  const lines = parts[0].replace('CONSTANTES:\n', '').split('\n').filter(Boolean);
  return { constantes: lines, notes: parts[1] || '' };
};

/* ─── Details Modal ─── */
interface DetailsModalProps {
  consultation: ConsultationRow;
  canEdit: boolean;   // medecin or admin
  onClose: () => void;
  onDeleted: () => void;
  onSaved: (id: number, diagnostic: string, traitement: string) => void;
  onCreateSuivi?: (patient: any, motif: string, parentId: number) => void;
}

const DetailsModal: React.FC<DetailsModalProps> = ({
  consultation, canEdit, onClose, onDeleted, onSaved, onCreateSuivi,
}) => {
  const [tab, setTab] = useState<'info' | 'materiels'>('info');
  const [editing, setEditing] = useState(false);
  const [diagnostic, setDiagnostic] = useState(consultation.diagnostic || '');
  const [traitement, setTraitement] = useState(consultation.traitement || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [rdvList, setRdvList] = useState<Array<{ id: number; rdvDate: string; note?: string; done: boolean }>>(
    () => (consultation.rdvList ?? []).slice().sort((a, b) => a.rdvDate.localeCompare(b.rdvDate))
  );
  const [showAddRdv, setShowAddRdv] = useState(false);
  const [newRdvDate, setNewRdvDate] = useState('');
  const [newRdvNote, setNewRdvNote] = useState('');
  const [rdvError, setRdvError] = useState('');

  const [materials, setMaterials] = useState<any[]>([]);
  const [allMaterials, setAllMaterials] = useState<any[]>([]);
  const [matLoading, setMatLoading] = useState(false);
  const [matError, setMatError] = useState('');
  const [selectedMat, setSelectedMat] = useState<number | ''>('');
  const [showAssign, setShowAssign] = useState(false);

  const { constantes, notes } = parseConstantes(consultation.diagnostic);
  const isPending = consultation.status === 'PENDING';

  const loadMaterials = useCallback(async () => {
    const pid = consultation.patientId;
    if (!pid || pid < 0) return;
    setMatLoading(true);
    try {
      const [matRes, allRes] = await Promise.all([
        fetch(`https://hc.aui.ma/api/consultations/materials/patient/${pid}`),
        fetch('https://hc.aui.ma/api/consultations/materials'),
      ]);
      if (matRes.ok) {
        const d = await matRes.json();
        setMaterials(Array.isArray(d) ? d : d?.id ? [d] : []);
      }
      if (allRes.ok) setAllMaterials(await allRes.json());
    } catch {
      setMatError('Erreur chargement matériels');
    } finally {
      setMatLoading(false);
    }
  }, [consultation.patientId]);

  useEffect(() => { if (tab === 'materiels') loadMaterials(); }, [tab, loadMaterials]);

  const handleSave = async () => {
    if (!traitement.trim()) { setSaveError('Le traitement est requis.'); return; }
    setSaving(true); setSaveError('');
    try {
      const res = await fetch(`https://hc.aui.ma/api/consultations/${consultation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: consultation.id,
          patientId: consultation.patientId,
          personnelId: consultation.personnelId,
          dateConsultation: consultation.consultationDate,
          motif: consultation.motif,
          diagnostic,
          traitement,
          infirmierTraitement: consultation.infirmierTraitement,
          consultationType: consultation.consultationType,
          temperature: (consultation as any).temperature,
          tension: (consultation as any).tension,
          pouls: (consultation as any).pouls,
          saturation: (consultation as any).saturation,
          gaj: (consultation as any).gaj,
          frequenceRespiratoire: (consultation as any).frequenceRespiratoire,
          poids: (consultation as any).poids,
          taille: (consultation as any).taille,
          psyNotes: (consultation as any).psyNotes,
          prochainRdv: consultation.prochainRdv || null,
          parentConsultationId: consultation.suiviOf ?? null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      saveProchainRdv(consultation.id, prochainRdv);
      onSaved(consultation.id, diagnostic, traitement);
      setEditing(false);
    } catch (e: any) {
      setSaveError(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const RDV_API = `https://hc.aui.ma/api/consultations/${consultation.id}/rdvs`;

  const refreshRdvList = async () => {
    try {
      const res = await fetch(RDV_API);
      if (res.ok) setRdvList(await res.json());
    } catch { /* silent */ }
  };

  const handleAddRdv = async () => {
    if (!newRdvDate) { setRdvError('Date requise'); return; }
    setRdvError('');
    try {
      const res = await fetch(RDV_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rdvDate: newRdvDate, note: newRdvNote || null, done: false }),
      });
      if (!res.ok) throw new Error(await res.text());
      setNewRdvDate(''); setNewRdvNote(''); setShowAddRdv(false);
      await refreshRdvList();
    } catch (e: any) { setRdvError(e.message || 'Erreur'); }
  };

  const handleToggleDone = async (r: { id: number; rdvDate: string; note?: string; done: boolean }) => {
    try {
      await fetch(`${RDV_API}/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...r, done: !r.done }),
      });
      await refreshRdvList();
    } catch { /* silent */ }
  };

  const handleDeleteRdv = async (id: number) => {
    try {
      await fetch(`${RDV_API}/${id}`, { method: 'DELETE' });
      await refreshRdvList();
    } catch { /* silent */ }
  };

  const nextPendingRdv = rdvList.filter(r => !r.done).sort((a, b) => a.rdvDate.localeCompare(b.rdvDate))[0];
  const rdvHasArrived = nextPendingRdv
    ? new Date(nextPendingRdv.rdvDate) <= new Date()
    : false;

  const handleDelete = async () => {
    if (!confirm('Supprimer cette consultation ?')) return;
    const res = await fetch(`https://hc.aui.ma/api/consultations/${consultation.id}`, { method: 'DELETE' });
    if (res.ok) { onDeleted(); onClose(); }
  };

  const handleAssign = async () => {
    if (!selectedMat) return;
    const pid = consultation.patientId;
    setMatError('');
    try {
      const res = await fetch('https://hc.aui.ma/api/consultations/materials/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedMat, patientId: pid, quantity: 1 }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSelectedMat(''); setShowAssign(false); loadMaterials();
    } catch (e: any) { setMatError(e.message); }
  };

  const handleUnassign = async (materialId: number, quantity: number) => {
    const pid = consultation.patientId;
    setMatError('');
    try {
      const res = await fetch('https://hc.aui.ma/api/consultations/materials/unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: materialId, patientId: pid, quantity }),
      });
      if (!res.ok) throw new Error(await res.text());
      loadMaterials();
    } catch (e: any) { setMatError(e.message); }
  };

  return (
    <div className="flex flex-col" style={{ minWidth: 560, maxWidth: 720 }}>
      {/* Status banner for pending */}
      {isPending && (
        <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-5 py-3 text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">En attente du médecin</span>
          <span className="text-amber-600">— constantes enregistrées, traitement à compléter.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-5">
        {(['info', 'materiels'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'info' ? (
              <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> Consultation</span>
            ) : (
              <span className="flex items-center gap-1.5"><Package className="w-4 h-4" /> Matériels</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-5 overflow-y-auto" style={{ maxHeight: '65vh' }}>
        {tab === 'info' && (
          <>
            {/* Header info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Patient" value={consultation.patientName} />
              <InfoRow label="Médecin / Personnel" value={consultation.doctorName} />
              <InfoRow label="Date" value={new Date(consultation.consultationDate).toLocaleString('fr-MA')} />
              <InfoRow label="Motif" value={consultation.motif || consultation.notes} />
            </div>

            {/* Constantes vitales (from dedicated fields) */}
            {(() => {
              const c = consultation as any;
              const rows = [
                ['Température', c.temperature ? `${c.temperature}°C` : null],
                ['TA', c.tension],
                ['Pouls', c.pouls ? `${c.pouls} bpm` : null],
                ['Saturation', c.saturation ? `${c.saturation}%` : null],
                ['GàJ', c.gaj],
                ['FR', c.frequenceRespiratoire ? `${c.frequenceRespiratoire}/min` : null],
                ['Poids', c.poids ? `${c.poids} kg` : null],
                ['Taille', c.taille ? `${c.taille} cm` : null],
              ].filter(([, v]) => v);
              // Fallback: parse from old diagnostic format for legacy records
              const legacy = !rows.length && constantes ? constantes.map((line: string) => {
                const [label, value] = line.split(': ');
                return [label, value];
              }) : [];
              const display = rows.length ? rows : legacy;
              return display.length ? (
              <section>
                <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Constantes vitales
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {display.map(([label, value], i) => (
                    <div key={i} className="bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                      <p className="text-xs text-purple-500 font-medium">{label}</p>
                      <p className="text-sm font-semibold text-purple-900">{value}</p>
                    </div>
                  ))}
                </div>
              </section>
              ) : null;
            })()}

            {/* Diagnostic / Notes */}
            {editing ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Diagnostic *</label>
                <textarea
                  value={diagnostic}
                  onChange={e => setDiagnostic(e.target.value)}
                  rows={3}
                  placeholder="Diagnostic médical..."
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            ) : (
              notes && (
                <section>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Diagnostic / Notes</h4>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-200">{notes || consultation.diagnostic}</p>
                </section>
              )
            )}

            {/* Traitement */}
            {editing ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Traitement *</label>
                <textarea
                  value={traitement}
                  onChange={e => setTraitement(e.target.value)}
                  rows={3}
                  placeholder="Prescription et traitement..."
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            ) : (
              consultation.traitement && (
                <section>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Traitement</h4>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap bg-green-50 rounded-lg p-3 border border-green-200">{consultation.traitement}</p>
                </section>
              )
            )}

            {/* Traitement infirmier (case 2: closed without médecin) */}
            {consultation.infirmierTraitement && (
              <section>
                <h4 className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1.5">Traitement infirmier (sans médecin)</h4>
                <p className="text-sm text-orange-900 whitespace-pre-wrap bg-orange-50 rounded-lg p-3 border border-orange-200">{consultation.infirmierTraitement}</p>
              </section>
            )}

            {/* Psychiatrie notes */}
            {(consultation as any).psyNotes && (
              <section>
                <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1.5">🧠 Notes psychiatriques</h4>
                <p className="text-sm text-purple-900 whitespace-pre-wrap bg-purple-50 rounded-lg p-3 border border-purple-200">{(consultation as any).psyNotes}</p>
              </section>
            )}

            {/* Rendez-vous list */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5" /> Rendez-vous
                </h4>
                <button
                  onClick={() => { setShowAddRdv(v => !v); setRdvError(''); }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Plus className="w-3 h-3" /> Ajouter un RDV
                </button>
              </div>

              {/* Add-RDV inline form */}
              {showAddRdv && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="date"
                      value={newRdvDate}
                      onChange={e => setNewRdvDate(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Note (optionnelle)"
                      value={newRdvNote}
                      onChange={e => setNewRdvNote(e.target.value)}
                      className="flex-1 min-w-[140px] px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddRdv}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Enregistrer
                    </button>
                    <button onClick={() => setShowAddRdv(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {rdvError && <p className="text-red-600 text-xs">{rdvError}</p>}
                </div>
              )}

              {/* RDV list */}
              {rdvList.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Aucun rendez-vous planifié.</p>
              ) : (
                <div className="space-y-1.5">
                  {rdvList.map(r => {
                    const isPast = r.rdvDate < new Date().toISOString().slice(0, 10);
                    return (
                      <div
                        key={r.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${
                          r.done
                            ? 'bg-gray-50 border-gray-200 text-gray-400'
                            : isPast
                            ? 'bg-orange-50 border-orange-200 text-orange-800'
                            : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                      >
                        <span className="text-base">{r.done ? '✅' : isPast ? '⚠️' : '📅'}</span>
                        <span className={`font-semibold ${r.done ? 'line-through' : ''}`}>
                          {new Date(r.rdvDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                        {r.note && <span className="text-xs opacity-75 flex-1 truncate">{r.note}</span>}
                        <span className="flex-1" />
                        <button
                          onClick={() => handleToggleDone(r)}
                          title={r.done ? 'Marquer comme à venir' : 'Marquer comme effectué'}
                          className="text-xs px-2 py-0.5 rounded border border-current opacity-70 hover:opacity-100 transition-opacity"
                        >
                          {r.done ? 'Rouvrir' : 'Effectué'}
                        </button>
                        <button
                          onClick={() => handleDeleteRdv(r.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Suivi banner — shown when the earliest pending RDV date has arrived */}
            {rdvHasArrived && onCreateSuivi && (
              <section className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <CalendarClock className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-blue-800">
                    RDV du {new Date(nextPendingRdv!.rdvDate + 'T00:00:00').toLocaleDateString('fr-FR')} — Prêt pour le suivi
                  </h4>
                </div>
                <p className="text-xs text-blue-600 mb-3">
                  La date du rendez-vous est arrivée. Enregistrez la consultation de suivi.
                </p>
                <button
                  onClick={() => onCreateSuivi(consultation.patient, consultation.motif || '', consultation.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Plus className="w-4 h-4" /> Créer une consultation de suivi
                </button>
              </section>
            )}

            {saveError && (
              <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 border border-red-200">{saveError}</p>
            )}

            {/* Action bar */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                      {saving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </>
                ) : canEdit ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    {isPending ? 'Compléter (diagnostic + traitement)' : 'Modifier'}
                  </button>
                ) : null}
              </div>
            </div>
          </>
        )}

        {tab === 'materiels' && (
          <>
            {matError && (
              <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 border border-red-200">{matError}</p>
            )}
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-gray-800">Matériels assignés au patient</h4>
              {!consultation.isExternal && (
                <button
                  onClick={() => setShowAssign(!showAssign)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" /> Assigner
                </button>
              )}
            </div>

            {showAssign && (
              <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                <select
                  value={selectedMat}
                  onChange={e => setSelectedMat(e.target.value ? Number(e.target.value) : '')}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
                >
                  <option value="">Choisir un matériel…</option>
                  {allMaterials.filter((m: any) => m.quantity > 0).map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name} — Stock: {m.quantity}</option>
                  ))}
                </select>
                <button onClick={handleAssign} disabled={!selectedMat} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">
                  OK
                </button>
              </div>
            )}

            {matLoading ? (
              <p className="text-sm text-gray-500 text-center py-4">Chargement…</p>
            ) : materials.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucun matériel assigné.</p>
            ) : (
              <div className="space-y-2">
                {materials.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">Catégorie: {m.category} · Qté: {m.quantity || 1}</p>
                    </div>
                    {!consultation.isExternal && (
                      <button
                        onClick={() => handleUnassign(m.id, m.quantity || 1)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200"
                      >
                        <X className="w-3 h-3" /> Retourner
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
    <p className="text-xs text-gray-500 font-medium">{label}</p>
    <p className="text-sm text-gray-900 font-medium truncate">{value || '—'}</p>
  </div>
);

/* ─── Main Consultations Page ─── */
const Consultations = ({ typeFilter }: { typeFilter?: 'GENERAL' | 'PSYCHIATRIE' } = {}) => {
  const { user, effectiveRole } = useAuth();
  const isNurse = effectiveRole === UserRole.INFIRMIER;
  const canEdit = effectiveRole === UserRole.MEDECIN || effectiveRole === UserRole.ADMIN || effectiveRole === UserRole.SUPER_ADMIN;

  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [externalConsultations, setExternalConsultations] = useState<ConsultationRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'FOLLOW_UP'>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRow | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [error, setError] = useState('');
  const [suiviInitial, setSuiviInitial] = useState<any>(null);

  const fetchConsultations = async () => {
    try {
      setError('');
      const res = await fetch('https://hc.aui.ma/api/consultations');
      if (!res.ok) throw new Error('Failed to fetch consultations');
      const data = await res.json();
      // Build reverse map: externalId → employeeId for staff patients
      const staffExternalIdsRaw = localStorage.getItem('staffExternalIds');
      const staffExternalIds: Record<string, number> = staffExternalIdsRaw ? JSON.parse(staffExternalIdsRaw) : {};
      const reverseStaffIds: Record<number, number> = {};
      for (const [empId, extId] of Object.entries(staffExternalIds)) {
        reverseStaffIds[extId] = Number(empId);
      }
      const resolveDisplayId = (idNum: number): number =>
        idNum < 0 ? (reverseStaffIds[-idNum] ?? idNum) : idNum;

      const rows: ConsultationRow[] = data.map((c: any) => {
        // prochainRdv: prefer backend value, fallback to localStorage for records saved before the migration
        const rdvFromBackend = c.prochainRdv || null;
        const rdvFromStorage = localStorage.getItem(`prochainRdv_${c.id}`) || '';
        const resolvedRdv = rdvFromBackend || rdvFromStorage || '';
        // If backend now has the value, sync it to localStorage so DetailsModal reads consistently
        if (rdvFromBackend && !rdvFromStorage) {
          localStorage.setItem(`prochainRdv_${c.id}`, rdvFromBackend);
        }

        const parentIdFromBackend = c.parentConsultationId ?? null;
        const parentIdFromStorage = localStorage.getItem(`suiviOf_${c.id}`);
        const resolvedParentId = parentIdFromBackend ?? (parentIdFromStorage ? Number(parentIdFromStorage) : undefined);

        return {
          id: c.id,
          patientId: c.patient?.idNum || c.patientId,
          patientName: c.patient
            ? `${c.patient.prenom || ''} ${c.patient.nom || ''} #${resolveDisplayId(c.patient.idNum)}`.trim()
            : `#${c.patientId}`,
          doctorName: `${c.personnel?.prenom || ''} ${c.personnel?.nom || ''}`.trim() || 'Médecin',
          consultationDate: c.dateConsultation,
          notes: [c.motif, c.diagnostic, c.traitement].filter(Boolean).join(' | '),
          status: (c.traitement?.trim() || c.infirmierTraitement?.trim()) ? 'COMPLETED' : 'PENDING',
          prescriptionItems: [],
          motif: c.motif,
          diagnostic: c.diagnostic,
          traitement: c.traitement,
          infirmierTraitement: c.infirmierTraitement,
          patient: c.patient,
          personnelId: c.personnel?.id ?? null,
          consultationType: c.consultationType || 'GENERAL',
          temperature: c.temperature,
          tension: c.tension,
          pouls: c.pouls,
          saturation: c.saturation,
          gaj: c.gaj,
          frequenceRespiratoire: c.frequenceRespiratoire,
          poids: c.poids,
          taille: c.taille,
          psyNotes: c.psyNotes,
          suiviOf: resolvedParentId,
          prochainRdv: resolvedRdv,
          rdvList: c.rdvList ?? [],
        };
      });
      setConsultations(rows);
    } catch (e) {
      setError('Erreur lors du chargement des consultations');
    }
  };

  const loadExternalConsultations = () => {
    try {
      const raw = localStorage.getItem('externalConsultations');
      if (!raw) { setExternalConsultations([]); return; }
      const parsed = JSON.parse(raw) as any[];
      const mapped: ConsultationRow[] = parsed.map((c: any) => ({
        id: c.id,
        patientId: -1,
        patientName: c.patientName,
        doctorName: c.personnelName || 'Médecin',
        consultationDate: c.consultationDate,
        notes: [c.motif, c.diagnostic, c.traitement].filter(Boolean).join(' | '),
        status: (c.traitement?.trim() || c.infirmierTraitement?.trim()) ? 'COMPLETED' : 'PENDING',
        prescriptionItems: [],
        isExternal: true,
        externalCategory: c.external?.category,
        motif: c.motif,
        diagnostic: c.diagnostic,
        traitement: c.traitement,
      }));
      setExternalConsultations(mapped);
    } catch { setExternalConsultations([]); }
  };

  useEffect(() => {
    fetchConsultations();
    loadExternalConsultations();
  }, []);

  const allConsultations = [...externalConsultations, ...consultations];

  const filteredConsultations = allConsultations.filter(c => {
    const matchesSearch = c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesDate = !dateFilter || (c.consultationDate || '').slice(0, 10) === dateFilter;
    const matchesType = !typeFilter || (c.consultationType || 'GENERAL') === typeFilter;
    return matchesSearch && matchesStatus && matchesDate && matchesType;
  });

  const readErrorText = async (res: Response) => {
    try { return await res.text() || res.statusText; } catch { return res.statusText; }
  };

  const handleAddConsultation = async (payload: any) => {
    try {
      if (!payload?.personnel?.id) throw new Error("Aucun personnel lié à votre session.");
      const now = new Date();
      const dateString = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      const patientIdForBackend = payload.patient?.idNum ?? payload.patient?.id;
      const requestBody = {
        patientId: patientIdForBackend,
        personnelId: payload.personnel.id,
        dateConsultation: dateString,
        motif: payload.motif,
        diagnostic: payload.diagnostic,
        traitement: payload.traitement || '',
        infirmierTraitement: payload.infirmierTraitement || undefined,
        consultationType: payload.consultationType || typeFilter || 'GENERAL',
        temperature: payload.temperature,
        tension: payload.tension,
        pouls: payload.pouls,
        saturation: payload.saturation,
        gaj: payload.gaj,
        frequenceRespiratoire: payload.frequenceRespiratoire,
        poids: payload.poids,
        taille: payload.taille,
        psyNotes: payload.psyNotes,
        parentConsultationId: suiviInitial?._parentConsultationId ?? null,
      };
      const res = await fetch('https://hc.aui.ma/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) throw new Error(`Create failed (${res.status}): ${await readErrorText(res)}`);
      const created = await res.json().catch(() => null);
      // If this consultation is a suivi, store the parent link and clear the parent's RDV
      if (created?.id && suiviInitial?._parentConsultationId) {
        localStorage.setItem(`suiviOf_${created.id}`, String(suiviInitial._parentConsultationId));
        saveProchainRdv(suiviInitial._parentConsultationId, '');
      }
      setSuiviInitial(null);
      setIsModalOpen(false);
      await fetchConsultations();
      loadExternalConsultations();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création');
    }
  };

  const handleOpenSuivi = (patient: any, motif: string, parentId: number) => {
    setSuiviInitial({ patient, motif: `Suivi : ${motif}`, _parentConsultationId: parentId });
    setIsDetailsOpen(false);
    setSelectedConsultation(null);
    setIsModalOpen(true);
  };

  const handleDetailsUpdated = (id: number, diagnostic: string, traitement: string) => {
    setConsultations(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, diagnostic, traitement, status: traitement.trim() ? 'COMPLETED' : 'PENDING' }
          : c
      )
    );
    setIsDetailsOpen(false);
    setSelectedConsultation(null);
    fetchConsultations(); // refresh to get updated prochainRdv from backend
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FileText className="w-3 h-3 mr-1" /> Terminée
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 mr-1" /> En attente médecin
          </span>
        );
      case 'FOLLOW_UP':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Calendar className="w-3 h-3 mr-1" /> Suivi
          </span>
        );
      default: return null;
    }
  };

  const pendingCount = allConsultations.filter(c => c.status === 'PENDING').length;
  const completedCount = allConsultations.filter(c => c.status === 'COMPLETED').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            {typeFilter === 'PSYCHIATRIE' ? '🧠 Consultations Psychiatrie' : 'Consultations'}
          </h1>
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: allConsultations.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Terminées', value: completedCount, icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'En attente médecin', value: pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Aujourd\'hui', value: allConsultations.filter(c => c.consultationDate?.slice(0,10) === new Date().toISOString().slice(0,10)).length, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
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

      {/* Pending alert for medecin */}
      {canEdit && pendingCount > 0 && (
        <div
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => setStatusFilter('PENDING')}
        >
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {pendingCount} consultation{pendingCount > 1 ? 's' : ''} en attente de traitement
            </p>
            <p className="text-xs text-amber-600">Cliquez pour filtrer — enregistrées par l'infirmier(e), diagnostic et traitement à compléter.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-500" />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Recherche patient ou médecin…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="COMPLETED">Terminées</option>
              <option value="PENDING">En attente médecin</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {(dateFilter || statusFilter !== 'ALL') && (
              <button
                onClick={() => { setDateFilter(''); setStatusFilter('ALL'); }}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <Filter className="w-3 h-3" /> Effacer filtres
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Personnel</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Statut</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Prochain RDV</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConsultations.map(consultation => {
                const today = new Date().toISOString().slice(0, 10);
                const nextRdvEntry = (consultation.rdvList ?? [])
                  .filter(r => !r.done && r.rdvDate >= today)
                  .sort((a, b) => a.rdvDate.localeCompare(b.rdvDate))[0];
                const rdv = nextRdvEntry?.rdvDate || consultation.prochainRdv || getProchainRdv(consultation.id);
                const isPending = consultation.status === 'PENDING';
                return (
                  <tr
                    key={consultation.id}
                    className={`hover:bg-gray-50 transition-colors ${isPending ? 'bg-amber-50/40' : ''}`}
                  >
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isPending ? 'bg-amber-100' : 'bg-green-100'}`}>
                          <User className={`w-4 h-4 ${isPending ? 'text-amber-600' : 'text-green-600'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{consultation.patientName}</p>
                          {consultation.isExternal && (
                            <span className="text-xs inline-flex items-center px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                              Externe{consultation.externalCategory ? ` · ${consultation.externalCategory}` : ''}
                            </span>
                          )}
                          {consultation.suiviOf && (
                            <span className="text-xs inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 mt-0.5">
                              Suivi #{consultation.suiviOf}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-700">{consultation.doctorName}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {consultation.consultationDate
                        ? new Date(consultation.consultationDate).toLocaleString('fr-MA', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      {getStatusBadge(consultation.status)}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      {rdv ? (
                        <span className="flex items-center gap-1 text-xs text-blue-700 font-medium">
                          <CalendarClock className="w-3.5 h-3.5" />
                          {new Date(rdv).toLocaleDateString('fr-MA')}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => { setSelectedConsultation(consultation); setIsDetailsOpen(true); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isPending && canEdit
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {isPending && canEdit ? (
                          <><Pill className="w-4 h-4" /> Compléter</>
                        ) : (
                          <><ChevronRight className="w-4 h-4" /> Détails</>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
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

      {/* New consultation modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSuiviInitial(null); }}
        title={suiviInitial ? `Suivi — ${suiviInitial.patient?.prenom || ''} ${suiviInitial.patient?.nom || ''}`.trim() : 'Nouvelle consultation'}
      >
        <ConsultationBackendForm
          key={suiviInitial ? `suivi-${suiviInitial._parentConsultationId}` : 'new-consultation'}
          personnelId={user?.id as number}
          initial={suiviInitial}
          onSubmit={handleAddConsultation}
          onCancel={() => { setIsModalOpen(false); setSuiviInitial(null); }}
        />
      </Modal>

      {/* Details modal */}
      {selectedConsultation && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => { setIsDetailsOpen(false); setSelectedConsultation(null); }}
          title={`Consultation — ${selectedConsultation.patientName}`}
        >
          <DetailsModal
            consultation={selectedConsultation}
            canEdit={canEdit}
            onClose={() => { setIsDetailsOpen(false); setSelectedConsultation(null); }}
            onDeleted={fetchConsultations}
            onSaved={handleDetailsUpdated}
            onCreateSuivi={canEdit ? handleOpenSuivi : undefined}
          />
        </Modal>
      )}
    </div>
  );
};

export default Consultations;
