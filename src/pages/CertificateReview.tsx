import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Clock, FileText, Download, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AbsenceCertificate, HCReviewPayload, MedicalType } from '../types/certificate';

const API = 'https://hc.aui.ma/api/consultations/certificates';

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
    PENDING_HC:   { label: 'Pending',     classes: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> },
    APPROVED_HC:  { label: 'HC Approved', classes: 'bg-green-100 text-green-800',   icon: <CheckCircle className="w-3 h-3" /> },
    REJECTED_HC:  { label: 'HC Rejected', classes: 'bg-red-100 text-red-800',       icon: <XCircle className="w-3 h-3" /> },
    APPROVED_DSA: { label: 'DSA Approved',classes: 'bg-blue-100 text-blue-800',     icon: <CheckCircle className="w-3 h-3" /> },
    REJECTED_DSA: { label: 'DSA Rejected',classes: 'bg-red-100 text-red-800',       icon: <XCircle className="w-3 h-3" /> },
  };
  const s = map[status] ?? { label: status, classes: 'bg-gray-100 text-gray-700', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.classes}`}>
      {s.icon} {s.label}
    </span>
  );
};

const MEDICAL_TYPE_LABELS: Record<MedicalType, string> = {
  HOSPITALIZATION:   'Hospitalization Period',
  EXTREME_EMERGENCY: 'Extreme Emergency Period',
  CHRONIC_DISEASE:   'Chronic Disease',
};

const CertificateReview: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<AbsenceCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'PENDING' | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AbsenceCertificate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<HCReviewPayload>({
    medicalType: 'HOSPITALIZATION',
    medicalStartDate: '',
    medicalEndDate: '',
    healthCenterStatus: 'APPROVED_HC',
    healthCenterReviewerName: user ? `${user.prenom} ${user.nom}` : '',
    healthCenterSignature: '',
  });

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(API);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCertificates(Array.isArray(data) ? data : []);
    } catch {
      setError('Could not load certificates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openReview = (cert: AbsenceCertificate) => {
    setSelected(cert);
    setForm({
      medicalType: cert.medicalType ?? 'HOSPITALIZATION',
      medicalStartDate: cert.medicalStartDate ?? '',
      medicalEndDate: cert.medicalEndDate ?? '',
      healthCenterStatus: cert.healthCenterStatus === 'APPROVED_HC' ? 'APPROVED_HC' : cert.healthCenterStatus === 'REJECTED_HC' ? 'REJECTED_HC' : 'APPROVED_HC',
      healthCenterReviewerName: cert.healthCenterReviewerName ?? (user ? `${user.prenom} ${user.nom}` : ''),
      healthCenterSignature: cert.healthCenterSignature ?? '',
    });
  };

  const handleSubmitReview = async () => {
    if (!selected) return;
    if (!form.medicalType || !form.medicalStartDate || !form.medicalEndDate || !form.healthCenterSignature) {
      setError('Please fill all required fields before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const res = await fetch(`${API}/${selected.id}/hc-review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSelected(null);
      await fetchAll();
    } catch {
      setError('Failed to submit review. Please try again.');
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

  const displayed = certificates
    .filter(c => tab === 'ALL' || c.healthCenterStatus === 'PENDING_HC')
    .filter(c =>
      !search ||
      c.studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.studentEmail.toLowerCase().includes(search.toLowerCase())
    );

  const pendingCount = certificates.filter(c => c.healthCenterStatus === 'PENDING_HC').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Certificate Review</h1>
        <p className="text-gray-500">Review and validate student medical certificates</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setTab('PENDING')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'PENDING' ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          Pending
          {pendingCount > 0 && (
            <span className="ml-2 bg-yellow-400 text-yellow-900 text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>
          )}
        </button>
        <button
          onClick={() => setTab('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'ALL' ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          All Certificates
        </button>

        <div className="ml-auto relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent w-64"
          />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading…</div>
        ) : displayed.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{tab === 'PENDING' ? 'No pending certificates.' : 'No certificates found.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50">
                <tr>
                  {['Student', 'Email', 'Submitted', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayed.map(cert => (
                  <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">{cert.studentName}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{cert.studentEmail}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{new Date(cert.submissionDate).toLocaleDateString()}</td>
                    <td className="px-5 py-4"><StatusBadge status={cert.healthCenterStatus} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openReview(cert)}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Review"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Review Certificate</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student info */}
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-gray-500">Student</p><p className="font-medium">{selected.studentName}</p></div>
                <div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{selected.studentEmail}</p></div>
                <div><p className="text-xs text-gray-500">Submitted</p><p className="font-medium">{new Date(selected.submissionDate).toLocaleDateString()}</p></div>
              </div>

              {/* File */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Attached Certificate</p>
                <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 flex-1">{selected.certificateFileName}</span>
                  <button
                    onClick={() => handleDownloadFile(selected)}
                    className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>

              {/* Medical details */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-700 border-b pb-2">Medical Details</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.medicalType}
                    onChange={e => setForm(f => ({ ...f, medicalType: e.target.value as MedicalType }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {(Object.entries(MEDICAL_TYPE_LABELS) as [MedicalType, string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={form.medicalStartDate}
                      onChange={e => setForm(f => ({ ...f, medicalStartDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={form.medicalEndDate}
                      onChange={e => setForm(f => ({ ...f, medicalEndDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Medical confirmation */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-700 border-b pb-2">Medical Confirmation</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Decision <span className="text-red-500">*</span></label>
                  <div className="flex gap-3">
                    {(['APPROVED_HC', 'REJECTED_HC'] as const).map(val => (
                      <label key={val} className={`flex-1 flex items-center gap-2 border-2 rounded-lg p-3 cursor-pointer transition-colors ${form.healthCenterStatus === val ? (val === 'APPROVED_HC' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="hcStatus"
                          value={val}
                          checked={form.healthCenterStatus === val}
                          onChange={() => setForm(f => ({ ...f, healthCenterStatus: val }))}
                          className="sr-only"
                        />
                        {val === 'APPROVED_HC'
                          ? <><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-sm font-medium text-green-700">Approved</span></>
                          : <><XCircle className="w-4 h-4 text-red-600" /><span className="text-sm font-medium text-red-700">Rejected</span></>
                        }
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Name</label>
                  <input
                    type="text"
                    value={form.healthCenterReviewerName}
                    onChange={e => setForm(f => ({ ...f, healthCenterReviewerName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signature (full name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Type your full name as signature"
                    value={form.healthCenterSignature}
                    onChange={e => setForm(f => ({ ...f, healthCenterSignature: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent font-serif italic"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateReview;
