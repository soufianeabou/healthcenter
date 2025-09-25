import React from 'react';
import { 
  Package, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Stethoscope,
  UserCog
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/roles';

const Dashboard = () => {
  const { user, isAdmin, isMedecin, isInfirmier } = useAuth();
  
  const isAdminUser = isAdmin();
  const isMedicalStaff = isMedecin() || isInfirmier();

  const adminStats = [
    {
      title: 'Total Medicines',
      value: '247',
      icon: Package,
      color: 'bg-blue-500',
      trend: '+5.2%'
    },
    {
      title: 'Pending Requests',
      value: '12',
      icon: Clock,
      color: 'bg-yellow-500',
      trend: '+2.1%'
    },
    {
      title: 'Low Stock Alerts',
      value: '8',
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: '-1.3%'
    },
    {
      title: 'Students Served',
      value: '156',
      icon: Users,
      color: 'bg-green-500',
      trend: '+8.7%'
    }
  ];

  const medicalStats = [
    {
      title: 'Today\'s Consultations',
      value: '8',
      icon: Stethoscope,
      color: 'bg-blue-500',
      trend: '+2'
    },
    {
      title: 'Pending Prescriptions',
      value: '5',
      icon: Clock,
      color: 'bg-yellow-500',
      trend: '+1'
    },
    {
      title: 'Patients Seen',
      value: '12',
      icon: Users,
      color: 'bg-green-500',
      trend: '+3'
    },
    {
      title: 'Stock Available',
      value: '89%',
      icon: Package,
      color: 'bg-purple-500',
      trend: '+2.1%'
    }
  ];

  const stats = isAdminUser ? adminStats : medicalStats;

  const recentActivities = isAdminUser ? [
    {
      id: 1,
      action: 'New prescription request from Sara Amrani',
      time: '5 minutes ago',
      status: 'pending'
    },
    {
      id: 2,
      action: 'Stock updated for Paracetamol 500mg',
      time: '1 hour ago',
      status: 'completed'
    },
    {
      id: 3,
      action: 'Low stock alert for Ibuprofen 400mg',
      time: '2 hours ago',
      status: 'warning'
    },
    {
      id: 4,
      action: 'New supplier "PharmaCorp" added',
      time: '3 hours ago',
      status: 'completed'
    }
  ] : [
    {
      id: 1,
      action: 'Prescription request submitted',
      time: '2 hours ago',
      status: 'pending'
    },
    {
      id: 2,
      action: 'Prescription #PR001 approved',
      time: '1 day ago',
      status: 'approved'
    },
    {
      id: 3,
      action: 'Medicine collected from pharmacy',
      time: '2 days ago',
      status: 'completed'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isAdminUser ? 'Admin Dashboard' : 'Medical Dashboard'}
          </h1>
          <p className="text-gray-600">
            {isAdminUser 
              ? 'Overview of pharmacy operations and system status'
              : 'Track your prescription requests and health records'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'pending' ? 'bg-yellow-500' :
                  activity.status === 'approved' || activity.status === 'completed' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAdminUser && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors">
                <Package className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-sm font-medium text-gray-700">Add Medicine</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors">
                <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-sm font-medium text-gray-700">Update Stock</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors">
                <Users className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-sm font-medium text-gray-700">View Requests</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors">
                <AlertTriangle className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-sm font-medium text-gray-700">Check Alerts</p>
              </button>
            </div>
          </div>
        )}

        {!isAdminUser && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors">
                <Stethoscope className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-sm font-medium text-gray-700">New Consultation</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors">
                <Package className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-sm font-medium text-gray-700">View Medicines</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors">
                <Users className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-sm font-medium text-gray-700">Patient Records</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors">
                <Clock className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-sm font-medium text-gray-700">Pending Requests</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;