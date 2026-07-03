import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, Calendar, User, FileText, Pill,
  Clock, Trash2, ChevronRight, Activity, AlertCircle, Package, X,
  Stethoscope, Edit2, CalendarClock, Printer, ArrowUpRight, Send,
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
  extremeUrgence?: boolean;
  suiviOf?: number;
  transfertAvisSpecialise?: boolean;
  transfertExamenComplementaire?: boolean;
  transfertPriseEnCharge?: boolean;
  pecNumeroCertifAssurance?: string;
  pecDescription?: string;
  pecCauses?: string;
  pecCin?: string;
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
  onRefresh?: () => void;   // silent list refresh (no modal close)
  onCreateSuivi?: (patient: any, motif: string, parentId: number) => void;
}

const DetailsModal: React.FC<DetailsModalProps> = ({
  consultation, canEdit, onClose, onDeleted, onSaved, onRefresh, onCreateSuivi,
}) => {
  const [tab, setTab] = useState<'info' | 'materiels' | 'transferts'>('info');
  const [editing, setEditing] = useState(false);
  const [diagnostic, setDiagnostic] = useState(consultation.diagnostic || '');
  const [traitement, setTraitement] = useState(consultation.traitement || '');
  const c0 = consultation as any;
  const [editTemp, setEditTemp] = useState(c0.temperature || '');
  const [editTension, setEditTension] = useState(c0.tension || '');
  const [editPouls, setEditPouls] = useState(c0.pouls || '');
  const [editSat, setEditSat] = useState(c0.saturation || '');
  const [editGaj, setEditGaj] = useState(c0.gaj || '');
  const [editFr, setEditFr] = useState(c0.frequenceRespiratoire || '');
  const [editPoids, setEditPoids] = useState(c0.poids || '');
  const [editTaille, setEditTaille] = useState(c0.taille || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [transfertSaved, setTransfertSaved] = useState(false);
  const [rdvList, setRdvList] = useState<Array<{
    id: number; rdvDate: string; note?: string; done: boolean;
    diagnostic?: string; traitement?: string;
    temperature?: string; tension?: string; pouls?: string; saturation?: string;
    gaj?: string; frequenceRespiratoire?: string; poids?: string; taille?: string;
  }>>(
    () => (consultation.rdvList ?? []).slice().sort((a, b) => a.rdvDate.localeCompare(b.rdvDate))
  );
  const [showAddRdv, setShowAddRdv] = useState(false);
  const [newRdvDate, setNewRdvDate] = useState('');
  const [newRdvNote, setNewRdvNote] = useState('');
  const [rdvError, setRdvError] = useState('');
  // Which RDV id is currently open for documentation
  const [documentingRdvId, setDocumentingRdvId] = useState<number | null>(null);
  const [suiviFields, setSuiviFields] = useState<Record<string, string>>({});

  const [materials, setMaterials] = useState<any[]>([]);
  const [allMaterials, setAllMaterials] = useState<any[]>([]);
  const [matLoading, setMatLoading] = useState(false);
  const [matError, setMatError] = useState('');
  const [selectedMat, setSelectedMat] = useState<number | ''>('');
  const [showAssign, setShowAssign] = useState(false);

  // Transferts state
  const [transfertAvis, setTransfertAvis] = useState<boolean>(c0.transfertAvisSpecialise ?? false);
  const [transfertExamen, setTransfertExamen] = useState<boolean>(c0.transfertExamenComplementaire ?? false);
  const [transfertPec, setTransfertPec] = useState<boolean>(c0.transfertPriseEnCharge ?? false);
  const [pecAssurance, setPecAssurance] = useState<string>(c0.pecNumeroCertifAssurance ?? '');
  const [pecDescriptionText, setPecDescriptionText] = useState<string>(c0.pecDescription ?? '');
  const [pecCausesText, setPecCausesText] = useState<string>(c0.pecCauses ?? '');
  const [pecCin, setPecCin] = useState<string>(c0.pecCin ?? '');

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
          temperature: editTemp || null,
          tension: editTension || null,
          pouls: editPouls || null,
          saturation: editSat || null,
          gaj: editGaj || null,
          frequenceRespiratoire: editFr || null,
          poids: editPoids || null,
          taille: editTaille || null,
          psyNotes: c0.psyNotes,
          extremeUrgence: c0.extremeUrgence ?? null,
          prochainRdv: consultation.prochainRdv || null,
          parentConsultationId: consultation.suiviOf ?? null,
          transfertAvisSpecialise: transfertAvis || null,
          transfertExamenComplementaire: transfertExamen || null,
          transfertPriseEnCharge: transfertPec || null,
          pecNumeroCertifAssurance: pecAssurance || null,
          pecDescription: pecDescriptionText || null,
          pecCauses: pecCausesText || null,
          pecCin: pecCin || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      saveProchainRdv(consultation.id, consultation.prochainRdv || '');
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

const handleDeleteRdv = async (id: number) => {
    try {
      await fetch(`${RDV_API}/${id}`, { method: 'DELETE' });
      await refreshRdvList();
    } catch { /* silent */ }
  };

  const handleSaveSuiviNotes = async (rdv: typeof rdvList[0]) => {
    try {
      await fetch(`${RDV_API}/${rdv.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rdv,
          done: true,
          diagnostic:           suiviFields.diagnostic           || null,
          traitement:           suiviFields.traitement           || null,
          temperature:          suiviFields.temperature          || null,
          tension:              suiviFields.tension              || null,
          pouls:                suiviFields.pouls                || null,
          saturation:           suiviFields.saturation           || null,
          gaj:                  suiviFields.gaj                  || null,
          frequenceRespiratoire:suiviFields.frequenceRespiratoire|| null,
          poids:                suiviFields.poids                || null,
          taille:               suiviFields.taille               || null,
        }),
      });
      setDocumentingRdvId(null);
      setSuiviFields({});
      await refreshRdvList();
    } catch (e: any) { setRdvError(e.message || 'Erreur lors de la sauvegarde'); }
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

  const handleSaveTransferts = async () => {
    setSaving(true); setSaveError(''); setTransfertSaved(false);
    const payload = {
      id: consultation.id,
      patientId: consultation.patientId,
      personnelId: consultation.personnelId,
      dateConsultation: consultation.consultationDate,
      motif: consultation.motif,
      diagnostic,
      traitement,
      infirmierTraitement: consultation.infirmierTraitement,
      consultationType: consultation.consultationType,
      temperature: editTemp || null,
      tension: editTension || null,
      pouls: editPouls || null,
      saturation: editSat || null,
      gaj: editGaj || null,
      frequenceRespiratoire: editFr || null,
      poids: editPoids || null,
      taille: editTaille || null,
      psyNotes: c0.psyNotes,
      extremeUrgence: c0.extremeUrgence ?? null,
      prochainRdv: consultation.prochainRdv || null,
      parentConsultationId: consultation.suiviOf ?? null,
      transfertAvisSpecialise: transfertAvis || null,
      transfertExamenComplementaire: transfertExamen || null,
      transfertPriseEnCharge: transfertPec || null,
      pecNumeroCertifAssurance: pecAssurance || null,
      pecDescription: pecDescriptionText || null,
      pecCauses: pecCausesText || null,
      pecCin: pecCin || null,
    };
    try {
      const res = await fetch(`https://hc.aui.ma/api/consultations/${consultation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('[handleSaveTransferts] HTTP', res.status, errText);
        throw new Error(`Erreur ${res.status}: ${errText}`);
      }
      setTransfertSaved(true);
      setTimeout(() => setTransfertSaved(false), 3000);
      onRefresh?.();
    } catch (e: any) {
      console.error('[handleSaveTransferts]', e);
      setSaveError(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const printPec = () => {
    const isStudent = consultation.patient?.typePatient === 'ETUDIANT';
    // Strip "#ID" suffix from patient name (e.g. "John Doe #84451" → "John Doe")
    const patientName = consultation.patient
      ? `${consultation.patient.prenom || ''} ${consultation.patient.nom || ''}`.trim()
      : (consultation.patientName ?? '').replace(/\s*#[\d-]+\s*$/, '').trim();
    // For student: auto idNum (positive); for staff: manual CIN entered by doctor
    const idValueForDoc = isStudent ? String(consultation.patient?.idNum ?? '') : pecCin;
    const doctorName = consultation.doctorName ?? '';
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' });
    const logoUrl = `${window.location.origin}/assets/auilogo.png`;
    const idLabel = isStudent ? "Carte d'étudiant(e) N°" : "Carte d'Identité Nationale N°";
    const idLabelEn = isStudent ? "(Student Identity Card N°)" : "(National Identity Card N°)";
    const descLabel = isStudent
      ? "Brève description du problème de l'étudiant(e)"
      : "Brève description du problème de l'employé(e)";
    const descLabelEn = isStudent
      ? "(Brief Description of the Medical Problem of the Student)"
      : "(Brief Description of the Medical Problem of the Employee)";
    const authSubject = isStudent ? "l'étudiant(e)" : "l'employé(e)";
    const authSubjectEn = isStudent ? "student" : "employee";

    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Prise en Charge — ${esc(patientName)}</title>
  <style>
    @page { size: A4 portrait; margin: 20mm 18mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #000; margin: 0; padding: 0; }
    .header { display: flex; align-items: center; gap: 18px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2.5px solid #003366; }
    .logo { width: 88px; height: auto; flex-shrink: 0; }
    .header-text { flex: 1; text-align: center; }
    .header-text .hc { font-size: 13pt; font-weight: bold; color: #003366; margin: 0 0 4px; letter-spacing: 1px; }
    .header-text .title-fr { font-size: 12pt; font-weight: bold; color: #003366; margin: 0 0 2px; }
    .header-text .title-en { font-size: 10pt; color: #444; font-style: italic; margin: 0; }
    .row2 { display: flex; gap: 30px; margin-bottom: 10px; }
    .field-block { margin-bottom: 10px; }
    .field-label { font-size: 10.5pt; font-weight: bold; }
    .field-sublabel { font-size: 9pt; color: #666; font-style: italic; margin-top: 1px; }
    .field-value { border-bottom: 1px solid #333; min-height: 22px; padding: 1px 3px; display: inline-block; min-width: 180px; font-size: 11pt; }
    .field-value.wide { min-width: 320px; }
    .desc-section { margin: 14px 0; }
    .desc-section .lbl { font-weight: bold; font-size: 10.5pt; margin-bottom: 2px; }
    .desc-section .sub { font-size: 9pt; font-style: italic; color: #666; margin-bottom: 6px; }
    .desc-box { border: 1px solid #555; min-height: 80px; padding: 6px 8px; font-size: 11pt; white-space: pre-wrap; word-wrap: break-word; }
    .causes-box { border: 1px solid #555; min-height: 54px; padding: 6px 8px; font-size: 11pt; white-space: pre-wrap; word-wrap: break-word; }
    .auth { margin: 18px 0 8px; font-size: 10.5pt; line-height: 1.7; }
    .sig-row { display: flex; gap: 40px; margin-top: 28px; }
    .sig-block { flex: 1; }
    .sig-label { font-weight: bold; font-size: 10.5pt; margin-bottom: 4px; }
    .sig-sublabel { font-size: 9pt; font-style: italic; color: #666; }
    .sig-line { border-bottom: 1px solid #333; min-height: 50px; margin-top: 6px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoUrl}" class="logo" alt="AUI Logo" onerror="this.style.display='none'" />
    <div class="header-text">
      <p class="hc">HEALTH CENTER</p>
      <p class="title-fr">AUTORISATION DE PRISE EN CHARGE MEDICALE</p>
      <p class="title-en">MEDICAL TREATMENT AUTHORIZATION FORM</p>
    </div>
  </div>

  <div class="row2">
    <div class="field-block" style="flex:1">
      <div class="field-label">Date : <span class="field-value">${esc(dateStr)}</span></div>
      <div class="field-sublabel">(Date)</div>
    </div>
    <div class="field-block" style="flex:1">
      <div class="field-label">Heure : <span class="field-value">${esc(timeStr)}</span></div>
      <div class="field-sublabel">(Time)</div>
    </div>
  </div>

  <div class="field-block">
    <div class="field-label">Nom &amp; Prénom : <span class="field-value wide">${esc(patientName)}</span></div>
    <div class="field-sublabel">(Full Name)</div>
  </div>

  <div class="row2">
    <div class="field-block" style="flex:1">
      <div class="field-label">${esc(idLabel)} : <span class="field-value">${esc(idValueForDoc)}</span></div>
      <div class="field-sublabel">${esc(idLabelEn)}</div>
    </div>
    <div class="field-block" style="flex:1">
      <div class="field-label">Certificat d'assurance N° : <span class="field-value">${esc(pecAssurance)}</span></div>
      <div class="field-sublabel">(Insurance Certificate N°)</div>
    </div>
  </div>

  <div class="desc-section">
    <div class="lbl">${esc(descLabel)} :</div>
    <div class="sub">${esc(descLabelEn)}</div>
    <div class="desc-box">${esc(pecDescriptionText)}</div>
  </div>

  <div class="desc-section">
    <div class="lbl">Causes et circonstances en cas d'accident :</div>
    <div class="sub">(Causes &amp; Circumstances in case of accident)</div>
    <div class="causes-box">${esc(pecCausesText)}</div>
  </div>

  <div class="auth">
    <p>Ce formulaire autorise …………………..à prendre en charge ${esc(authSubject)} susmentionné(e) à la limite de l'étendue des garanties du contrat d'assurance.</p>
    <p><em>This Form authorizes ………………………..to treat the above-mentioned ${esc(authSubjectEn)} to the limits of guarantees stipulated in the insurance contract.</em></p>
  </div>

  <div class="sig-row">
    <div class="sig-block">
      <div class="sig-label">Nom du médecin : ${esc(doctorName)}</div>
      <div class="sig-sublabel">(Doctor's name)</div>
    </div>
    <div class="sig-block">
      <div class="sig-label">Signature :</div>
      <div class="sig-sublabel">(Signature)</div>
      <div class="sig-line"></div>
    </div>
  </div>

  <script>window.onload = function() { setTimeout(function() { window.print(); }, 400); };</script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=870,height=1150,scrollbars=yes');
    if (w) { w.document.write(html); w.document.close(); }
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

      {/* Tabs — hide Matériels for psychiatry consultations */}
      <div className="flex border-b border-gray-200 px-5">
        {(['info', 'materiels', 'transferts'] as const)
          .filter(t => t !== 'materiels' || consultation.consultationType !== 'PSYCHIATRIE')
          .map(t => (
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
            ) : t === 'materiels' ? (
              <span className="flex items-center gap-1.5"><Package className="w-4 h-4" /> Matériels</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Send className="w-4 h-4" /> Transferts
                {(transfertAvis || transfertExamen || transfertPec) && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </span>
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

            {/* Constantes vitales */}
            <section>
              <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Constantes vitales
              </h4>
              {editing ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'T° (°C)', value: editTemp, set: setEditTemp, placeholder: '37.0' },
                    { label: 'TA', value: editTension, set: setEditTension, placeholder: '120/80' },
                    { label: 'Pouls (bpm)', value: editPouls, set: setEditPouls, placeholder: '72' },
                    { label: 'Sat. (%)', value: editSat, set: setEditSat, placeholder: '98' },
                    { label: 'GàJ', value: editGaj, set: setEditGaj, placeholder: '1.0 g/L' },
                    { label: 'FR (/min)', value: editFr, set: setEditFr, placeholder: '16' },
                    { label: 'Poids (kg)', value: editPoids, set: setEditPoids, placeholder: '70' },
                    { label: 'Taille (cm)', value: editTaille, set: setEditTaille, placeholder: '175' },
                  ].map(({ label, value, set, placeholder }) => (
                    <div key={label}>
                      <label className="block text-xs text-purple-600 font-medium mb-0.5">{label}</label>
                      <input
                        type="text"
                        value={value}
                        onChange={e => set(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-2 py-1.5 text-sm border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                (() => {
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
                  const legacy = !rows.length && constantes ? constantes.map((line: string) => {
                    const [label, value] = line.split(': ');
                    return [label, value];
                  }) : [];
                  const display = rows.length ? rows : legacy;
                  return display.length ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {display.map(([label, value], i) => (
                        <div key={i} className="bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                          <p className="text-xs text-purple-500 font-medium">{label}</p>
                          <p className="text-sm font-semibold text-purple-900">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Aucune constante enregistrée.</p>
                  );
                })()
              )}
            </section>

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

            {/* Extrême urgence badge (psychiatry only) */}
            {consultation.consultationType === 'PSYCHIATRIE' && (consultation as any).extremeUrgence && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-300 rounded-lg px-4 py-3">
                <span className="text-xl">🚨</span>
                <span className="text-sm font-bold text-red-700">Extrême urgence signalée</span>
              </div>
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
                <div className="space-y-2">
                  {rdvList.map(r => {
                    const isPast = r.rdvDate < new Date().toISOString().slice(0, 10);
                    const isDocumenting = documentingRdvId === r.id;
                    const sf = (k: string) => suiviFields[k] || '';
                    const setSf = (k: string, v: string) => setSuiviFields(prev => ({ ...prev, [k]: v }));

                    const constantes = [
                      r.temperature && `T° ${r.temperature}°C`,
                      r.tension && `TA ${r.tension}`,
                      r.pouls && `P ${r.pouls} bpm`,
                      r.saturation && `Sat ${r.saturation}%`,
                      r.gaj && `GàJ ${r.gaj}`,
                      r.frequenceRespiratoire && `FR ${r.frequenceRespiratoire}/min`,
                      r.poids && `${r.poids} kg`,
                      r.taille && `${r.taille} cm`,
                    ].filter(Boolean);

                    return (
                      <div key={r.id} className={`rounded-xl border overflow-hidden ${
                        r.done ? 'border-green-200' : isPast ? 'border-orange-200' : 'border-blue-200'
                      }`}>
                        {/* Row header */}
                        <div className={`flex items-center gap-3 px-3 py-2 text-sm ${
                          r.done ? 'bg-green-50 text-green-800' : isPast ? 'bg-orange-50 text-orange-800' : 'bg-blue-50 text-blue-800'
                        }`}>
                          <span className="text-base flex-shrink-0">{r.done ? '✅' : isPast ? '⚠️' : '📅'}</span>
                          <span className={`font-semibold ${r.done ? '' : ''}`}>
                            {new Date(r.rdvDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                          {r.note && <span className="text-xs opacity-70 truncate">{r.note}</span>}
                          <span className="flex-1" />
                          {/* Documenter button — only if not yet done and canEdit */}
                          {!r.done && canEdit && (
                            <button
                              onClick={() => {
                                setDocumentingRdvId(isDocumenting ? null : r.id);
                                setSuiviFields({});
                              }}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                                isDocumenting
                                  ? 'bg-white border-current opacity-60'
                                  : 'bg-white border-current hover:bg-opacity-80'
                              }`}
                            >
                              {isDocumenting ? 'Annuler' : 'Ajouter les notes du RDV'}
                            </button>
                          )}
                          <button onClick={() => handleDeleteRdv(r.id)} className="text-current opacity-40 hover:opacity-80 transition-opacity flex-shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Documented suivi notes (read-only) */}
                        {r.done && (r.diagnostic || r.traitement || constantes.length > 0) && (
                          <div className="px-4 py-3 bg-white space-y-2 border-t border-green-100">
                            {constantes.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {constantes.map(c => (
                                  <span key={c} className="text-xs bg-purple-50 border border-purple-100 text-purple-700 rounded px-2 py-0.5 font-medium">{c}</span>
                                ))}
                              </div>
                            )}
                            {r.diagnostic && (
                              <p className="text-xs text-gray-700"><span className="font-semibold text-gray-500 uppercase tracking-wide">Diagnostic : </span>{r.diagnostic}</p>
                            )}
                            {r.traitement && (
                              <p className="text-xs text-green-800 bg-green-50 rounded px-2 py-1 border border-green-100"><span className="font-semibold uppercase tracking-wide">Traitement : </span>{r.traitement}</p>
                            )}
                          </div>
                        )}

                        {/* Inline documentation form */}
                        {isDocumenting && (
                          <div className="px-4 py-4 bg-white border-t border-blue-100 space-y-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Constantes vitales</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { key: 'temperature', label: 'T° (°C)', placeholder: '37.2' },
                                { key: 'tension', label: 'TA', placeholder: '120/80' },
                                { key: 'pouls', label: 'Pouls (bpm)', placeholder: '72' },
                                { key: 'saturation', label: 'Sat. (%)', placeholder: '98' },
                                { key: 'gaj', label: 'GàJ', placeholder: '0.9' },
                                { key: 'frequenceRespiratoire', label: 'FR (/min)', placeholder: '16' },
                                { key: 'poids', label: 'Poids (kg)', placeholder: '70' },
                                { key: 'taille', label: 'Taille (cm)', placeholder: '175' },
                              ].map(({ key, label, placeholder }) => (
                                <div key={key}>
                                  <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
                                  <input
                                    type="text"
                                    placeholder={placeholder}
                                    value={sf(key)}
                                    onChange={e => setSf(key, e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                                  />
                                </div>
                              ))}
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Diagnostic</label>
                              <textarea
                                rows={2}
                                placeholder="Observations et diagnostic…"
                                value={sf('diagnostic')}
                                onChange={e => setSf('diagnostic', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 resize-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Traitement</label>
                              <textarea
                                rows={2}
                                placeholder="Prescription et traitement…"
                                value={sf('traitement')}
                                onChange={e => setSf('traitement', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-green-300 rounded-lg focus:ring-2 focus:ring-green-400 resize-none"
                              />
                            </div>
                            {rdvError && <p className="text-red-600 text-xs">{rdvError}</p>}
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => { setDocumentingRdvId(null); setSuiviFields({}); }}
                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={() => handleSaveSuiviNotes(r)}
                                className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                              >
                                Enregistrer les notes
                              </button>
                            </div>
                          </div>
                        )}
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

        {tab === 'transferts' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-blue-600" /> Transferts
              </h4>
              <p className="text-xs text-gray-500 mb-3">Cochez les transferts applicables à cette consultation.</p>
              <div className="space-y-2">
                {([
                  { key: 'avis', label: 'Avis spécialisé', val: transfertAvis, set: setTransfertAvis },
                  { key: 'examen', label: 'Examen complémentaire', val: transfertExamen, set: setTransfertExamen },
                  { key: 'pec', label: 'Prise en charge', val: transfertPec, set: setTransfertPec },
                ] as const).map(({ key, label, val, set }) => (
                  <label key={key} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer select-none transition-all ${
                    val ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        val ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}
                      onClick={() => canEdit && (set as any)(!val)}
                    >
                      {val && <span className="text-white text-xs font-bold leading-none">✓</span>}
                    </div>
                    <span
                      className={`text-sm font-medium ${val ? 'text-blue-800' : 'text-gray-700'}`}
                      onClick={() => canEdit && (set as any)(!val)}
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {transfertPec && (
              <div className="border-2 border-blue-200 rounded-xl bg-blue-50/40 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                    <Printer className="w-4 h-4" />
                    Formulaire de Prise en Charge
                  </h5>
                  <button
                    onClick={printPec}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> Imprimer / PDF
                  </button>
                </div>

                {/* Patient type indicator */}
                <div className="text-xs font-medium text-blue-700 bg-blue-100 rounded-lg px-3 py-2">
                  {consultation.patient?.typePatient === 'ETUDIANT'
                    ? `🎓 Formulaire étudiant(e)`
                    : '👤 Formulaire employé(e) / personnel'}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* ID field: auto for student, manual CIN for staff */}
                  {consultation.patient?.typePatient === 'ETUDIANT' ? (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Carte d'étudiant(e) N° <span className="text-gray-400 font-normal">(auto)</span>
                      </label>
                      <div className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium">
                        {consultation.patient?.idNum ?? '—'}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Carte d'Identité Nationale N°
                      </label>
                      <input
                        type="text"
                        value={pecCin}
                        onChange={e => setPecCin(e.target.value)}
                        placeholder="N° CIN du patient"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Certificat d'assurance N°
                    </label>
                    <input
                      type="text"
                      value={pecAssurance}
                      onChange={e => setPecAssurance(e.target.value)}
                      placeholder="Numéro du certificat"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {consultation.patient?.typePatient === 'ETUDIANT'
                      ? "Brève description du problème de l'étudiant(e)"
                      : "Brève description du problème de l'employé(e)"}
                  </label>
                  <textarea
                    value={pecDescriptionText}
                    onChange={e => setPecDescriptionText(e.target.value)}
                    rows={4}
                    placeholder="Décrivez le problème médical…"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Causes et circonstances en cas d'accident
                  </label>
                  <textarea
                    value={pecCausesText}
                    onChange={e => setPecCausesText(e.target.value)}
                    rows={3}
                    placeholder="Causes et circonstances (si applicable)…"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>

                <p className="text-xs text-gray-500 italic">
                  Les données du patient (nom, date, médecin) seront automatiquement incluses lors de l'impression.
                </p>
              </div>
            )}

            {canEdit && (
              <button
                onClick={handleSaveTransferts}
                disabled={saving}
                className={`w-full py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors ${
                  transfertSaved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {saving ? 'Enregistrement…' : transfertSaved ? '✓ Enregistré avec succès' : 'Enregistrer les transferts'}
              </button>
            )}
            {saveError && (
              <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 text-sm text-red-800">
                ⚠ {saveError}
              </div>
            )}
          </div>
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
  const isAdmin = effectiveRole === UserRole.ADMIN || effectiveRole === UserRole.SUPER_ADMIN;
  const canEdit = effectiveRole === UserRole.MEDECIN || effectiveRole === UserRole.PSY || isAdmin;

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
          extremeUrgence: c.extremeUrgence === true,
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
        {/* Nurses cannot create psychiatry consultations */}
        {!(typeFilter === 'PSYCHIATRIE' && isNurse) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nouvelle consultation
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Extreme urgence alert — psychiatry page, admin only */}
      {typeFilter === 'PSYCHIATRIE' && isAdmin && (() => {
        const urgent = allConsultations.filter(c => (c as any).extremeUrgence === true);
        if (!urgent.length) return null;
        return (
          <div className="bg-red-50 border-2 border-red-400 rounded-xl px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚨</span>
              <span className="font-bold text-red-700 text-sm">
                {urgent.length} consultation{urgent.length > 1 ? 's' : ''} en extrême urgence
              </span>
            </div>
            <div className="space-y-1">
              {urgent.map(c => (
                <div
                  key={c.id}
                  onClick={() => { setSelectedConsultation(c); setIsDetailsOpen(true); }}
                  className="flex items-center gap-3 bg-white border border-red-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-red-50 transition-colors"
                >
                  <span className="font-semibold text-sm text-red-800">{c.patientName}</span>
                  <span className="text-xs text-red-500">{new Date(c.consultationDate).toLocaleDateString('fr-FR')}</span>
                  {c.motif && <span className="text-xs text-gray-500 truncate">{c.motif}</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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
          lockedType={typeFilter}
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
            onRefresh={fetchConsultations}
            onCreateSuivi={canEdit ? handleOpenSuivi : undefined}
          />
        </Modal>
      )}
    </div>
  );
};

export default Consultations;
