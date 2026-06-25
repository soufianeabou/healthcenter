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

  // DSA review
  appealReason: string | null;
  course: string | null;
  professor: string | null;
  dsaReviewer: string | null;
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
  dsaReviewDate: string | null;
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

export interface DSAReviewPayload {
  appealReason: string;
  course: string;
  professor: string;
  dsaReviewer: string;
  absence1: boolean;
  absence2: boolean;
  absence3: boolean;
  absence4: boolean;
  absence5: boolean;
  absence6: boolean;
  absence7: boolean;
  absence8: boolean;
  absence9: boolean;
  dsaStatus: 'APPROVED' | 'REJECTED';
}
