import React, { useEffect, useMemo, useState } from 'react';
import {
  Package,
  Users,
  AlertTriangle,
  Stethoscope,
  Calendar,
  BarChart3,
  Truck,
  Loader2,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import { useAuth } from '../context/AuthContext';
import { Medicine } from '../types/medicine';

const API_BASE = 'https://hc.aui.ma';

interface ConsultationApi {
  id: number;
  dateConsultation?: string;
  patient?: { prenom?: string; nom?: string; idNum?: number };
  motif?: string;
}

interface MaterialApi {
  id: number;
  name?: string;
  quantity?: number;
  minThreshold?: number | null;
}

function formatRelativeFr(d: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) return d.toLocaleString('fr-FR');
  const diffM = Math.floor(diffMs / 60000);
  if (diffM < 1) return "À l'instant";
  if (diffM < 60) return `Il y a ${diffM} min`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Il y a ${diffD} j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function startOfToday(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

const Dashboard = () => {
  const { isAdmin, isMedecin, isInfirmier } = useAuth();
  const navigate = useNavigate();
  const isAdminUser = isAdmin();
  const isMedicalStaff = isMedecin() || isInfirmier();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [materials, setMaterials] = useState<MaterialApi[]>([]);
  const [consultations, setConsultations] = useState<ConsultationApi[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [medRes, matRes, consRes] = await Promise.all([
          fetch(`${API_BASE}/api/consultations/medicaments`),
          fetch(`${API_BASE}/api/consultations/materials`),
          fetch(`${API_BASE}/api/consultations`),
        ]);
        if (!medRes.ok) throw new Error('Médicaments indisponibles');
        if (!matRes.ok) throw new Error('Matériels indisponibles');
        if (!consRes.ok) throw new Error('Consultations indisponibles');
        const [medJson, matJson, consJson] = await Promise.all([
          medRes.json(),
          matRes.json(),
          consRes.json(),
        ]);
        if (cancelled) return;
        setMedicines(Array.isArray(medJson) ? medJson : []);
        setMaterials(Array.isArray(matJson) ? matJson : []);
        setConsultations(Array.isArray(consJson) ? consJson : []);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Erreur de chargement');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const lowStockMedicines = useMemo(
    () => medicines.filter((m) => m.qteStock <= m.qteMinimum),
    [medicines],
  );

  const lowStockMaterials = useMemo(
    () =>
      materials.filter((m) => {
        const q = m.quantity ?? 0;
        const min = m.minThreshold;
        if (min == null || min <= 0) return false;
        return q <= min;
      }),
    [materials],
  );

  const consultationsToday = useMemo(() => {
    const todayStart = startOfToday();
    return consultations.filter((c) => {
      if (!c.dateConsultation) return false;
      const d = new Date(c.dateConsultation);
      return !Number.isNaN(d.getTime()) && d >= todayStart;
    });
  }, [consultations]);

  const distinctPatientsToday = useMemo(() => {
    const ids = new Set<number>();
    for (const c of consultationsToday) {
      const n = c.patient?.idNum;
      if (n != null) ids.add(Number(n));
    }
    return ids.size;
  }, [consultationsToday]);

  const recentActivities = useMemo(() => {
    const items: { id: string; action: string; time: string; status: string }[] = [];

    const sorted = [...consultations]
      .filter((c) => c.dateConsultation)
      .sort(
        (a, b) =>
          new Date(b.dateConsultation!).getTime() - new Date(a.dateConsultation!).getTime(),
      )
      .slice(0, 4);

    for (const c of sorted) {
      const pname = c.patient
        ? `${c.patient.prenom || ''} ${c.patient.nom || ''}`.trim() || 'Patient'
        : 'Patient';
      const dt = new Date(c.dateConsultation!);
      items.push({
        id: `c-${c.id}`,
        action: `Consultation — ${pname}`,
        time: formatRelativeFr(dt),
        status: 'completed',
      });
    }

    for (const m of lowStockMedicines.slice(0, 3)) {
      items.push({
        id: `med-${m.id}`,
        action: `Stock faible médicament : ${m.nomMedicament}`,
        time: 'À traiter',
        status: 'warning',
      });
    }

    for (const m of lowStockMaterials.slice(0, 2)) {
      items.push({
        id: `mat-${m.id}`,
        action: `Stock faible matériel : ${m.name || 'Sans nom'}`,
        time: 'À traiter',
        status: 'warning',
      });
    }

    return items.slice(0, 8);
  }, [consultations, lowStockMedicines, lowStockMaterials]);

  const adminStats = [
    {
      title: 'Médicaments référencés',
      value: String(medicines.length),
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      title: 'Alertes stock médicaments',
      value: String(lowStockMedicines.length),
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'Alertes stock matériels',
      value: String(lowStockMaterials.length),
      icon: Layers,
      color: 'bg-amber-500',
    },
    {
      title: 'Consultations enregistrées',
      value: String(consultations.length),
      icon: Stethoscope,
      color: 'bg-green-600',
    },
  ];

  const medicalStats = [
    {
      title: "Consultations aujourd'hui",
      value: String(consultationsToday.length),
      icon: Stethoscope,
      color: 'bg-blue-500',
    },
    {
      title: 'Patients vus (aujourd’hui)',
      value: String(distinctPatientsToday),
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Alertes stock médicaments',
      value: String(lowStockMedicines.length),
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'Références matériels',
      value: String(materials.length),
      icon: Package,
      color: 'bg-purple-500',
    },
  ];

  const stats = isAdminUser ? adminStats : medicalStats;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isAdminUser ? 'Tableau de bord' : 'Tableau de bord médical'}
          </h1>
          <p className="text-gray-600 text-sm mt-0.5">
            {isAdminUser
              ? 'Indicateurs issus des APIs (médicaments, matériels, consultations).'
              : 'Vue opérationnelle basée sur les données du centre.'}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {loadError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
          {loadError} — vérifiez la connexion et le proxy API.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Chargement des indicateurs…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Activité récente</h3>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune activité récente à afficher.</p>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          activity.status === 'warning' ? 'bg-red-500' : 'bg-green-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isAdminUser && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Accès rapide</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/medicines/manage')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-left"
                  >
                    <Package className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Gérer médicaments</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/materiels')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-left"
                  >
                    <BarChart3 className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Matériels & stock</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/consultations')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-left"
                  >
                    <Stethoscope className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Consultations</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/reports')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-left"
                  >
                    <AlertTriangle className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Rapports & synthèses</p>
                  </button>
                </div>
              </div>
            )}

            {!isAdminUser && isMedicalStaff && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Accès rapide</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/consultations')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-left"
                  >
                    <Stethoscope className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Consultations</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/medicines')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-left"
                  >
                    <Package className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Liste médicaments</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/patients')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-left"
                  >
                    <Users className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Patients</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/materiels-list')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-left"
                  >
                    <Truck className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Matériels</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
