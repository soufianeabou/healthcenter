import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Clock, CheckCircle, XCircle, Plus, Eye, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AbsenceCertificate } from '../types/certificate';

const API = 'https://hc.aui.ma/api/consultations/certificates';

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'PENDING_HC':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3" /> Pending Review
        </span>
      );
    case 'APPROVED_HC':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="w-3 h-3" /> HC Approved
        </span>
      );
    case 'REJECTED_HC':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" /> HC Rejected
        </span>
      );
    case 'APPROVED_DSA':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" /> DSA Approved
        </span>
      );
    case 'REJECTED_DSA':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" /> DSA Rejected
        </span>
      );
    default:
      return null;
  }
};

const StudentCertificates: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<AbsenceCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewCert, setViewCert] = useState<AbsenceCertificate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCertificates = async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/student/${encodeURIComponent(user.email)}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCertificates(Array.isArray(data) ? data : []);
    } catch {
      setError('Could not load your certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCertificates(); }, [user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !user) return;
    try {
      setSubmitting(true);
      setError('');
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('studentName', `${user.prenom} ${user.nom}`);
      form.append('studentEmail', user.email);
      const res = await fetch(API, { method: 'POST', body: form });
      if (!res.ok) throw new Error('Submission failed');
      setShowForm(false);
      setSelectedFile(null);
      await fetchCertificates();
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadFile = async (cert: AbsenceCertificate) => {
    try {
      const res = await fetch(`${API}/${cert.id}/file`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cert.certificateFileName || 'certificate';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not download file.');
    }
  };

  const counts = {
    pending: certificates.filter(c => c.healthCenterStatus === 'PENDING_HC').length,
    hcApproved: certificates.filter(c => c.healthCenterStatus === 'APPROVED_HC').length,
    dsaApproved: certificates.filter(c => c.dsaStatus === 'APPROVED').length,
    rejected: certificates.filter(c => c.healthCenterStatus === 'REJECTED_HC' || c.dsaStatus === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Medical Certificate Portal</h1>
            <p className="text-teal-100 mt-1">
              {user?.prenom} {user?.nom} — {user?.email}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-teal-700 px-5 py-2.5 rounded-lg hover:bg-teal-50 transition-colors font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Submit Certificate
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending Review', value: counts.pending, color: 'border-yellow-500 text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'HC Approved', value: counts.hcApproved, color: 'border-blue-500 text-blue-600', bg: 'bg-blue-50' },
          { label: 'DSA Approved', value: counts.dsaApproved, color: 'border-green-500 text-green-600', bg: 'bg-green-50' },
          { label: 'Rejected', value: counts.rejected, color: 'border-red-500 text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-lg shadow-sm p-5 border-l-4 ${s.color.split(' ')[0]}`}>
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color.split(' ')[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>
      )}

      {/* Submit Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Submit Medical Certificate</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Auto-filled info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-1">Student Name</p>
                <p className="font-medium text-gray-800">{user?.prenom} {user?.nom}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Email</p>
                <p className="font-medium text-gray-800">{user?.email}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Submission Date</p>
                <p className="font-medium text-gray-800">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Certificate <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  selectedFile
                    ? 'border-teal-400 bg-teal-50'
                    : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
                }`}
              >
                <Upload className={`w-8 h-8 mx-auto mb-2 ${selectedFile ? 'text-teal-500' : 'text-gray-400'}`} />
                {selectedFile ? (
                  <p className="text-sm text-teal-700 font-medium">{selectedFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">Click to upload your medical certificate</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 10 MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setSelectedFile(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || submitting}
                className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
              >
                {submitting ? 'Submitting…' : 'Submit Certificate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Certificates list */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">My Submissions</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading…</div>
        ) : certificates.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No certificates submitted yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
            >
              Submit Your First Certificate
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {certificates.map(cert => (
              <div key={cert.id} className="p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{cert.certificateFileName}</p>
                    <p className="text-xs text-gray-500">
                      Submitted {new Date(cert.submissionDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge status={cert.dsaStatus ? (cert.dsaStatus === 'APPROVED' ? 'APPROVED_DSA' : cert.dsaStatus === 'REJECTED' ? 'REJECTED_DSA' : cert.healthCenterStatus) : cert.healthCenterStatus} />
                  <button
                    onClick={() => setViewCert(cert)}
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadFile(cert)}
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                    title="Download certificate"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {viewCert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Certificate Details</h3>
              <button onClick={() => setViewCert(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Submitted</p>
                <p className="font-medium">{new Date(viewCert.submissionDate).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">File</p>
                <p className="font-medium">{viewCert.certificateFileName}</p>
              </div>

              {/* HC review section */}
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Health Center Review</p>
                {viewCert.healthCenterStatus === 'PENDING_HC' ? (
                  <p className="text-yellow-600">Awaiting Health Center review</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2"><span className="text-gray-500">Status:</span> <StatusBadge status={viewCert.healthCenterStatus} /></div>
                    {viewCert.medicalType && <div><span className="text-gray-500">Type:</span> <span className="ml-1">{viewCert.medicalType.replace(/_/g, ' ')}</span></div>}
                    {viewCert.medicalStartDate && <div><span className="text-gray-500">Period:</span> <span className="ml-1">{viewCert.medicalStartDate} → {viewCert.medicalEndDate}</span></div>}
                    {viewCert.healthCenterReviewerName && <div><span className="text-gray-500">Reviewed by:</span> <span className="ml-1">{viewCert.healthCenterReviewerName}</span></div>}
                  </div>
                )}
              </div>

              {/* DSA review section */}
              {(viewCert.healthCenterStatus === 'APPROVED_HC') && (
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">DSA Review</p>
                  {!viewCert.dsaStatus ? (
                    <p className="text-blue-600">Awaiting DSA review</p>
                  ) : (
                    <div className="space-y-2">
                      <div><span className="text-gray-500">DSA Decision:</span> <span className={`ml-1 font-medium ${viewCert.dsaStatus === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>{viewCert.dsaStatus}</span></div>
                      {viewCert.course && <div><span className="text-gray-500">Course:</span> <span className="ml-1">{viewCert.course}</span></div>}
                      {viewCert.professor && <div><span className="text-gray-500">Professor:</span> <span className="ml-1">{viewCert.professor}</span></div>}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => handleDownloadFile(viewCert)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={() => setViewCert(null)} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCertificates;
