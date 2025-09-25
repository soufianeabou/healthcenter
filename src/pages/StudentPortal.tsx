import React, { useState } from 'react';
import { Plus, Upload, Clock, CheckCircle, XCircle, FileText, User, Calendar, AlertCircle, Download } from 'lucide-react';
import Modal from '../components/Modal';
import PrescriptionForm from '../components/PrescriptionForm';
import { useAuth } from '../context/AuthContext';

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
  doctorNote?: File;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
}

const StudentPortal = () => {
  const { user } = useAuth();
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
      symptoms: 'Severe headache and fever for 3 days',
      status: 'APPROVED',
      submittedAt: '2024-01-15T10:30:00Z',
      reviewedAt: '2024-01-15T14:20:00Z',
      reviewedBy: 'Dr. Fatima Alaoui',
      notes: 'Approved for 7 days treatment. Take with food.',
      urgency: 'MEDIUM'
    },
    {
      id: '2',
      studentId: 'STU001',
      studentName: 'Omar Benali',
      email: 'omar.benali@aui.ma',
      phone: '+212 6 12 34 56 78',
      allergies: 'Penicillin',
      conditions: 'None',
      requestedMedicine: 'Ibuprofen 400mg',
      symptoms: 'Back pain after sports activity',
      status: 'PENDING',
      submittedAt: '2024-01-20T09:15:00Z',
      urgency: 'LOW'
    },
    {
      id: '3',
      studentId: 'STU001',
      studentName: 'Omar Benali',
      email: 'omar.benali@aui.ma',
      phone: '+212 6 12 34 56 78',
      allergies: 'Penicillin',
      conditions: 'None',
      requestedMedicine: 'Aspirin 325mg',
      symptoms: 'Muscle pain',
      status: 'REJECTED',
      submittedAt: '2024-01-18T11:20:00Z',
      reviewedAt: '2024-01-18T13:10:00Z',
      reviewedBy: 'Dr. Ahmed Bennani',
      notes: 'Patient is allergic to aspirin. Please visit health center for alternative.',
      urgency: 'LOW'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const handleNewRequest = (requestData: Omit<PrescriptionRequest, 'id' | 'status' | 'submittedAt'>) => {
    const newRequest: PrescriptionRequest = {
      ...requestData,
      id: Date.now().toString(),
      status: 'PENDING',
      submittedAt: new Date().toISOString()
    };
    setRequests([newRequest, ...requests]);
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            Pending Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4 mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors = {
      LOW: 'bg-blue-100 text-blue-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[urgency as keyof typeof colors]}`}>
        {urgency}
      </span>
    );
  };

  const filteredRequests = requests.filter(request => 
    selectedFilter === 'ALL' || request.status === selectedFilter
  );

  const getStatusCounts = () => {
    const pending = requests.filter(r => r.status === 'PENDING').length;
    const approved = requests.filter(r => r.status === 'APPROVED').length;
    const rejected = requests.filter(r => r.status === 'REJECTED').length;
    return { pending, approved, rejected, total: requests.length };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Student Health Portal</h1>
            <p className="text-green-100 text-lg">
              Welcome back, {user?.name}! Manage your prescription requests and track your health records.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{statusCounts.total}</div>
              <div className="text-sm text-green-100">Total Requests</div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors flex items-center space-x-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>New Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{statusCounts.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Awaiting review</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{statusCounts.approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Ready for pickup</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{statusCounts.rejected}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Requires attention</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{statusCounts.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">All time</p>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Important Health Center Information</h3>
            <div className="text-blue-700 space-y-2">
              <p>• All prescription requests are reviewed within 24 hours during business days</p>
              <p>• For urgent medical needs, please visit the health center directly or call emergency services</p>
              <p>• Approved prescriptions can be collected from the health center pharmacy during operating hours</p>
              <p>• Please ensure you have a valid doctor's prescription or medical recommendation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">My Prescription Requests</h2>
          <div className="flex items-center space-x-3">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as typeof selectedFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">All Requests</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.requestedMedicine}
                    </h3>
                    {getStatusBadge(request.status)}
                    {getUrgencyBadge(request.urgency)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span><strong>Student ID:</strong> {request.studentId}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span><strong>Submitted:</strong> {new Date(request.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <strong>Symptoms:</strong> {request.symptoms}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <strong>Allergies:</strong> 
                        <span className={request.allergies !== 'None' ? 'text-red-600 font-medium ml-1' : 'ml-1'}>
                          {request.allergies !== 'None' && <AlertCircle className="w-4 h-4 inline mr-1" />}
                          {request.allergies}
                        </span>
                      </div>
                      <div>
                        <strong>Medical Conditions:</strong> {request.conditions}
                      </div>
                      {request.reviewedAt && (
                        <div>
                          <strong>Reviewed:</strong> {new Date(request.reviewedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {request.notes && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <FileText className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Medical Notes from {request.reviewedBy}:</p>
                          <p className="text-sm text-gray-600 mt-1">{request.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {request.doctorNote && (
                    <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>Doctor's note attached</span>
                      <button className="text-green-600 hover:text-green-700 flex items-center space-x-1">
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons for approved prescriptions */}
              {request.status === 'APPROVED' && (
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ready for Pickup</span>
                  </button>
                </div>
              )}

              {/* Action buttons for rejected prescriptions */}
              {request.status === 'REJECTED' && (
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Submit New Request</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedFilter === 'ALL' ? 'No requests yet' : `No ${selectedFilter.toLowerCase()} requests`}
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedFilter === 'ALL' 
                  ? 'Submit your first prescription request to get started.'
                  : `You don't have any ${selectedFilter.toLowerCase()} requests at the moment.`
                }
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Submit New Request</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center"
          >
            <Plus className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-700">New Prescription Request</p>
            <p className="text-sm text-gray-600">Submit a new prescription request</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-gray-700">Schedule Appointment</p>
            <p className="text-sm text-gray-600">Book a consultation</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
            <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="font-medium text-gray-700">Health Records</p>
            <p className="text-sm text-gray-600">View your medical history</p>
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Prescription Request"
      >
        <PrescriptionForm
          onSubmit={handleNewRequest}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default StudentPortal;