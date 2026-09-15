export type MedicalType = 'HOSPITALIZATION' | 'EXTREME_EMERGENCY' | 'CHRONIC_DISEASE';
export type CertificateStatus =
  | 'PENDING_HC'
  | 'APPROVED_HC'
  | 'REJECTED_HC'
  | 'APPROVED_DSA'
  | 'REJECTED_DSA';

export interface AbsenceCertificate {
  id: number;

  // Student submission
  studentName: string;
  studentEmail: string;
  studentIdNum: string | null;
  submissionDate: string; // ISO datetime
  certificateFileName: string;
  certificateFileType: string;

  // Health center review
  medicalType: MedicalType | null;
  medicalStartDate: string | null;
  medicalEndDate: string | null;
  healthCenterStatus: CertificateStatus;
  healthCenterReviewerName: string | null;
  healthCenterSignature: string | null;
  healthCenterReviewDate: string | null;

  // DSA review — legacy fields, no longer set by new submissions (decisions
  // are now per absence selection below), kept only for type compatibility
  // with old rows.
  appealReason: string | null;
  course: string | null;
  professor: string | null;
  absence1: boolean;
  absence2: boolean;
  absence3: boolean;
  absence4: boolean;
  absence5: boolean;
  absence6: boolean;
  absence7: boolean;
  absence8: boolean;
  absence9: boolean;
  dsaStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;

  dsaReviewer: string | null;
  dsaReviewDate: string | null;
  absenceSelections: CertificateAbsenceSelection[];
}

export type AppealReason = 'REINSTATEMENT' | 'QUIZ_EXAM_MISSING';
export type DsaDecision = 'PENDING' | 'APPROVED' | 'REJECTED';

// One absence the student ticked at submission time, with the reason they
// gave for it and the DSA's decision on that specific absence.
export interface CertificateAbsenceSelection {
  id: number;
  attendanceRecordId: number | null;
  courseSisId: string | null;
  courseName: string | null;
  instructorName: string | null;
  markedAt: string | null;
  markedTime: string | null;
  attendanceStatus: string | null;
  appealReason: AppealReason;
  dsaDecision: DsaDecision;
}

export interface AbsenceCertificateSubmitPayload {
  studentName: string;
  studentEmail: string;
}

export interface HCReviewPayload {
  medicalType: MedicalType;
  medicalStartDate: string;
  medicalEndDate: string;
  healthCenterStatus: 'APPROVED_HC' | 'REJECTED_HC';
  healthCenterReviewerName: string;
  healthCenterSignature: string;
}

export interface AttendanceFilterRecord {
  id: number;
  student_sis_id: string;
  course_sis_id: string;
  attendance: string;
  count: number | null;
  marked_at: string | null;
  marked_time: string | null;
  seniority: string | null;
  marked_by_sis_id: string | null;
  course_name: string | null;
  instructor_name: string | null;
  status: string | null;
  grade: string | null;
  trmCde: string | null;
  yrCde: string | null;
  absentLimit: number | null;
  firstName: string | null;
  lastName: string | null;
}

export interface DsaReviewPayload {
  dsaReviewer: string;
  decisions: { selectionId: number; dsaDecision: 'APPROVED' | 'REJECTED' }[];
}

// One absence the student ticked, ready to send back on submission.
export interface SelectedAbsencePayload {
  attendanceRecordId: number | null;
  courseSisId: string | null;
  courseName: string | null;
  instructorName: string | null;
  markedAt: string | null;
  markedTime: string | null;
  attendanceStatus: string | null;
  appealReason: AppealReason;
}

// Rolls up each absence's own DSA decision into one summary for list/badge
// display — decisions are per absence, but a certificate row needs one status.
export function summarizeDsaDecisions(cert: AbsenceCertificate): 'PENDING' | 'APPROVED' | 'REJECTED' | 'MIXED' | null {
  if (!cert.absenceSelections || cert.absenceSelections.length === 0) return null;
  const decisions = cert.absenceSelections.map(s => s.dsaDecision);
  if (decisions.some(d => d === 'PENDING')) return 'PENDING';
  if (decisions.every(d => d === 'APPROVED')) return 'APPROVED';
  if (decisions.every(d => d === 'REJECTED')) return 'REJECTED';
  return 'MIXED';
}
