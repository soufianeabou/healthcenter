import React, { useState } from 'react';
import { User, Phone, Mail, AlertTriangle, FileText, Calendar } from 'lucide-react';

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

interface PrescriptionReviewProps {
  request: PrescriptionRequest;
  onReview: (requestId: string, decision: 'APPROVED' | 'REJECTED', notes: string) => void;
  onCancel: () => void;
}

const PrescriptionReview: React.FC<PrescriptionReviewProps> = ({ request, onReview, onCancel }) => {
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (decision) {
      onReview(request.id, decision, notes);
    }
  };

  const isAlreadyReviewed = request.status !== 'PENDING';

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Student Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Name:</span>
            <span>{request.studentName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">ID:</span>
            <span>{request.studentId}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Email:</span>
            <span>{request.email}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Phone:</span>
            <span>{request.phone}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Medical Information</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-700">Requested Medicine:</span>
            <p className="text-gray-900 mt-1">{request.requestedMedicine}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Symptoms:</span>
            <p className="text-gray-900 mt-1">{request.symptoms}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-700">Allergies:</span>
              <p className={`mt-1 ${request.allergies !== 'None' ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                {request.allergies !== 'None' && <AlertTriangle className="w-4 h-4 inline mr-1" />}
                {request.allergies}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Medical Conditions:</span>
              <p className="text-gray-900 mt-1">{request.conditions}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">Submission Details</span>
        </div>
        <div className="text-sm text-gray-600">
          <p>Submitted: {new Date(request.submittedAt).toLocaleString()}</p>
          {request.doctorNote && (
            <div className="flex items-center space-x-2 mt-2">
              <FileText className="w-4 h-4" />
              <span>Doctor's note attached</span>
            </div>
          )}
        </div>
      </div>

      {isAlreadyReviewed ? (
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Review Status</h3>
          <div className="text-sm space-y-2">
            <p><span className="font-medium">Status:</span> {request.status}</p>
            {request.reviewedBy && (
              <p><span className="font-medium">Reviewed by:</span> {request.reviewedBy}</p>
            )}
            {request.reviewedAt && (
              <p><span className="font-medium">Reviewed on:</span> {new Date(request.reviewedAt).toLocaleString()}</p>
            )}
            {request.notes && (
              <div>
                <span className="font-medium">Notes:</span>
                <p className="text-gray-700 mt-1">{request.notes}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('APPROVED')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  decision === 'APPROVED'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                Approve Request
              </button>
              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  decision === 'REJECTED'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                Reject Request
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical Notes {decision && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder={
                decision === 'APPROVED' 
                  ? 'Enter dosage instructions, duration, and any precautions...'
                  : decision === 'REJECTED'
                  ? 'Explain the reason for rejection and suggest alternatives...'
                  : 'Enter your medical notes and recommendations...'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required={decision !== null}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!decision || !notes.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Review
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PrescriptionReview;