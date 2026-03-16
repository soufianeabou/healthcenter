import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Package, 
  Users, 
  Stethoscope,
  AlertTriangle,
  Activity,
  Calendar,
  FileText
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TIME_SLOTS = [
  { id: 'matin', label: '08:30 – 13:30', min: 8 * 60 + 30, max: 13 * 60 + 30 },
  { id: 'apres-midi', label: '13:30 – 18:00', min: 13 * 60 + 30, max: 18 * 60 },
  { id: 'soir', label: '18:00 – 23:00', min: 18 * 60, max: 23 * 60 },
  { id: 'nuit', label: '23:00 – 08:30', min: 23 * 60, max: 24 * 60 + (8 * 60 + 30) }
] as const;

function getTimeSlot(dateConsultation: string): string {
  const d = new Date(dateConsultation);
  const totalMinutes = d.getHours() * 60 + d.getMinutes();
  for (const slot of TIME_SLOTS) {
    if (slot.id === 'nuit') {
      if (totalMinutes >= 23 * 60 || totalMinutes < 8 * 60 + 30) return slot.id;
    } else if (totalMinutes >= slot.min && totalMinutes < slot.max) return slot.id;
  }
  return 'nuit';
}

interface ReportStats {
  totalPatients: number;
  totalConsultations: number;
  totalMaterials: number;
  lowStockMaterials: number;
  consultationsThisMonth: number;
  consultationsLastMonth: number;
  materialsAssigned: number;
  topMaterials: Array<{ name: string; count: number; category: string }>;
  consultationsByDay: Array<{ date: string; count: number }>;
  consultationsByMonth: Array<{ month: string; count: number }>;
  consultationsByDiagnostic: Array<{ diagnostic: string; count: number }>;
  consultationsByTimeSlot: Array<{ slotId: string; label: string; count: number }>;
  materialsByCategory: Array<{ category: string; count: number }>;
  recentConsultations: Array<any>;
}

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [exportToast, setExportToast] = useState(false);
  const [stats, setStats] = useState<ReportStats>({
    totalPatients: 0,
    totalConsultations: 0,
    totalMaterials: 0,
    lowStockMaterials: 0,
    consultationsThisMonth: 0,
    consultationsLastMonth: 0,
    materialsAssigned: 0,
    topMaterials: [],
    consultationsByDay: [],
    consultationsByMonth: [],
    consultationsByDiagnostic: [],
    consultationsByTimeSlot: [],
    materialsByCategory: [],
    recentConsultations: []
  });

  const periods = [
    { id: 'today', label: 'Aujourd\'hui' },
    { id: 'thisWeek', label: 'Cette semaine' },
    { id: 'thisMonth', label: 'Ce mois' },
    { id: 'last3Months', label: '3 derniers mois' },
    { id: 'thisYear', label: 'Cette année' }
  ];

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [patientsRes, consultationsRes, materialsRes] = await Promise.all([
        fetch('https://hc.aui.ma/api/patients'),
        fetch('https://hc.aui.ma/api/consultations'),
        fetch('https://hc.aui.ma/api/consultations/materials')
      ]);

      const patients = patientsRes.ok ? await patientsRes.json() : [];
      const consultations = consultationsRes.ok ? await consultationsRes.json() : [];
      const materials = materialsRes.ok ? await materialsRes.json() : [];

      // Process data
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Filter consultations by period
      const filteredConsultations = consultations.filter((c: any) => {
        const date = new Date(c.dateConsultation);
        switch (selectedPeriod) {
          case 'today':
            return date.toDateString() === now.toDateString();
          case 'thisWeek':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return date >= weekAgo;
          case 'thisMonth':
            return date >= startOfMonth;
          case 'last3Months':
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            return date >= threeMonthsAgo;
          case 'thisYear':
            return date.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });

      // Count consultations this month and last month
      const consultationsThisMonth = consultations.filter((c: any) => 
        new Date(c.dateConsultation) >= startOfMonth
      ).length;

      const consultationsLastMonth = consultations.filter((c: any) => {
        const date = new Date(c.dateConsultation);
        return date >= startOfLastMonth && date <= endOfLastMonth;
      }).length;

      // Count low stock materials (below minThreshold)
      const lowStockMaterials = materials.filter((m: any) => 
        m.quantity <= m.minThreshold
      ).length;

      // Group consultations by day for chart
      const consultationsByDay = getConsultationsByDay(filteredConsultations, selectedPeriod);

      // By month (for filtered set)
      const monthCount: { [key: string]: number } = {};
      filteredConsultations.forEach((c: any) => {
        const d = new Date(c.dateConsultation);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthCount[key] = (monthCount[key] || 0) + 1;
      });
      const consultationsByMonth = Object.entries(monthCount)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));

      // By diagnostic (normalize: first line or first 60 chars for grouping)
      const diagnosticCount: { [key: string]: number } = {};
      filteredConsultations.forEach((c: any) => {
        const raw = (c.diagnostic || c.motif || 'Non renseigné').trim();
        const key = raw.split('\n')[0].slice(0, 80) || 'Non renseigné';
        diagnosticCount[key] = (diagnosticCount[key] || 0) + 1;
      });
      const consultationsByDiagnostic = Object.entries(diagnosticCount)
        .map(([diagnostic, count]) => ({ diagnostic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      // By time slot
      const slotCount: { [key: string]: number } = { matin: 0, 'apres-midi': 0, soir: 0, nuit: 0 };
      filteredConsultations.forEach((c: any) => {
        const slot = getTimeSlot(c.dateConsultation);
        slotCount[slot] = (slotCount[slot] || 0) + 1;
      });
      const consultationsByTimeSlot = TIME_SLOTS.map(s => ({
        slotId: s.id,
        label: s.label,
        count: slotCount[s.id] || 0
      }));

      // Group materials by category
      const categoryCount: { [key: string]: number } = {};
      materials.forEach((m: any) => {
        categoryCount[m.category] = (categoryCount[m.category] || 0) + 1;
      });
      const materialsByCategory = Object.entries(categoryCount).map(([category, count]) => ({
        category,
        count: count as number
      }));

      // Get top materials (most used in consultations - we'll simulate this)
      const materialUsage: { [key: string]: any } = {};
      materials.forEach((m: any) => {
        materialUsage[m.id] = {
          name: m.name,
          category: m.category,
          count: Math.max(0, m.minThreshold - m.quantity) // Approximate usage
        };
      });
      const topMaterials = Object.values(materialUsage)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalPatients: patients.length,
        totalConsultations: filteredConsultations.length,
        totalMaterials: materials.length,
        lowStockMaterials,
        consultationsThisMonth,
        consultationsLastMonth,
        materialsAssigned: materials.reduce((sum: number, m: any) => 
          sum + Math.max(0, m.minThreshold - m.quantity), 0
        ),
        topMaterials,
        consultationsByDay,
        consultationsByMonth,
        consultationsByDiagnostic,
        consultationsByTimeSlot,
        materialsByCategory,
        recentConsultations: filteredConsultations.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConsultationsByDay = (consultations: any[], period: string) => {
    const dayCount: { [key: string]: number } = {};
    const now = new Date();
    
    consultations.forEach((c: any) => {
      const date = new Date(c.dateConsultation);
      const dateKey = date.toISOString().split('T')[0];
      dayCount[dateKey] = (dayCount[dateKey] || 0) + 1;
    });

    // Generate labels based on period
    let days: string[] = [];
    if (period === 'thisWeek' || period === 'today') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
      }
    } else if (period === 'thisMonth') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        days.push(d.toISOString().split('T')[0]);
      }
    } else {
      days = Object.keys(dayCount).sort();
    }

    return days.map(date => ({
      date,
      count: dayCount[date] || 0
    }));
  };

  const handleExportReport = () => {
    // Create CSV content
    const csvContent = [
      ['AUI Health Center - Rapport Statistique'],
      ['Période', periods.find(p => p.id === selectedPeriod)?.label || ''],
      ['Date de génération', new Date().toLocaleString('fr-FR')],
      [''],
      ['=== STATISTIQUES GÉNÉRALES ==='],
      ['Total Patients', stats.totalPatients],
      ['Total Consultations', stats.totalConsultations],
      ['Consultations ce mois', stats.consultationsThisMonth],
      ['Consultations mois dernier', stats.consultationsLastMonth],
      ['Total Matériels', stats.totalMaterials],
      ['Matériels en stock faible', stats.lowStockMaterials],
      ['Matériels assignés', stats.materialsAssigned],
      [''],
      ['=== MATÉRIELS LES PLUS UTILISÉS ==='],
      ['Nom', 'Catégorie', 'Utilisation'],
      ...stats.topMaterials.map(m => [m.name, m.category, m.count]),
      [''],
      ['=== MATÉRIELS PAR CATÉGORIE ==='],
      ['Catégorie', 'Nombre'],
      ...stats.materialsByCategory.map(c => [c.category, c.count]),
      [''],
      ['=== CONSULTATIONS PAR CRÉNEAU HORAIRE ==='],
      ['Créneau', 'Nombre'],
      ...stats.consultationsByTimeSlot.map(s => [s.label, s.count]),
      [''],
      ['=== TOP DIAGNOSTICS ==='],
      ['Diagnostic', 'Nombre'],
      ...stats.consultationsByDiagnostic.map(d => [d.diagnostic.replace(/,/g, ';'), d.count])
    ].map(row => row.join(',')).join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  };

  const growthPercentage = stats.consultationsLastMonth > 0
    ? ((stats.consultationsThisMonth - stats.consultationsLastMonth) / stats.consultationsLastMonth * 100).toFixed(1)
    : '0';

  // Chart configurations
  const consultationsChartData = {
    labels: stats.consultationsByDay.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }),
    datasets: [
      {
        label: 'Consultations',
        data: stats.consultationsByDay.map(d => d.count),
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const materialsChartData = {
    labels: stats.materialsByCategory.map(c => c.category),
    datasets: [
      {
        label: 'Matériels',
        data: stats.materialsByCategory.map(c => c.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(14, 165, 233, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ]
      }
    ]
  };

  const topMaterialsChartData = {
    labels: stats.topMaterials.map(m => m.name),
    datasets: [
      {
        label: 'Utilisation',
        data: stats.topMaterials.map(m => m.count),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }
    ]
  };

  const timeSlotChartData = {
    labels: stats.consultationsByTimeSlot.map(s => s.label),
    datasets: [
      {
        label: 'Consultations',
        data: stats.consultationsByTimeSlot.map(s => s.count),
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(251, 146, 60, 0.8)', 'rgba(168, 85, 247, 0.8)'],
        borderColor: ['rgb(59, 130, 246)', 'rgb(34, 197, 94)', 'rgb(251, 146, 60)', 'rgb(168, 85, 247)'],
        borderWidth: 1
      }
    ]
  };

  const diagnosticChartData = {
    labels: stats.consultationsByDiagnostic.slice(0, 8).map(d => d.diagnostic.length > 40 ? d.diagnostic.slice(0, 40) + '…' : d.diagnostic),
    datasets: [
      {
        label: 'Nombre',
        data: stats.consultationsByDiagnostic.slice(0, 8).map(d => d.count),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Export toast */}
      {exportToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <Download className="w-4 h-4" />
          Rapport exporté avec succès
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-green-600" />
            Rapports &amp; Statistiques
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble des opérations du centre de santé</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm font-medium"
          >
            {periods.map((period) => (
              <option key={period.id} value={period.id}>{period.label}</option>
            ))}
          </select>
          <button
            onClick={handleExportReport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Patients</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.totalPatients}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Consultations</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.totalConsultations}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              {growthPercentage}% vs mois dernier
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Matériels</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.totalMaterials}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stats.materialsAssigned} assignés</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-red-50 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stock Faible</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.lowStockMaterials}</p>
            <p className="text-xs text-red-400 mt-0.5">Réapprovisionnement requis</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-green-600" />
            Évolution des consultations
          </h3>
          <div className="h-72">
            <Line data={consultationsChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-blue-600" />
            Matériels par catégorie
          </h3>
          <div className="h-72 flex items-center justify-center">
            <Doughnut
              data={materialsChartData}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' as const } } }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-green-600" />
          Matériels les plus utilisés
        </h3>
        <div className="h-72">
          <Bar data={topMaterialsChartData} options={{ ...chartOptions, indexAxis: 'y' as const }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-blue-600" />
            Consultations par créneau horaire
          </h3>
          <div className="h-60">
            <Bar data={timeSlotChartData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-green-600" />
            Top diagnostics
          </h3>
          <div className="h-60">
            <Bar data={diagnosticChartData} options={{ ...chartOptions, indexAxis: 'y' as const }} />
          </div>
        </div>
      </div>

      {stats.consultationsByMonth.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-purple-600" />
            Consultations par mois
          </h3>
          <div className="h-60">
            <Bar
              data={{ labels: stats.consultationsByMonth.map(m => m.month), datasets: [{ label: 'Consultations', data: stats.consultationsByMonth.map(m => m.count), backgroundColor: 'rgba(99,102,241,0.70)', borderColor: 'rgb(99,102,241)', borderWidth: 1 }] }}
              options={chartOptions}
            />
          </div>
        </div>
      )}

      {/* Recent Consultations */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-700">Consultations récentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Médecin</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentConsultations.map((consultation, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-5 text-gray-500 whitespace-nowrap">
                    {new Date(consultation.dateConsultation).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-5 font-medium text-gray-900">
                    {consultation.patient?.prenom} {consultation.patient?.nom}
                  </td>
                  <td className="py-3 px-5 text-gray-600">
                    {consultation.personnel?.prenom} {consultation.personnel?.nom}
                  </td>
                  <td className="py-3 px-5 text-gray-600 max-w-xs truncate">
                    {consultation.motif}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.recentConsultations.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-400">Aucune consultation pour cette période</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
