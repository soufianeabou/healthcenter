import { useEffect, useState, useMemo } from 'react';
import {
  Stethoscope, Users, AlertTriangle, Package, Calendar,
  Clock, CheckCircle2, FileText, ChevronRight, Activity,
  GraduationCap, ShieldCheck, Heart, Loader2, Phone, MapPin,
  ClipboardList, ArrowRight, UserCog,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/roles';

const API = 'https://hc.aui.ma';

const today = () => {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
};
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' });

/* ── Small reusable stat card ── */
const Stat = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
    </div>
  </div>
);

/* ── Quick link card ── */
const Quick = ({ icon: Icon, label, to, color }: { icon: any; label: string; to: string; color: string }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-left group"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
      <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-gray-500" />
    </button>
  );
};

/* ══════════════════════════════════════════════════════
   ADMIN / SUPER_ADMIN dashboard
══════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/consultations`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/consultations/materials`).then(r => r.ok ? r.json() : []),
    ]).then(([c, m]) => {
      setConsultations(Array.isArray(c) ? c : []);
      setMaterials(Array.isArray(m) ? m : []);
    }).finally(() => setLoading(false));
  }, []);

  const todayConsultations = useMemo(() =>
    consultations.filter(c => c.dateConsultation && new Date(c.dateConsultation) >= today()),
    [consultations]);
  const pending = useMemo(() => consultations.filter(c => !c.traitement?.trim()), [consultations]);
  const lowStock = useMemo(() => materials.filter((m: any) => m.minThreshold > 0 && m.quantity <= m.minThreshold), [materials]);

  const recent = useMemo(() =>
    [...consultations]
      .filter(c => c.dateConsultation)
      .sort((a, b) => new Date(b.dateConsultation).getTime() - new Date(a.dateConsultation).getTime())
      .slice(0, 6),
    [consultations]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Consultations ce mois" value={consultations.filter(c => {
          const d = new Date(c.dateConsultation || '');
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length} icon={Stethoscope} color="bg-blue-500" />
        <Stat label="Aujourd'hui" value={todayConsultations.length} icon={Calendar} color="bg-green-500" />
        <Stat label="En attente médecin" value={pending.length} icon={Clock} color="bg-amber-500" />
        <Stat label="Alertes stock matériels" value={lowStock.length} icon={AlertTriangle} color={lowStock.length > 0 ? 'bg-red-500' : 'bg-gray-400'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent consultations */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Consultations récentes</h3>
            <a href="/consultations" className="text-xs text-blue-600 hover:underline flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></a>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">Aucune consultation.</p>
            ) : recent.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.traitement?.trim() ? 'bg-green-400' : 'bg-amber-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {c.patient ? `${c.patient.prenom || ''} ${c.patient.nom || ''}`.trim() : 'Patient externe'}
                  </p>
                  <p className="text-xs text-gray-500">{c.motif || '—'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">{c.dateConsultation ? fmtDate(c.dateConsultation) : '—'}</p>
                  <p className="text-xs text-gray-400">{c.dateConsultation ? fmtTime(c.dateConsultation) : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 px-1">Accès rapide</h3>
          <Quick icon={Stethoscope} label="Consultations" to="/consultations" color="bg-blue-500" />
          <Quick icon={Users} label="Patients" to="/patients" color="bg-green-600" />
          <Quick icon={Package} label="Matériels" to="/materiels" color="bg-purple-500" />
          <Quick icon={UserCog} label="Personnel" to="/personnel" color="bg-gray-600" />
          <Quick icon={FileText} label="Rapports" to="/reports" color="bg-indigo-500" />
          <Quick icon={CheckCircle2} label="Certificats médicaux" to="/certificate-review" color="bg-teal-500" />
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Stock critique — matériels
          </h4>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((m: any) => (
              <span key={m.id} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                {m.name} ({m.quantity} / min {m.minThreshold})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MÉDECIN dashboard
══════════════════════════════════════════════════════ */
const MedecinDashboard = ({ user }: { user: any }) => {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/consultations`).then(r => r.ok ? r.json() : [])
      .then(d => setConsultations(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  const todayList = useMemo(() =>
    consultations.filter(c => c.dateConsultation && new Date(c.dateConsultation) >= today())
      .sort((a, b) => new Date(b.dateConsultation).getTime() - new Date(a.dateConsultation).getTime()),
    [consultations]);

  const pendingList = useMemo(() =>
    consultations.filter(c => !c.traitement?.trim())
      .sort((a, b) => new Date(b.dateConsultation || '').getTime() - new Date(a.dateConsultation || '').getTime()),
    [consultations]);

  const distinctPatients = useMemo(() => new Set(todayList.map(c => c.patient?.idNum)).size, [todayList]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Consultations aujourd'hui" value={todayList.length} icon={Stethoscope} color="bg-blue-500" />
        <Stat label="Patients vus (aujourd'hui)" value={distinctPatients} icon={Users} color="bg-green-500" />
        <Stat label="En attente de traitement" value={pendingList.length} icon={Clock} color={pendingList.length > 0 ? 'bg-amber-500' : 'bg-gray-400'} />
        <Stat label="Total ce mois" value={consultations.filter(c => {
          const d = new Date(c.dateConsultation || '');
          const n = new Date();
          return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
        }).length} icon={Activity} color="bg-purple-500" />
      </div>

      {pendingList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-amber-800 flex items-center gap-2">
              <Clock className="w-4 h-4" /> {pendingList.length} consultation{pendingList.length > 1 ? 's' : ''} en attente de traitement
            </h3>
            <button onClick={() => navigate('/consultations')} className="text-xs text-amber-700 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {pendingList.slice(0, 3).map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-white rounded-lg px-4 py-2.5 border border-amber-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {c.patient ? `${c.patient.prenom || ''} ${c.patient.nom || ''}`.trim() : 'Patient'}
                    <span className="ml-2 text-xs text-gray-400">#{c.patient?.idNum}</span>
                  </p>
                  <p className="text-xs text-gray-500">{c.motif || '—'} · {c.dateConsultation ? fmtDate(c.dateConsultation) : ''}</p>
                </div>
                <button onClick={() => navigate('/consultations')} className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-medium">
                  Compléter
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Consultations aujourd'hui</h3>
          </div>
          {todayList.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">Aucune consultation aujourd'hui.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayList.slice(0, 6).map(c => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-2 h-2 rounded-full ${c.traitement?.trim() ? 'bg-green-400' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {c.patient ? `${c.patient.prenom || ''} ${c.patient.nom || ''}`.trim() : 'Externe'}
                    </p>
                    <p className="text-xs text-gray-500">{c.motif || '—'}</p>
                  </div>
                  <span className="text-xs text-gray-400">{fmtTime(c.dateConsultation)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 px-1">Accès rapide</h3>
          <Quick icon={Stethoscope} label="Toutes les consultations" to="/consultations" color="bg-blue-500" />
          <Quick icon={Users} label="Patients" to="/patients" color="bg-green-600" />
          <Quick icon={Package} label="Liste des matériels" to="/materiels-list" color="bg-purple-500" />
          <Quick icon={CheckCircle2} label="Certificats médicaux" to="/certificate-review" color="bg-teal-500" />
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   INFIRMIER dashboard
══════════════════════════════════════════════════════ */
const InfirmierDashboard = () => {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/consultations`).then(r => r.ok ? r.json() : [])
      .then(d => setConsultations(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  const todayList = useMemo(() =>
    consultations
      .filter(c => c.dateConsultation && new Date(c.dateConsultation) >= today())
      .sort((a, b) => new Date(b.dateConsultation).getTime() - new Date(a.dateConsultation).getTime()),
    [consultations]);

  const myPending = useMemo(() => todayList.filter(c => !c.traitement?.trim()), [todayList]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat label="Enregistrées aujourd'hui" value={todayList.length} icon={Stethoscope} color="bg-blue-500" />
        <Stat label="En attente du médecin" value={myPending.length} icon={Clock} color={myPending.length > 0 ? 'bg-amber-500' : 'bg-gray-400'} />
        <Stat label="Total ce mois" value={consultations.filter(c => {
          const d = new Date(c.dateConsultation || '');
          const n = new Date();
          return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
        }).length} icon={Activity} color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">File du jour</h3>
            <button
              onClick={() => navigate('/consultations')}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
            >
              + Nouvelle consultation
            </button>
          </div>
          {todayList.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Heart className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucune consultation enregistrée aujourd'hui.</p>
              <button onClick={() => navigate('/consultations')} className="mt-3 text-xs text-green-600 hover:underline">
                Enregistrer une consultation →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayList.slice(0, 8).map(c => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.traitement?.trim() ? 'bg-green-400' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {c.patient ? `${c.patient.prenom || ''} ${c.patient.nom || ''}`.trim() : 'Patient externe'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{c.motif || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{fmtTime(c.dateConsultation)}</p>
                    <span className={`text-xs font-medium ${c.traitement?.trim() ? 'text-green-600' : 'text-amber-600'}`}>
                      {c.traitement?.trim() ? 'Terminée' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 px-1">Accès rapide</h3>
          <Quick icon={Stethoscope} label="Consultations" to="/consultations" color="bg-blue-500" />
          <Quick icon={Users} label="Patients" to="/patients" color="bg-green-600" />
          <Quick icon={Package} label="Matériels" to="/materiels-list" color="bg-purple-500" />
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   STUDENT dashboard
══════════════════════════════════════════════════════ */
const StudentDashboard = ({ user }: { user: any }) => {
  const navigate = useNavigate();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    fetch(`${API}/api/consultations/certificates/student/${encodeURIComponent(user.email)}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setCerts(Array.isArray(d) ? d : []))
      .catch(() => setCerts([]))
      .finally(() => setLoading(false));
  }, [user?.email]);

  const pending = certs.filter(c => c.healthCenterStatus === 'PENDING_HC');
  const hcApproved = certs.filter(c => c.healthCenterStatus === 'APPROVED_HC');
  const approved = certs.filter(c => c.dsaStatus === 'APPROVED_DSA');

  const statusLabel: Record<string, { label: string; color: string }> = {
    PENDING_HC:   { label: 'En attente HC',    color: 'bg-amber-100 text-amber-800' },
    APPROVED_HC:  { label: 'Approuvé HC',       color: 'bg-blue-100 text-blue-800' },
    REJECTED_HC:  { label: 'Refusé HC',         color: 'bg-red-100 text-red-800' },
    APPROVED_DSA: { label: 'Approuvé DSA',      color: 'bg-green-100 text-green-800' },
    REJECTED_DSA: { label: 'Refusé DSA',        color: 'bg-red-100 text-red-800' },
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <GraduationCap className="w-6 h-6" />
          <h2 className="text-lg font-semibold">Bienvenue, {user?.prenom || 'Étudiant(e)'} !</h2>
        </div>
        <p className="text-teal-100 text-sm">
          Portail santé AUI — soumettez vos certificats médicaux d'absence et suivez leur statut.
        </p>
        <button
          onClick={() => navigate('/my-certificates')}
          className="mt-4 inline-flex items-center gap-2 bg-white text-teal-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors"
        >
          <ClipboardList className="w-4 h-4" /> Mes certificats médicaux
        </button>
      </div>

      {/* Certificate stats */}
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Soumis" value={certs.length} icon={FileText} color="bg-gray-500" />
        <Stat label="En cours de traitement" value={pending.length + hcApproved.length} icon={Clock} color="bg-amber-500" />
        <Stat label="Approuvés (DSA)" value={approved.length} icon={CheckCircle2} color="bg-green-500" />
      </div>

      {/* Recent certificates */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Mes derniers certificats</h3>
          <button onClick={() => navigate('/my-certificates')} className="text-xs text-teal-600 hover:underline flex items-center gap-1">
            Voir tout <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">Chargement…</div>
        ) : certs.length === 0 ? (
          <div className="py-10 text-center">
            <ClipboardList className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400 mb-3">Aucun certificat soumis pour le moment.</p>
            <button onClick={() => navigate('/my-certificates')} className="text-sm font-medium text-teal-600 hover:underline">
              Soumettre un certificat →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {certs.slice(0, 5).map((c: any) => {
              const st = statusLabel[c.dsaStatus || c.healthCenterStatus] || { label: 'Inconnu', color: 'bg-gray-100 text-gray-600' };
              return (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.certificateFileName || 'Certificat'}</p>
                    <p className="text-xs text-gray-500">{c.submissionDate ? fmtDate(c.submissionDate) : '—'}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HC info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" /> Health Center — Infos pratiques
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-800">Horaires</p>
              <p>Lun–Ven : 08h30 – 17h00</p>
              <p className="text-xs text-gray-400">Urgences 24h/24 sur le campus</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-800">Localisation</p>
              <p>Bâtiment principal, rez-de-chaussée</p>
              <p className="text-xs text-gray-400">Al Akhawayn University, Ifrane</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-800">Contact</p>
              <p>Ext. 2000 (interne)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   DSA dashboard
══════════════════════════════════════════════════════ */
const DSADashboard = () => {
  const navigate = useNavigate();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/consultations/certificates/pending-dsa`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setCerts(Array.isArray(d) ? d : []))
      .catch(() => setCerts([]))
      .finally(() => setLoading(false));
  }, []);

  const pendingDSA = certs.filter(c => !c.dsaStatus);
  const processed = certs.filter(c => c.dsaStatus);
  const approved = certs.filter(c => c.dsaStatus === 'APPROVED_DSA');
  const rejected = certs.filter(c => c.dsaStatus === 'REJECTED_DSA');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="w-6 h-6" />
          <h2 className="text-lg font-semibold">Tableau de bord DSA</h2>
        </div>
        <p className="text-orange-100 text-sm">Traitement des appels médicaux d'absence — Dean of Student Affairs</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="En attente DSA" value={pendingDSA.length} icon={Clock} color={pendingDSA.length > 0 ? 'bg-amber-500' : 'bg-gray-400'} />
        <Stat label="Traités" value={processed.length} icon={CheckCircle2} color="bg-blue-500" />
        <Stat label="Approuvés" value={approved.length} icon={CheckCircle2} color="bg-green-500" />
        <Stat label="Refusés" value={rejected.length} icon={AlertTriangle} color="bg-red-400" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">
            Dossiers en attente de traitement DSA
            {pendingDSA.length > 0 && (
              <span className="ml-2 bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">{pendingDSA.length}</span>
            )}
          </h3>
          <button onClick={() => navigate('/dsa-certificates')} className="text-xs text-orange-600 hover:underline flex items-center gap-1">
            Voir tout <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">Chargement…</div>
        ) : pendingDSA.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucun dossier en attente. Tout est traité.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingDSA.slice(0, 5).map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.studentName || c.studentEmail}</p>
                  <p className="text-xs text-gray-500">
                    HC approuvé · {c.medicalType || '—'} · {c.healthCenterReviewDate ? fmtDate(c.healthCenterReviewDate) : '—'}
                  </p>
                </div>
                <button onClick={() => navigate('/dsa-certificates')} className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium">
                  Traiter
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Loading spinner ── */
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
    <Loader2 className="w-5 h-5 animate-spin" />
    <span className="text-sm">Chargement…</span>
  </div>
);

/* ══════════════════════════════════════════════════════
   Main Dashboard — routes to the right sub-dashboard
══════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { user, effectiveRole } = useAuth();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const roleLabel: Record<string, string> = {
    [UserRole.ADMIN]:       'Administrateur',
    [UserRole.SUPER_ADMIN]: 'Supervision',
    [UserRole.MEDECIN]:     'Médecin',
    [UserRole.INFIRMIER]:   'Infirmier(e)',
    [UserRole.STUDENT]:     'Étudiant(e)',
    [UserRole.DSA]:         'DSA',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {user?.prenom || 'utilisateur'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {effectiveRole ? roleLabel[effectiveRole] : ''} · AUI Health Center
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Role-specific content */}
      {(effectiveRole === UserRole.ADMIN || effectiveRole === UserRole.SUPER_ADMIN) && <AdminDashboard />}
      {effectiveRole === UserRole.MEDECIN && <MedecinDashboard user={user} />}
      {effectiveRole === UserRole.INFIRMIER && <InfirmierDashboard />}
      {effectiveRole === UserRole.STUDENT && <StudentDashboard user={user} />}
      {effectiveRole === UserRole.DSA && <DSADashboard />}
    </div>
  );
};

export default Dashboard;
