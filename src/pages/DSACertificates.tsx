import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Clock, FileText, Download, Search } from 'lucide-react';
import { AbsenceCertificate, DSAReviewPayload } from '../types/certificate';

const API = 'https://hc.aui.ma/api/consultations/certificates';

const ABSENCE_LABELS = [
  'Absence 1', 'Absence 2', 'Absence 3',
  'Absence 4', 'Absence 5', 'Absence 6',
  'Absence 7', 'Absence 8', 'Absence 9',
] as const;

type AbsenceKey = 'absence1'|'absence2'|'absence3'|'absence4'|'absence5'|'absence6'|'absence7'|'absence8'|'absence9';
const ABSENCE_KEYS: AbsenceKey[] = ['absence1','absence2','absence3','absence4','absence5','absence6','absence7','absence8','absence9'];

const emptyForm = (): DSAReviewPayload => ({
  appealReason: '',
  course: '',
  professor: '',
  dsaReviewer: '',
  absence1: false, absence2: false, absence3: false,
  absence4: false, absence5: false, absence6: false,
  absence7: false, absence8: false, absence9: false,
  dsaStatus: 'APPROVED',
});

const HCBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'APPROVED_HC' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
    {status === 'APPROVED_HC' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    {status === 'APPROVED_HC' ? 'HC Approved' : 'HC Rejected'}
  </span>
);

const DSABadge = ({ status }: { status: string | null }) => {
  if (!status) return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3" />Pending DSA</span>;
  if (status === 'APPROVED') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" />DSA Approved</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" />DSA Rejected</span>;
};

const DSACertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<AbsenceCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'PENDING' | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AbsenceCertificate | null>(null);
  const [form, setForm] = useState<DSAReviewPayload>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/pending-dsa`);
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
      appealReason:  cert.appealReason  ?? '',
      course:        cert.course        ?? '',
      professor:     cert.professor     ?? '',
      dsaReviewer:   cert.dsaReviewer   ?? '',
      absence1: cert.absence1, absence2: cert.absence2, absence3: cert.absence3,
      absence4: cert.absence4, absence5: cert.absence5, absence6: cert.absence6,
      absence7: cert.absence7, absence8: cert.absence8, absence9: cert.absence9,
      dsaStatus: (cert.dsaStatus as 'APPROVED' | 'REJECTED') ?? 'APPROVED',
    });
  };

  const handleSubmitReview = async () => {
    if (!selected) return;
    if (!form.appealReason || !form.course || !form.professor || !form.dsaReviewer) {
      setError('Please fill all required fields before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const res = await fetch(`${API}/${selected.id}/dsa-review`, {
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
    .filter(c => tab === 'ALL' || !c.dsaStatus)
    .filter(c =>
      !search ||
      c.studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.studentEmail.toLowerCase().includes(search.toLowerCase())
    );

  const pendingCount = certificates.filter(c => !c.dsaStatus).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">DSA Certificate Review</h1>
        <p className="text-gray-500">Process appeal requests for Health Center approved certificates</p>
      </div>

      {/* Tabs + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setTab('PENDING')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'PENDING' ? 'bg-orange-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          Pending DSA Review
          {pendingCount > 0 && (
            <span className="ml-2 bg-yellow-400 text-yellow-900 text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>
          )}
        </button>
        <button
          onClick={() => setTab('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'ALL' ? 'bg-orange-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          All
        </button>

        <div className="ml-auto relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64"
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
            <p className="text-gray-500">{tab === 'PENDING' ? 'No pending DSA reviews.' : 'No certificates found.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50">
                <tr>
                  {['Student', 'Email', 'Submitted', 'HC Decision', 'DSA Status', 'Actions'].map(h => (
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
                    <td className="px-5 py-4"><HCBadge status={cert.healthCenterStatus} /></td>
                    <td className="px-5 py-4"><DSABadge status={cert.dsaStatus} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openReview(cert)} className="text-orange-600 hover:text-orange-800 transition-colors" title="Review"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleDownloadFile(cert)} className="text-gray-400 hover:text-gray-700 transition-colors" title="Download"><Download className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DSA review modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">DSA Follow-Up</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student + HC summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-gray-500">Student</p><p className="font-medium">{selected.studentName}</p></div>
                  <div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{selected.studentEmail}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">HC Decision</p>
                    <HCBadge status={selected.healthCenterStatus} />
                  </div>
                  {selected.medicalType && (
                    <div>
                      <p className="text-xs text-gray-500">Medical Type</p>
                      <p className="font-medium">{selected.medicalType.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                </div>
                {selected.medicalStartDate && (
                  <div><p className="text-xs text-gray-500">Medical Period</p><p className="font-medium">{selected.medicalStartDate} → {selected.medicalEndDate}</p></div>
                )}
                {selected.healthCenterSignature && (
                  <div><p className="text-xs text-gray-500">HC Signature</p><p className="font-medium font-serif italic">{selected.healthCenterSignature}</p></div>
                )}
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{selected.certificateFileName}</span>
                  <button onClick={() => handleDownloadFile(selected)} className="text-orange-600 hover:text-orange-800 text-xs flex items-center gap-1">
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>
              </div>

              {/* DSA Follow-Up form */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-700 border-b pb-2">DSA Follow-Up</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appeal Reason <span className="text-red-500">*</span></label>
                  <textarea
                    rows={3}
                    value={form.appealReason}
                    onChange={e => setForm(f => ({ ...f, appealReason: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Describe the reason for this appeal…"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={form.course}
                      onChange={e => setForm(f => ({ ...f, course: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g. CS101"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professor <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={form.professor}
                      onChange={e => setForm(f => ({ ...f, professor: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Professor name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DSA Reviewer <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.dsaReviewer}
                    onChange={e => setForm(f => ({ ...f, dsaReviewer: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Reviewer full name"
                  />
                </div>
              </div>

              {/* Absence records */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 border-b pb-2">Absence Records</p>
                <p className="text-xs text-gray-500">Tick each absence considered under this appeal</p>
                <div className="grid grid-cols-3 gap-3">
                  {ABSENCE_KEYS.map((key, idx) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 border-2 rounded-lg p-3 cursor-pointer transition-colors ${form[key] ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <input
                        type="checkbox"
                        checked={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                        className="w-4 h-4 accent-orange-600"
                      />
                      <span className="text-sm text-gray-700">{ABSENCE_LABELS[idx]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* DSA Final decision */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 border-b pb-2">DSA Final Decision</p>
                <div className="flex gap-3">
                  {(['APPROVED', 'REJECTED'] as const).map(val => (
                    <label
                      key={val}
                      className={`flex-1 flex items-center gap-2 border-2 rounded-lg p-3 cursor-pointer transition-colors ${form.dsaStatus === val ? (val === 'APPROVED' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <input
                        type="radio"
                        name="dsaStatus"
                        value={val}
                        checked={form.dsaStatus === val}
                        onChange={() => setForm(f => ({ ...f, dsaStatus: val }))}
                        className="sr-only"
                      />
                      {val === 'APPROVED'
                        ? <><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-sm font-medium text-green-700">Approved</span></>
                        : <><XCircle className="w-4 h-4 text-red-600" /><span className="text-sm font-medium text-red-700">Rejected</span></>
                      }
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="px-5 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Submit DSA Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DSACertificates;
