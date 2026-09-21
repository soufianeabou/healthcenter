import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Clock, FileText, Download, Search, AlertTriangle } from 'lucide-react';
import { AbsenceCertificate, AppealReason, DsaReviewPayload, summarizeDsaDecisions, isDsaPending, isDsaDecided } from '../types/certificate';

const API = 'https://hc.aui.ma/api/consultations/certificates';

const APPEAL_REASON_LABELS: Record<AppealReason, string> = {
  REINSTATEMENT: 'Reinstatement',
  QUIZ_EXAM_MISSING: 'Quiz/Exam missing',
};

const HCBadge = ({ status }: { status: string }) => {
  if (status === 'PENDING_HC') {
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><Clock className="w-3 h-3" />HC Pending</span>;
  }
  const ok = status === 'APPROVED_HC';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {ok ? 'HC Approved' : 'HC Rejected'}
    </span>
  );
};

const DSABadge = ({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MIXED' | null }) => {
  if (!status || status === 'PENDING') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3" />Pending DSA</span>;
  if (status === 'APPROVED') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" />DSA Approved</span>;
  if (status === 'REJECTED') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" />DSA Rejected</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3" />Partially Approved</span>;
};

const DSACertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<AbsenceCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'PENDING' | 'HISTORY' | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AbsenceCertificate | null>(null);
  const [dsaReviewer, setDsaReviewer] = useState('');
  const [decisions, setDecisions] = useState<Record<number, 'APPROVED' | 'REJECTED'>>({});
  const [submitting, setSubmitting] = useState(false);

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
    setDsaReviewer(cert.dsaReviewer ?? '');
    const initial: Record<number, 'APPROVED' | 'REJECTED'> = {};
    cert.absenceSelections.forEach(sel => {
      if (sel.dsaDecision === 'APPROVED' || sel.dsaDecision === 'REJECTED') {
        initial[sel.id] = sel.dsaDecision;
      }
    });
    setDecisions(initial);
  };

  const setDecision = (selectionId: number, decision: 'APPROVED' | 'REJECTED') => {
    setDecisions(prev => ({ ...prev, [selectionId]: decision }));
  };

  // The DSA can only decide while the certificate is HC-approved and still
  // has undecided absences. Everything else (already reviewed, or not yet
  // approved by the Health Center) opens read-only — decided reviews are kept
  // as a record, and re-submitting would also re-trigger the student's email.
  const canDecide = !!selected && isDsaPending(selected);
  const allDecided = !!selected && selected.absenceSelections.every(sel => decisions[sel.id]);

  const handleSubmitReview = async () => {
    if (!selected || !canDecide) return;
    if (!dsaReviewer.trim()) {
      setError('Please enter the DSA reviewer name.');
      return;
    }
    if (!allDecided) {
      setError('Please approve or reject every absence before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const payload: DsaReviewPayload = {
        dsaReviewer,
        decisions: selected.absenceSelections.map(sel => ({
          selectionId: sel.id,
          dsaDecision: decisions[sel.id],
        })),
      };
      const res = await fetch(`${API}/${selected.id}/dsa-review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  // The DSA only acts on HC-approved certificates. Pending = still has
  // undecided absences; History = fully decided; All = everything on record
  // (including certificates still awaiting or rejected by the Health Center).
  const displayed = certificates
    .filter(c => tab === 'ALL' || (tab === 'PENDING' ? isDsaPending(c) : isDsaDecided(c)))
    .filter(c =>
      !search ||
      c.studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.studentEmail.toLowerCase().includes(search.toLowerCase())
    );

  const pendingCount = certificates.filter(isDsaPending).length;
  const historyCount = certificates.filter(isDsaDecided).length;

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
          onClick={() => setTab('HISTORY')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'HISTORY' ? 'bg-orange-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          History
          {historyCount > 0 && (
            <span className={`ml-2 text-xs rounded-full px-1.5 py-0.5 ${tab === 'HISTORY' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'}`}>{historyCount}</span>
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
            <p className="text-gray-500">{tab === 'PENDING' ? 'No pending DSA reviews.' : tab === 'HISTORY' ? 'No reviewed certificates yet.' : 'No certificates found.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] sm:min-w-[700px]">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { label: 'Student', className: '' },
                    { label: 'Email', className: 'hidden sm:table-cell' },
                    { label: 'Submitted', className: '' },
                    { label: 'HC Decision', className: '' },
                    { label: 'DSA Status', className: '' },
                    { label: 'Actions', className: '' },
                  ].map(h => (
                    <th key={h.label} className={`px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${h.className}`}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayed.map(cert => (
                  <tr key={cert.id} onClick={() => openReview(cert)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-5 py-4 text-sm font-medium text-gray-900 max-w-[140px] sm:max-w-none truncate">{cert.studentName}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 hidden sm:table-cell">{cert.studentEmail}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{new Date(cert.submissionDate).toLocaleDateString()}</td>
                    <td className="px-5 py-4"><HCBadge status={cert.healthCenterStatus} /></td>
                    <td className="px-5 py-4">
                      {cert.healthCenterStatus !== 'APPROVED_HC'
                        ? <span className="text-xs text-gray-400">Awaiting HC decision</span>
                        : (cert.absenceSelections ?? []).length === 0
                          ? <span className="text-xs text-gray-400">No absences ticked</span>
                          : <DSABadge status={summarizeDsaDecisions(cert)} />}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); openReview(cert); }} className="text-orange-600 hover:text-orange-800 transition-colors" title="Review"><Eye className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDownloadFile(cert); }} className="text-gray-400 hover:text-gray-700 transition-colors" title="Download"><Download className="w-4 h-4" /></button>
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
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 min-w-0 truncate flex-1">{selected.certificateFileName}</span>
                  <button onClick={() => handleDownloadFile(selected)} className="text-orange-600 hover:text-orange-800 text-xs flex items-center gap-1 flex-shrink-0">
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>
              </div>

              {!canDecide && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
                  {selected.healthCenterStatus !== 'APPROVED_HC'
                    ? 'Read-only — the Health Center has not approved this certificate yet.'
                    : 'Read-only — this review is complete and kept as a record.'}
                  {selected.dsaReviewer ? ` Reviewed by ${selected.dsaReviewer}` : ''}
                  {selected.dsaReviewDate ? ` on ${new Date(selected.dsaReviewDate).toLocaleDateString()}.` : ''}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DSA Reviewer <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={dsaReviewer}
                  disabled={!canDecide}
                  onChange={e => setDsaReviewer(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Reviewer full name"
                />
              </div>

              {/* Absences the student ticked, each with its own decision */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 border-b pb-2">Absences ({selected.absenceSelections.length})</p>
                {selected.absenceSelections.length === 0 ? (
                  <p className="text-sm text-gray-500">The student did not tick any absences with this certificate.</p>
                ) : (
                  <div className="space-y-3">
                    {selected.absenceSelections.map(sel => (
                      <div key={sel.id} className="border-2 border-gray-200 rounded-lg p-3 space-y-2">
                        <div>
                          <p className="font-medium text-gray-800">{sel.courseName || sel.courseSisId}</p>
                          <p className="text-xs text-gray-500">
                            {sel.markedAt || '—'}{sel.markedTime ? ` · ${sel.markedTime}` : ''} · {sel.attendanceStatus || '—'}
                            {sel.instructorName ? ` · ${sel.instructorName}` : ''}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Reason: <span className="font-medium">{APPEAL_REASON_LABELS[sel.appealReason]}</span>
                          </p>
                        </div>
                        <div className="flex gap-3">
                          {(['APPROVED', 'REJECTED'] as const).map(val => (
                            <label
                              key={val}
                              className={`flex-1 flex items-center justify-center gap-2 border-2 rounded-lg p-2 cursor-pointer transition-colors ${decisions[sel.id] === val ? (val === 'APPROVED' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-gray-200 hover:border-gray-300'}`}
                            >
                              <input
                                type="radio"
                                name={`decision-${sel.id}`}
                                value={val}
                                checked={decisions[sel.id] === val}
                                onChange={() => setDecision(sel.id, val)}
                                disabled={!canDecide}
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
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">{canDecide ? 'Cancel' : 'Close'}</button>
              {canDecide && (
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : 'Submit DSA Review'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DSACertificates;
