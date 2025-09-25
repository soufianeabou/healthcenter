import React, { useState } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, Package, Users } from 'lucide-react';
import StockChart from '../components/StockChart';
import PrescriptionChart from '../components/PrescriptionChart';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedReport, setSelectedReport] = useState('overview');

  const reportTypes = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'stock', label: 'Stock Movement', icon: Package },
    { id: 'prescriptions', label: 'Prescriptions', icon: Users },
    { id: 'trends', label: 'Trends Analysis', icon: TrendingUp }
  ];

  const periods = [
    { id: 'today', label: 'Today' },
    { id: 'thisWeek', label: 'This Week' },
    { id: 'thisMonth', label: 'This Month' },
    { id: 'thisQuarter', label: 'This Quarter' },
    { id: 'thisYear', label: 'This Year' }
  ];

  const mockStats = {
    totalMedicines: 247,
    totalPrescriptions: 156,
    lowStockItems: 8,
    expiringItems: 5,
    topMedicines: [
      { name: 'Paracetamol 500mg', dispensed: 45 },
      { name: 'Ibuprofen 400mg', dispensed: 32 },
      { name: 'Amoxicillin 250mg', dispensed: 28 },
      { name: 'Aspirin 325mg', dispensed: 22 },
      { name: 'Omeprazole 20mg', dispensed: 18 }
    ]
  };

  const handleExportReport = () => {
    // This would integrate with your backend to generate reports
    alert('Report export functionality would be implemented here');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive pharmacy operation insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleExportReport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Medicines</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{mockStats.totalMedicines}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">+5.2% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Prescriptions</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{mockStats.totalPrescriptions}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">+8.7% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{mockStats.lowStockItems}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-red-600 mt-2">+2 from last week</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{mockStats.expiringItems}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-red-600 mt-2">3 expire this month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Types</h3>
          <div className="space-y-2">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedReport(type.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  selectedReport === type.id
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <type.icon className="w-5 h-5" />
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {selectedReport === 'overview' && (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Movement Overview</h3>
                <StockChart />
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Prescription Trends</h3>
                <PrescriptionChart />
              </div>
            </>
          )}

          {selectedReport === 'stock' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Movement Analysis</h3>
              <StockChart />
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Top Stock Entries</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Paracetamol 500mg', quantity: 200 },
                      { name: 'Ibuprofen 400mg', quantity: 150 },
                      { name: 'Amoxicillin 250mg', quantity: 100 }
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="text-green-600">+{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Top Stock Exits</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Paracetamol 500mg', quantity: 85 },
                      { name: 'Aspirin 325mg', quantity: 45 },
                      { name: 'Ibuprofen 400mg', quantity: 32 }
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="text-red-600">-{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'prescriptions' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Prescription Analysis</h3>
              <PrescriptionChart />
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-3">Most Prescribed Medicines</h4>
                <div className="space-y-3">
                  {mockStats.topMedicines.map((medicine, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-gray-900">{medicine.name}</span>
                      </div>
                      <span className="text-green-600 font-medium">{medicine.dispensed} prescriptions</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'trends' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Trends Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Growth Trends</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Student Visits</span>
                      <span className="text-green-600 font-medium">+15.3%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Medicine Dispensed</span>
                      <span className="text-green-600 font-medium">+8.7%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Stock Turnover</span>
                      <span className="text-blue-600 font-medium">+12.1%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Seasonal Patterns</h4>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-gray-600">Peak Season:</span>
                      <span className="ml-2 text-gray-900">Winter months (Dec-Feb)</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Common Conditions:</span>
                      <span className="ml-2 text-gray-900">Flu, Cold, Allergies</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Low Season:</span>
                      <span className="ml-2 text-gray-900">Summer break (Jun-Aug)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;