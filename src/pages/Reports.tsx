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
  materialsByCategory: Array<{ category: string; count: number }>;
  recentConsultations: Array<any>;
}

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
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
      ...stats.materialsByCategory.map(c => [c.category, c.count])
    ].map(row => row.join(',')).join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-green-600" />
            Rapports & Statistiques
          </h1>
          <p className="text-gray-600 mt-1">Analyse complète des opérations du centre de santé</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white font-medium"
          >
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleExportReport}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all flex items-center space-x-2 shadow-md hover:shadow-lg font-medium"
          >
            <Download className="w-5 h-5" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Patients</p>
              <p className="text-4xl font-bold mt-2">{stats.totalPatients}</p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Consultations</p>
              <p className="text-4xl font-bold mt-2">{stats.totalConsultations}</p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">
              {growthPercentage}% vs mois dernier
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Matériels</p>
              <p className="text-4xl font-bold mt-2">{stats.totalMaterials}</p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Package className="w-8 h-8" />
            </div>
          </div>
          <p className="text-purple-100 text-sm mt-3">
            {stats.materialsAssigned} assignés
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Stock Faible</p>
              <p className="text-4xl font-bold mt-2">{stats.lowStockMaterials}</p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>
          <p className="text-orange-100 text-sm mt-3">
            Nécessite réapprovisionnement
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consultations Trend */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-600" />
              Évolution des Consultations
            </h3>
          </div>
          <div className="h-80">
            <Line data={consultationsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Materials by Category */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Matériels par Catégorie
            </h3>
          </div>
          <div className="h-80 flex items-center justify-center">
            <Doughnut 
              data={materialsChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right' as const
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Top Materials */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Matériels les Plus Utilisés
          </h3>
        </div>
        <div className="h-80">
          <Bar 
            data={topMaterialsChartData} 
            options={{
              ...chartOptions,
              indexAxis: 'y' as const
            }} 
          />
        </div>
      </div>

      {/* Recent Consultations Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Consultations Récentes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Patient</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Médecin</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Motif</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentConsultations.map((consultation, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(consultation.dateConsultation).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {consultation.patient?.prenom} {consultation.patient?.nom}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {consultation.personnel?.prenom} {consultation.personnel?.nom}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {consultation.motif}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
