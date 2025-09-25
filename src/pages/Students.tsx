import React, { useState } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import Modal from '../components/Modal';
import PrescriptionReview from '../components/PrescriptionReview';

interface PrescriptionRequest {
  id: string;
  studentId: string;
  studentName: string;
  email: string;
  phone: string;
  allergies: string;
  conditions: string;
  requestedMedicine: string;
  symptoms: string;
  doctorNote?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

const Students = () => {
  const [requests, setRequests] = useState<PrescriptionRequest[]>([
    {
      id: '1',
      studentId: 'STU001',
      studentName: 'Omar Benali',
      email: 'omar.benali@aui.ma',
      phone: '+212 6 12 34 56 78',
      allergies: 'Penicillin',
      conditions: 'None',
      requestedMedicine: 'Paracetamol 500mg',
      symptoms: 'Headache and fever for 2 days',
      status: 'PENDING',
      submittedAt: '2024-01-20T09:15:00Z'
    },
    {
      id: '2',
      studentId: 'STU002',
      studentName: 'Sara Amrani',
      email: 'sara.amrani@aui.ma',
      phone: '+212 6 98 76 54 32',
      allergies: 'None',
      conditions: 'Asthma',
      requestedMedicine: 'Ibuprofen 400mg',
      symptoms: 'Back pain after sports activity',
      status: 'APPROVED',
      submittedAt: '2024-01-19T14:30:00Z',
      reviewedAt: '2024-01-19T16:45:00Z',
      reviewedBy: 'Dr. Fatima Alaoui',
      notes: 'Approved for 5 days. Avoid with asthma medication.'
    },
    {
      id: '3',
      studentId: 'STU003',
      studentName: 'Youssef Idrissi',
      email: 'youssef.idrissi@aui.ma',
      phone: '+212 6 55 44 33 22',
      allergies: 'Aspirin',
      conditions: 'None',
      requestedMedicine: 'Aspirin 325mg',
      symptoms: 'Muscle pain',
      status: 'REJECTED',
      submittedAt: '2024-01-18T11:20:00Z',
      reviewedAt: '2024-01-18T13:10:00Z',
      reviewedBy: 'Dr. Ahmed Bennani',
      notes: 'Patient is allergic to aspirin. Alternative prescribed.'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<PrescriptionRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestedMedicine.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReviewRequest = (requestId: string, decision: 'APPROVED' | 'REJECTED', notes: string) => {
    setRequests(prev => prev.map(request => 
      request.id === requestId 
        ? {
            ...request,
            status: decision,
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Dr. Current User', // This would come from auth context
            notes
          }
        : request
    ));
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const openReviewModal = (request: PrescriptionRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusCounts = () => {
    const pending = requests.filter(r => r.status === 'PENDING').length;
    const approved = requests.filter(r => r.status === 'APPROVED').length;
    const rejected = requests.filter(r => r.status === 'REJECTED').length;
    return { pending, approved, rejected };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Student Prescription Requests</h1>
          <p className="text-gray-600">Review and manage student prescription requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{statusCounts.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved Today</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{statusCounts.approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{requests.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name, ID, or medicine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medicine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symptoms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.studentName}</div>
                      <div className="text-sm text-gray-500">{request.studentId}</div>
                      <div className="text-sm text-gray-500">{request.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{request.requestedMedicine}</div>
                    {request.allergies !== 'None' && (
                      <div className="text-sm text-red-600">⚠️ Allergies: {request.allergies}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{request.symptoms}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(request.submittedAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(request.submittedAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openReviewModal(request)}
                      className="text-green-600 hover:text-green-900 transition-colors flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRequest(null);
        }}
        title="Review Prescription Request"
      >
        {selectedRequest && (
          <PrescriptionReview
            request={selectedRequest}
            onReview={handleReviewRequest}
            onCancel={() => {
              setIsModalOpen(false);
              setSelectedRequest(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default Students;