import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, BarChart3, CheckCircle, ChevronLeft, ChevronRight, Clock, Download,
  FileSpreadsheet, FileText, Lightbulb, RefreshCw, RotateCcw, Search, TrendingUp, XCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler, type ChartOptions,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  AbsenceCertificate, AppealReason, CertificateAbsenceSelection, isDsaDecided, isDsaPending,
} from '../types/certificate';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler,
);

const API = 'https://hc.aui.ma/api/consultations/certificates';

/* A HC-approved certificate that has waited longer than this for the DSA is
   flagged as overdue. */
const OVERDUE_DAYS = 3;
const PAGE_SIZE = 25;
const DAY = 86_400_000;

/* ── Types ─────────────────────────────────────────────────────────── */

// One ticked absence. INELIGIBLE = the certificate is not HC-approved, so the
// DSA cannot decide it yet (it is neither pending nor decided from the DSA's view).
type Decision = 'APPROVED' | 'REJECTED' | 'PENDING' | 'INELIGIBLE';
type DateBasis = 'submission' | 'decision';
type Preset = '7d' | '30d' | '90d' | 'month' | 'year' | 'all' | 'custom';

interface AbsenceRow {
  key: string;
  certId: number;
  studentName: string;
  studentEmail: string;
  studentIdNum: string;
  submissionDate: string;
  basisDate: string | null;
  hcStatus: string;
  medicalType: string;
  course: string;
  instructor: string;
  absenceDate: string | null;
  session: string | null;
  reason: AppealReason;
  decision: Decision;
  dsaReviewer: string;
  dsaReviewDate: string | null;
}

interface Agg { name: string; requested: number; approved: number; rejected: number; pending: number }

/* ── Labels & colours ──────────────────────────────────────────────── */

const REASON_LABEL: Record<AppealReason, string> = {
  REINSTATEMENT: 'Reinstatement',
  QUIZ_EXAM_MISSING: 'Quiz/Exam missing',
};
const HC_LABEL: Record<string, string> = { APPROVED_HC: 'Approved', REJECTED_HC: 'Rejected', PENDING_HC: 'Pending' };
const MEDICAL_LABEL: Record<string, string> = {
  HOSPITALIZATION: 'Hospitalization',
  EXTREME_EMERGENCY: 'Extreme emergency',
  CHRONIC_DISEASE: 'Chronic disease',
  '': 'Not specified',
};
const DECISION_LABEL: Record<Decision, string> = {
  APPROVED: 'Approved', REJECTED: 'Rejected', PENDING: 'Pending DSA', INELIGIBLE: 'Awaiting HC',
};
const COLOR = {
  approved: '#16a34a', rejected: '#dc2626', pending: '#f59e0b', muted: '#9ca3af',
  accent: '#ea580c', indigo: '#6366f1', sky: '#0ea5e9', teal: '#0d9488',
};
const PRESET_LABEL: Record<Preset, string> = {
  '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days',
  month: 'This month', year: 'This year', all: 'All time', custom: 'Custom',
};

/* ── Small helpers ─────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, '0');
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const validDate = (v?: string | null): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const fmtDate = (v?: string | null) => {
  const d = validDate(v);
  return d ? d.toLocaleDateString('en-GB') : '—';
};
// The attendance session date arrives as a plain "YYYY-MM-DD"; format it
// without going through Date so a timezone can never shift it by a day.
const fmtPlainDate = (v?: string | null) => {
  if (!v) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v;
};
const pct = (x: number) => `${Math.round(x * 100)}%`;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const fmtDuration = (ms: number | null) => {
  if (ms === null) return '—';
  const h = ms / 3_600_000;
  if (h < 1) return '<1 h';
  if (h < 48) return `${Math.round(h)} h`;
  return `${(h / 24).toFixed(1)} d`;
};

const presetRange = (p: Preset): { from: string; to: string } => {
  const now = new Date();
  const to = isoDay(now);
  switch (p) {
    case '7d':    return { from: isoDay(new Date(now.getTime() - 6 * DAY)), to };
    case '30d':   return { from: isoDay(new Date(now.getTime() - 29 * DAY)), to };
    case '90d':   return { from: isoDay(new Date(now.getTime() - 89 * DAY)), to };
    case 'month': return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), to };
    case 'year':  return { from: isoDay(new Date(now.getFullYear(), 0, 1)), to };
    default:      return { from: '', to: '' };
  }
};

const toRow = (c: AbsenceCertificate, s: CertificateAbsenceSelection, basis: DateBasis): AbsenceRow => ({
  key: `${c.id}-${s.id}`,
  certId: c.id,
  studentName: c.studentName,
  studentEmail: c.studentEmail,
  studentIdNum: c.studentIdNum ?? '',
  submissionDate: c.submissionDate,
  basisDate: basis === 'submission' ? c.submissionDate : c.dsaReviewDate,
  hcStatus: c.healthCenterStatus,
  medicalType: c.medicalType ?? '',
  course: s.courseName?.trim() || s.courseSisId || 'Unknown course',
  instructor: s.instructorName?.trim() || 'Unknown instructor',
  absenceDate: s.markedAt,
  session: s.markedTime,
  reason: s.appealReason,
  decision: c.healthCenterStatus !== 'APPROVED_HC' ? 'INELIGIBLE' : s.dsaDecision,
  dsaReviewer: c.dsaReviewer ?? '',
  dsaReviewDate: c.dsaReviewDate,
});

const aggregate = (rows: AbsenceRow[], keyOf: (r: AbsenceRow) => string): Agg[] => {
  const map = new Map<string, Agg>();
  rows.forEach(r => {
    const k = keyOf(r);
    const a = map.get(k) ?? { name: k, requested: 0, approved: 0, rejected: 0, pending: 0 };
    a.requested += 1;
    if (r.decision === 'APPROVED') a.approved += 1;
    else if (r.decision === 'REJECTED') a.rejected += 1;
    else if (r.decision === 'PENDING') a.pending += 1;
    map.set(k, a);
  });
  return [...map.values()].sort((a, b) => b.requested - a.requested || a.name.localeCompare(b.name));
};
const approvalRate = (a: { approved: number; rejected: number }) => {
  const decided = a.approved + a.rejected;
  return decided ? a.approved / decided : null;
};

/* ── File export ───────────────────────────────────────────────────── */

type Cell = string | number;
const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
const downloadCsv = (filename: string, rows: Record<string, Cell>[]) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: Cell) => {
    const s = String(v ?? '');
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\r\n');
  // BOM so Excel opens accented names as UTF-8 instead of mangling them.
  saveBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }), filename);
};

/* ── Chart options ─────────────────────────────────────────────────── */

const legendBottom = { position: 'bottom' as const, labels: { boxWidth: 12, usePointStyle: true } };
const countAxis = { beginAtZero: true, ticks: { precision: 0 } };
const barOpts: ChartOptions<'bar'> = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: legendBottom },
  scales: { x: { stacked: true }, y: { ...countAxis, stacked: true } },
};
const hBarOpts: ChartOptions<'bar'> = {
  responsive: true, maintainAspectRatio: false, indexAxis: 'y',
  plugins: { legend: legendBottom },
  scales: { x: { ...countAxis, stacked: true }, y: { stacked: true } },
};
const lineOpts: ChartOptions<'line'> = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: countAxis },
};
const doughnutOpts: ChartOptions<'doughnut'> = {
  responsive: true, maintainAspectRatio: false, cutout: '62%',
  plugins: { legend: legendBottom },
};

/* ── Presentational pieces ─────────────────────────────────────────── */

const Kpi = ({ label, value, sub, icon: Icon, tone }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; tone: string;
}) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tone}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const Card = ({ title, subtitle, children, className = '' }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${className}`}>
    <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    {subtitle && <p className="text-xs text-gray-400 mb-3">{subtitle}</p>}
    {!subtitle && <div className="mb-3" />}
    {children}
  </div>
);

const NoData = () => (
  <div className="h-full min-h-[8rem] flex items-center justify-center text-sm text-gray-400">
    No data for the selected filters.
  </div>
);

const DecisionBadge = ({ d }: { d: Decision }) => {
  const style: Record<Decision, string> = {
    APPROVED: 'bg-green-100 text-green-800', REJECTED: 'bg-red-100 text-red-800',
    PENDING: 'bg-yellow-100 text-yellow-800', INELIGIBLE: 'bg-gray-100 text-gray-600',
  };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${style[d]}`}>{DECISION_LABEL[d]}</span>;
};

const selectCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent';

/* ══════════════════════════════════════════════════════════════════════ */

const DSAReports: React.FC = () => {
  const [certs, setCerts] = useState<AbsenceCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [preset, setPreset] = useState<Preset>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [dateBasis, setDateBasis] = useState<DateBasis>('submission');
  const [hcFilter, setHcFilter] = useState('ALL');
  const [medicalFilter, setMedicalFilter] = useState('ALL');
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | Decision>('ALL');
  const [reasonFilter, setReasonFilter] = useState<'ALL' | AppealReason>('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [instructorFilter, setInstructorFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(API);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCerts(Array.isArray(data) ? data : []);
    } catch {
      setError('Could not load certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') {
      const r = presetRange(p);
      setFrom(r.from);
      setTo(r.to);
    }
  };
  const resetFilters = () => {
    applyPreset('all');
    setDateBasis('submission'); setHcFilter('ALL'); setMedicalFilter('ALL');
    setDecisionFilter('ALL'); setReasonFilter('ALL'); setCourseFilter('ALL');
    setInstructorFilter('ALL'); setSearch('');
  };

  /* Filter options come from the full data set so a selection never makes
     its own option disappear. */
  const { courseOptions, instructorOptions } = useMemo(() => {
    const courses = new Set<string>();
    const instructors = new Set<string>();
    certs.forEach(c => (c.absenceSelections ?? []).forEach(s => {
      const r = toRow(c, s, 'submission');
      courses.add(r.course);
      instructors.add(r.instructor);
    }));
    return {
      courseOptions: [...courses].sort((a, b) => a.localeCompare(b)),
      instructorOptions: [...instructors].sort((a, b) => a.localeCompare(b)),
    };
  }, [certs]);

  /* ── Filtering pipeline: certificate-level filters first, then
        absence-level filters, then the certificates that still have a
        matching absence. ── */
  const baseCerts = useMemo(() => {
    const start = from ? new Date(`${from}T00:00:00`) : null;
    const end = to ? new Date(`${to}T23:59:59.999`) : null;
    const q = search.trim().toLowerCase();
    return certs.filter(c => {
      if (start || end) {
        const d = validDate(dateBasis === 'submission' ? c.submissionDate : c.dsaReviewDate);
        if (!d) return false;
        if (start && d < start) return false;
        if (end && d > end) return false;
      }
      if (hcFilter !== 'ALL' && c.healthCenterStatus !== hcFilter) return false;
      if (medicalFilter !== 'ALL' && (c.medicalType ?? '') !== medicalFilter) return false;
      if (q && !`${c.studentName} ${c.studentEmail} ${c.studentIdNum ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [certs, from, to, dateBasis, hcFilter, medicalFilter, search]);

  const rows = useMemo(() => baseCerts
    .flatMap(c => (c.absenceSelections ?? []).map(s => toRow(c, s, dateBasis)))
    .filter(r =>
      (decisionFilter === 'ALL' || r.decision === decisionFilter) &&
      (reasonFilter === 'ALL' || r.reason === reasonFilter) &&
      (courseFilter === 'ALL' || r.course === courseFilter) &&
      (instructorFilter === 'ALL' || r.instructor === instructorFilter))
    .sort((a, b) => (validDate(b.submissionDate)?.getTime() ?? 0) - (validDate(a.submissionDate)?.getTime() ?? 0)),
  [baseCerts, dateBasis, decisionFilter, reasonFilter, courseFilter, instructorFilter]);

  const absenceFilterActive = decisionFilter !== 'ALL' || reasonFilter !== 'ALL'
    || courseFilter !== 'ALL' || instructorFilter !== 'ALL';
  const scopedCerts = useMemo(() => {
    if (!absenceFilterActive) return baseCerts;
    const ids = new Set(rows.map(r => r.certId));
    return baseCerts.filter(c => ids.has(c.id));
  }, [baseCerts, rows, absenceFilterActive]);

  useEffect(() => { setPage(0); }, [rows]);

  /* ── Metrics ── */
  const stats = useMemo(() => {
    const hcApproved = scopedCerts.filter(c => c.healthCenterStatus === 'APPROVED_HC').length;
    const hcRejected = scopedCerts.filter(c => c.healthCenterStatus === 'REJECTED_HC').length;
    const hcPending = scopedCerts.filter(c => c.healthCenterStatus === 'PENDING_HC').length;
    const dsaDecidedCerts = scopedCerts.filter(isDsaDecided);
    const dsaPendingCerts = scopedCerts.filter(isDsaPending);
    const overdue = dsaPendingCerts.filter(c => {
      const ref = validDate(c.healthCenterReviewDate) ?? validDate(c.submissionDate);
      return !!ref && Date.now() - ref.getTime() > OVERDUE_DAYS * DAY;
    }).length;

    const approved = rows.filter(r => r.decision === 'APPROVED').length;
    const rejected = rows.filter(r => r.decision === 'REJECTED').length;
    const pending = rows.filter(r => r.decision === 'PENDING').length;
    const ineligible = rows.filter(r => r.decision === 'INELIGIBLE').length;
    const decided = approved + rejected;

    const hcTurn: number[] = [];
    scopedCerts.forEach(c => {
      const sub = validDate(c.submissionDate);
      const hc = validDate(c.healthCenterReviewDate);
      if (sub && hc && hc >= sub) hcTurn.push(hc.getTime() - sub.getTime());
    });
    const dsaTurn: number[] = [];
    dsaDecidedCerts.forEach(c => {
      const hc = validDate(c.healthCenterReviewDate);
      const dsa = validDate(c.dsaReviewDate);
      if (hc && dsa && dsa >= hc) dsaTurn.push(dsa.getTime() - hc.getTime());
    });

    return {
      submitted: scopedCerts.length, hcApproved, hcRejected, hcPending,
      dsaDecided: dsaDecidedCerts.length, dsaPending: dsaPendingCerts.length, overdue,
      requested: rows.length, approved, rejected, pending, ineligible, decided,
      rate: decided ? approved / decided : null,
      hcTurnaround: avg(hcTurn), dsaTurnaround: avg(dsaTurn),
    };
  }, [scopedCerts, rows]);

  const courseAgg = useMemo(() => aggregate(rows, r => r.course), [rows]);
  const instructorAgg = useMemo(() => aggregate(rows, r => r.instructor), [rows]);
  const reasonAgg = useMemo(() => (['REINSTATEMENT', 'QUIZ_EXAM_MISSING'] as AppealReason[]).map(reason => {
    const rs = rows.filter(r => r.reason === reason);
    return {
      reason,
      approved: rs.filter(r => r.decision === 'APPROVED').length,
      rejected: rs.filter(r => r.decision === 'REJECTED').length,
      pending: rs.filter(r => r.decision === 'PENDING').length,
      total: rs.length,
    };
  }), [rows]);
  const medicalAgg = useMemo(() => {
    const m = new Map<string, number>();
    scopedCerts.forEach(c => {
      const k = MEDICAL_LABEL[c.medicalType ?? ''] ?? String(c.medicalType);
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [scopedCerts]);

  /* Time series: bucket size adapts to the span of the data (day → week → month). */
  const series = useMemo(() => {
    const dated = scopedCerts
      .map(c => validDate(dateBasis === 'submission' ? c.submissionDate : c.dsaReviewDate))
      .filter((d): d is Date => !!d);
    if (!dated.length) return null;
    const min = new Date(Math.min(...dated.map(d => d.getTime())));
    const max = new Date(Math.max(...dated.map(d => d.getTime())));
    const span = (max.getTime() - min.getTime()) / DAY;
    const gran: 'day' | 'week' | 'month' = span <= 31 ? 'day' : span <= 200 ? 'week' : 'month';

    const startOf = (d: Date) => {
      if (gran === 'day') return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (gran === 'week') return new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
      return new Date(d.getFullYear(), d.getMonth(), 1);
    };
    const keyOf = (d: Date) => isoDay(startOf(d));
    const labelOf = (d: Date) => gran === 'month'
      ? d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    const keys: string[] = [];
    const labels: string[] = [];
    const cursor = startOf(min);
    for (let i = 0; i < 400 && cursor <= max; i++) {
      keys.push(isoDay(cursor));
      labels.push(gran === 'week' ? `wk ${labelOf(cursor)}` : labelOf(cursor));
      if (gran === 'day') cursor.setDate(cursor.getDate() + 1);
      else if (gran === 'week') cursor.setDate(cursor.getDate() + 7);
      else cursor.setMonth(cursor.getMonth() + 1);
    }
    const idx = new Map(keys.map((k, i) => [k, i]));
    const certCounts = keys.map(() => 0);
    const dec = { APPROVED: keys.map(() => 0), REJECTED: keys.map(() => 0), PENDING: keys.map(() => 0) };
    dated.forEach(d => { const i = idx.get(keyOf(d)); if (i !== undefined) certCounts[i] += 1; });
    rows.forEach(r => {
      const d = validDate(r.basisDate);
      if (!d || r.decision === 'INELIGIBLE') return;
      const i = idx.get(keyOf(d));
      if (i !== undefined) dec[r.decision][i] += 1;
    });
    return { labels, certCounts, dec, gran };
  }, [scopedCerts, rows, dateBasis]);

  /* Plain-language observations so the DSA doesn't have to read every chart. */
  const insights = useMemo(() => {
    const out: { tone: 'good' | 'warn' | 'info'; text: string }[] = [];
    if (stats.decided > 0 && stats.rate !== null) {
      out.push({ tone: stats.rate >= 0.75 ? 'good' : 'info',
        text: `${pct(stats.rate)} of decided absences were approved (${stats.approved} of ${stats.decided}).` });
    }
    if (stats.overdue > 0) {
      out.push({ tone: 'warn',
        text: `${stats.overdue} certificate${stats.overdue > 1 ? 's have' : ' has'} waited more than ${OVERDUE_DAYS} days for a DSA decision since Health Center approval.` });
    }
    if (stats.hcPending > 0) {
      out.push({ tone: 'info', text: `${stats.hcPending} certificate${stats.hcPending > 1 ? 's are' : ' is'} still awaiting a Health Center decision.` });
    }
    if (stats.dsaTurnaround !== null) {
      out.push({ tone: 'info', text: `DSA decisions take ${fmtDuration(stats.dsaTurnaround)} on average after Health Center approval.` });
    }
    if (courseAgg.length) {
      out.push({ tone: 'info', text: `Most-appealed course: ${courseAgg[0].name} (${courseAgg[0].requested} absence${courseAgg[0].requested > 1 ? 's' : ''}).` });
    }
    const harshest = courseAgg
      .filter(a => a.approved + a.rejected >= 3 && a.rejected > 0)
      .sort((a, b) => b.rejected / (b.approved + b.rejected) - a.rejected / (a.approved + a.rejected))[0];
    if (harshest) {
      out.push({ tone: 'warn', text: `Highest rejection rate: ${harshest.name} — ${pct(harshest.rejected / (harshest.approved + harshest.rejected))} of ${harshest.approved + harshest.rejected} decided absences.` });
    }
    if (instructorAgg.length && instructorAgg[0].name !== 'Unknown instructor') {
      out.push({ tone: 'info', text: `Most-appealed instructor: ${instructorAgg[0].name} (${instructorAgg[0].requested}).` });
    }
    const [reinst, quiz] = reasonAgg;
    const rr = approvalRate(reinst), qr = approvalRate(quiz);
    if (rr !== null && qr !== null) {
      out.push({ tone: 'info', text: `Approval by reason — Reinstatement: ${pct(rr)}, Quiz/Exam missing: ${pct(qr)}.` });
    }
    return out;
  }, [stats, courseAgg, instructorAgg, reasonAgg]);

  const activeFilterText = useMemo(() => {
    const parts: string[] = [];
    if (from || to) parts.push(`${dateBasis === 'submission' ? 'Submitted' : 'Decided'} ${from || '…'} → ${to || '…'}`);
    if (hcFilter !== 'ALL') parts.push(`HC: ${HC_LABEL[hcFilter]}`);
    if (medicalFilter !== 'ALL') parts.push(`Medical: ${MEDICAL_LABEL[medicalFilter]}`);
    if (decisionFilter !== 'ALL') parts.push(`DSA: ${DECISION_LABEL[decisionFilter]}`);
    if (reasonFilter !== 'ALL') parts.push(`Reason: ${REASON_LABEL[reasonFilter]}`);
    if (courseFilter !== 'ALL') parts.push(`Course: ${courseFilter}`);
    if (instructorFilter !== 'ALL') parts.push(`Instructor: ${instructorFilter}`);
    if (search.trim()) parts.push(`Search: ${search.trim()}`);
    return parts.length ? parts.join(' · ') : 'No filters (all data)';
  }, [from, to, dateBasis, hcFilter, medicalFilter, decisionFilter, reasonFilter, courseFilter, instructorFilter, search]);

  /* ── Export ── */
  const absenceExportRows = (): Record<string, Cell>[] => rows.map(r => ({
    'Certificate ID': r.certId,
    'Student': r.studentName,
    'Student ID': r.studentIdNum,
    'Email': r.studentEmail,
    'Submitted': fmtDate(r.submissionDate),
    'Health Center': HC_LABEL[r.hcStatus] ?? r.hcStatus,
    'Medical type': MEDICAL_LABEL[r.medicalType] ?? r.medicalType,
    'Course': r.course,
    'Instructor': r.instructor,
    'Absence date': fmtPlainDate(r.absenceDate),
    'Session': r.session ?? '',
    'Appeal reason': REASON_LABEL[r.reason] ?? r.reason,
    'DSA decision': DECISION_LABEL[r.decision],
    'DSA reviewer': r.dsaReviewer,
    'DSA review date': fmtDate(r.dsaReviewDate),
  }));
  const certificateExportRows = (): Record<string, Cell>[] => scopedCerts.map(c => {
    const sels = c.absenceSelections ?? [];
    return {
      'Certificate ID': c.id,
      'Student': c.studentName,
      'Student ID': c.studentIdNum ?? '',
      'Email': c.studentEmail,
      'Submitted': fmtDate(c.submissionDate),
      'Medical type': MEDICAL_LABEL[c.medicalType ?? ''] ?? String(c.medicalType),
      'Medical period': c.medicalStartDate ? `${c.medicalStartDate} → ${c.medicalEndDate ?? ''}` : '',
      'Health Center': HC_LABEL[c.healthCenterStatus] ?? c.healthCenterStatus,
      'HC reviewer': c.healthCenterReviewerName ?? '',
      'HC review date': fmtDate(c.healthCenterReviewDate),
      'Absences ticked': sels.length,
      'Approved': sels.filter(s => s.dsaDecision === 'APPROVED').length,
      'Rejected': sels.filter(s => s.dsaDecision === 'REJECTED').length,
      'Pending': sels.filter(s => s.dsaDecision === 'PENDING').length,
      'DSA reviewer': c.dsaReviewer ?? '',
      'DSA review date': fmtDate(c.dsaReviewDate),
    };
  });
  const aggExportRows = (agg: Agg[], label: string): Record<string, Cell>[] => agg.map(a => {
    const rate = approvalRate(a);
    return {
      [label]: a.name, 'Absences requested': a.requested, 'Approved': a.approved,
      'Rejected': a.rejected, 'Pending': a.pending, 'Approval rate': rate === null ? '' : pct(rate),
    };
  });
  const stamp = () => isoDay(new Date());

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const summary: Cell[][] = [
      ['DSA Certificate Report'],
      ['Generated', new Date().toLocaleString('en-GB')],
      ['Filters', activeFilterText],
      [],
      ['Metric', 'Value'],
      ['Certificates submitted', stats.submitted],
      ['Health Center approved', stats.hcApproved],
      ['Health Center rejected', stats.hcRejected],
      ['Health Center pending', stats.hcPending],
      ['Certificates fully decided by DSA', stats.dsaDecided],
      ['Certificates pending DSA', stats.dsaPending],
      [`Overdue (> ${OVERDUE_DAYS} days waiting on DSA)`, stats.overdue],
      ['Absences requested', stats.requested],
      ['Absences approved', stats.approved],
      ['Absences rejected', stats.rejected],
      ['Absences pending DSA', stats.pending],
      ['Absences awaiting Health Center', stats.ineligible],
      ['Approval rate (decided absences)', stats.rate === null ? '' : pct(stats.rate)],
      ['Avg Health Center turnaround', fmtDuration(stats.hcTurnaround)],
      ['Avg DSA turnaround (after HC approval)', fmtDuration(stats.dsaTurnaround)],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');
    const addSheet = (name: string, data: Record<string, Cell>[]) => {
      if (data.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), name);
    };
    addSheet('Certificates', certificateExportRows());
    addSheet('Absences', absenceExportRows());
    addSheet('By course', aggExportRows(courseAgg, 'Course'));
    addSheet('By instructor', aggExportRows(instructorAgg, 'Instructor'));
    XLSX.writeFile(wb, `dsa-report_${stamp()}.xlsx`);
  };

  const maxPage = Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1);
  const currentPage = Math.min(page, maxPage);
  const pageRows = rows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  /* ── Render ── */
  if (loading && certs.length === 0) {
    return <div className="p-12 text-center text-gray-500">Loading report…</div>;
  }

  const topCourses = courseAgg.slice(0, 10);
  const topInstructors = instructorAgg.slice(0, 10);
  const stackedDatasets = (agg: Agg[]) => [
    { label: 'Approved', data: agg.map(a => a.approved), backgroundColor: COLOR.approved },
    { label: 'Rejected', data: agg.map(a => a.rejected), backgroundColor: COLOR.rejected },
    { label: 'Pending', data: agg.map(a => a.pending), backgroundColor: COLOR.pending },
  ];
  const shortLabel = (s: string) => (s.length > 34 ? `${s.slice(0, 33)}…` : s);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-600" /> DSA Reports
          </h1>
          <p className="text-gray-500">Certificates and absence appeals across the Health Center → DSA workflow</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => void load()} disabled={loading}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={exportExcel} disabled={!scopedCerts.length}
            className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center gap-2 disabled:opacity-50">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button onClick={() => downloadCsv(`dsa-absences_${stamp()}.csv`, absenceExportRows())} disabled={!rows.length}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50">
            <Download className="w-4 h-4" /> CSV · absences
          </button>
          <button onClick={() => downloadCsv(`dsa-certificates_${stamp()}.csv`, certificateExportRows())} disabled={!scopedCerts.length}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50">
            <FileText className="w-4 h-4" /> CSV · certificates
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(['7d', '30d', '90d', 'month', 'year', 'all'] as Preset[]).map(p => (
            <button key={p} onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${preset === p ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {PRESET_LABEL[p]}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <input type="date" value={from} max={to || undefined}
              onChange={e => { setFrom(e.target.value); setPreset('custom'); }} className={selectCls} aria-label="From date" />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" value={to} min={from || undefined}
              onChange={e => { setTo(e.target.value); setPreset('custom'); }} className={selectCls} aria-label="To date" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select value={dateBasis} onChange={e => setDateBasis(e.target.value as DateBasis)} className={selectCls} aria-label="Date applies to">
            <option value="submission">Date range: submission date</option>
            <option value="decision">Date range: DSA decision date</option>
          </select>
          <select value={hcFilter} onChange={e => setHcFilter(e.target.value)} className={selectCls} aria-label="Health Center status">
            <option value="ALL">Health Center: any</option>
            <option value="APPROVED_HC">Health Center: approved</option>
            <option value="PENDING_HC">Health Center: pending</option>
            <option value="REJECTED_HC">Health Center: rejected</option>
          </select>
          <select value={decisionFilter} onChange={e => setDecisionFilter(e.target.value as 'ALL' | Decision)} className={selectCls} aria-label="DSA decision">
            <option value="ALL">DSA decision: any</option>
            <option value="PENDING">DSA: pending</option>
            <option value="APPROVED">DSA: approved</option>
            <option value="REJECTED">DSA: rejected</option>
            <option value="INELIGIBLE">Awaiting Health Center</option>
          </select>
          <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value as 'ALL' | AppealReason)} className={selectCls} aria-label="Appeal reason">
            <option value="ALL">Reason: any</option>
            <option value="REINSTATEMENT">Reinstatement</option>
            <option value="QUIZ_EXAM_MISSING">Quiz/Exam missing</option>
          </select>
          <select value={medicalFilter} onChange={e => setMedicalFilter(e.target.value)} className={selectCls} aria-label="Medical type">
            <option value="ALL">Medical type: any</option>
            <option value="HOSPITALIZATION">Hospitalization</option>
            <option value="EXTREME_EMERGENCY">Extreme emergency</option>
            <option value="CHRONIC_DISEASE">Chronic disease</option>
          </select>
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} className={selectCls} aria-label="Course">
            <option value="ALL">Course: any</option>
            {courseOptions.map(c => <option key={c} value={c}>{shortLabel(c)}</option>)}
          </select>
          <select value={instructorFilter} onChange={e => setInstructorFilter(e.target.value)} className={selectCls} aria-label="Instructor">
            <option value="ALL">Instructor: any</option>
            {instructorOptions.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Student name, email or ID…"
              className={`${selectCls} pl-9 w-full`} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-gray-500">
          <span>{activeFilterText}</span>
          <button onClick={resetFilters} className="flex items-center gap-1 text-orange-600 hover:text-orange-800 font-medium">
            <RotateCcw className="w-3 h-3" /> Reset filters
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Certificates submitted" value={stats.submitted} icon={FileText} tone="bg-gray-600"
          sub={`${stats.hcApproved} HC-approved`} />
        <Kpi label="Absences requested" value={stats.requested} icon={TrendingUp} tone="bg-indigo-500"
          sub={`across ${scopedCerts.filter(c => (c.absenceSelections ?? []).length).length} certificates`} />
        <Kpi label="Approval rate" value={stats.rate === null ? '—' : pct(stats.rate)} icon={CheckCircle} tone="bg-green-500"
          sub={`${stats.approved} approved · ${stats.rejected} rejected`} />
        <Kpi label="Pending DSA" value={stats.pending} icon={Clock} tone="bg-amber-500"
          sub={stats.overdue > 0 ? `${stats.overdue} overdue (> ${OVERDUE_DAYS} d)` : 'none overdue'} />
        <Kpi label="Avg HC turnaround" value={fmtDuration(stats.hcTurnaround)} icon={Clock} tone="bg-sky-500" sub="submission → HC decision" />
        <Kpi label="Avg DSA turnaround" value={fmtDuration(stats.dsaTurnaround)} icon={Clock} tone="bg-orange-500" sub="HC approval → DSA decision" />
        <Kpi label="Absences rejected" value={stats.rejected} icon={XCircle} tone="bg-red-500"
          sub={stats.decided ? `${pct(stats.rejected / stats.decided)} of decided` : 'no decisions yet'} />
        <Kpi label="Overdue certificates" value={stats.overdue} icon={AlertTriangle} tone={stats.overdue ? 'bg-red-500' : 'bg-gray-400'}
          sub={`waiting > ${OVERDUE_DAYS} days on DSA`} />
      </div>

      {/* Workflow funnel + insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Workflow funnel" subtitle="How certificates move from submission to a DSA decision">
          {stats.submitted === 0 ? <NoData /> : (
            <div className="space-y-3">
              {[
                { label: 'Submitted', n: stats.submitted, color: 'bg-gray-500' },
                { label: 'Approved by Health Center', n: stats.hcApproved, color: 'bg-sky-500' },
                { label: 'Fully decided by DSA', n: stats.dsaDecided, color: 'bg-green-500' },
              ].map(step => (
                <div key={step.label}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{step.label}</span>
                    <span className="font-medium">{step.n} · {pct(step.n / stats.submitted)}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${step.color}`} style={{ width: `${(step.n / stats.submitted) * 100}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-1">
                {stats.hcRejected} rejected and {stats.hcPending} still pending at the Health Center;
                {' '}{stats.dsaPending} awaiting the DSA.
              </p>
            </div>
          )}
        </Card>

        <Card title="Insights" subtitle="Generated from the current filters">
          {insights.length === 0 ? <NoData /> : (
            <ul className="space-y-2">
              {insights.map((i, n) => (
                <li key={n} className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 ${
                  i.tone === 'warn' ? 'bg-amber-50 text-amber-900' : i.tone === 'good' ? 'bg-green-50 text-green-900' : 'bg-gray-50 text-gray-700'}`}>
                  {i.tone === 'warn'
                    ? <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    : <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <span>{i.text}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Certificates over time"
          subtitle={series ? `Per ${series.gran} · by ${dateBasis === 'submission' ? 'submission' : 'decision'} date` : undefined}>
          <div className="h-64">
            {!series ? <NoData /> : (
              <Line options={lineOpts} data={{
                labels: series.labels,
                datasets: [{ label: 'Certificates', data: series.certCounts, borderColor: COLOR.accent,
                  backgroundColor: 'rgba(234,88,12,0.12)', fill: true, tension: 0.3, pointRadius: 3 }],
              }} />
            )}
          </div>
        </Card>

        <Card title="Absence decisions over time" subtitle={series ? `Per ${series.gran}` : undefined}>
          <div className="h-64">
            {!series ? <NoData /> : (
              <Bar options={barOpts} data={{
                labels: series.labels,
                datasets: [
                  { label: 'Approved', data: series.dec.APPROVED, backgroundColor: COLOR.approved },
                  { label: 'Rejected', data: series.dec.REJECTED, backgroundColor: COLOR.rejected },
                  { label: 'Pending', data: series.dec.PENDING, backgroundColor: COLOR.pending },
                ],
              }} />
            )}
          </div>
        </Card>

        <Card title="Decision breakdown" subtitle="Absences, by DSA outcome">
          <div className="h-64">
            {stats.requested === 0 ? <NoData /> : (
              <Doughnut options={doughnutOpts} data={{
                labels: ['Approved', 'Rejected', 'Pending DSA', 'Awaiting HC'],
                datasets: [{
                  data: [stats.approved, stats.rejected, stats.pending, stats.ineligible],
                  backgroundColor: [COLOR.approved, COLOR.rejected, COLOR.pending, COLOR.muted], borderWidth: 0,
                }],
              }} />
            )}
          </div>
        </Card>

        <Card title="Appeal reason" subtitle="Reinstatement vs Quiz/Exam missing, by outcome">
          <div className="h-64">
            {reasonAgg.every(r => r.total === 0) ? <NoData /> : (
              <Bar options={barOpts} data={{
                labels: reasonAgg.map(r => REASON_LABEL[r.reason]),
                datasets: [
                  { label: 'Approved', data: reasonAgg.map(r => r.approved), backgroundColor: COLOR.approved },
                  { label: 'Rejected', data: reasonAgg.map(r => r.rejected), backgroundColor: COLOR.rejected },
                  { label: 'Pending', data: reasonAgg.map(r => r.pending), backgroundColor: COLOR.pending },
                ],
              }} />
            )}
          </div>
        </Card>

        <Card title="Top courses" subtitle="Most absence appeals (top 10)">
          <div style={{ height: Math.max(220, topCourses.length * 34 + 60) }}>
            {topCourses.length === 0 ? <NoData /> : (
              <Bar options={hBarOpts} data={{ labels: topCourses.map(a => shortLabel(a.name)), datasets: stackedDatasets(topCourses) }} />
            )}
          </div>
        </Card>

        <Card title="Top instructors" subtitle="Most absence appeals (top 10)">
          <div style={{ height: Math.max(220, topInstructors.length * 34 + 60) }}>
            {topInstructors.length === 0 ? <NoData /> : (
              <Bar options={hBarOpts} data={{ labels: topInstructors.map(a => shortLabel(a.name)), datasets: stackedDatasets(topInstructors) }} />
            )}
          </div>
        </Card>

        <Card title="Medical type" subtitle="Certificates, by type declared by the Health Center" className="lg:col-span-2">
          <div className="h-56">
            {medicalAgg.length === 0 ? <NoData /> : (
              <Doughnut options={doughnutOpts} data={{
                labels: medicalAgg.map(([k]) => k),
                datasets: [{ data: medicalAgg.map(([, v]) => v),
                  backgroundColor: [COLOR.indigo, COLOR.sky, COLOR.teal, COLOR.muted, COLOR.accent], borderWidth: 0 }],
              }} />
            )}
          </div>
        </Card>
      </div>

      {/* Breakdown tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {([['By course', courseAgg, 'Course'], ['By instructor', instructorAgg, 'Instructor']] as [string, Agg[], string][]).map(([title, agg, label]) => (
          <Card key={title} title={title} subtitle="Sorted by absences requested">
            {agg.length === 0 ? <NoData /> : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {[label, 'Req.', 'Appr.', 'Rej.', 'Pend.', 'Rate'].map((h, i) => (
                        <th key={h} className={`px-3 py-2 text-xs font-medium text-gray-500 uppercase ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {agg.map(a => {
                      const rate = approvalRate(a);
                      return (
                        <tr key={a.name} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-800 max-w-[220px] truncate" title={a.name}>{a.name}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{a.requested}</td>
                          <td className="px-3 py-2 text-right text-green-700">{a.approved}</td>
                          <td className="px-3 py-2 text-right text-red-700">{a.rejected}</td>
                          <td className="px-3 py-2 text-right text-amber-700">{a.pending}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-800">{rate === null ? '—' : pct(rate)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Absence detail */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Absence details</h3>
            <p className="text-xs text-gray-400">{rows.length} absence{rows.length === 1 ? '' : 's'} · one row per absence a student asked to excuse</p>
          </div>
          {rows.length > PAGE_SIZE && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <button onClick={() => setPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}
                className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50" aria-label="Previous page">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Page {currentPage + 1} / {maxPage + 1}</span>
              <button onClick={() => setPage(Math.min(maxPage, currentPage + 1))} disabled={currentPage >= maxPage}
                className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50" aria-label="Next page">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {rows.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No absences match the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Student', 'Course', 'Instructor', 'Absence', 'Reason', 'Decision', 'Reviewed'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageRows.map(r => (
                  <tr key={r.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 max-w-[200px] truncate">{r.studentName}</p>
                      <p className="text-xs text-gray-400">{r.studentIdNum || r.studentEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[220px] truncate" title={r.course}>{r.course}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{r.instructor}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {fmtPlainDate(r.absenceDate)}{r.session ? <span className="text-xs text-gray-400"> · {r.session}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{REASON_LABEL[r.reason] ?? r.reason}</td>
                    <td className="px-4 py-3"><DecisionBadge d={r.decision} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {r.decision === 'APPROVED' || r.decision === 'REJECTED'
                        ? <>{r.dsaReviewer || '—'}<br />{fmtDate(r.dsaReviewDate)}</>
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DSAReports;
