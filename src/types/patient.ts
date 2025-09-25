export interface Patient {
  id?: number;
  nom: string;
  prenom: string;
  cne: string;
  dateNaissance: string;
  sexe: string;
  telephone: string;
  email: string;
  departement?: string | null;
  typePatient?: PatientType | null;
}

export enum PatientType {
  STUDENT = 'STUDENT',
  STAFF = 'STAFF',
  GUEST = 'GUEST',
  AUTHER = 'AUTHER'
}

export interface PatientFormData {
  nom: string;
  prenom: string;
  cne: string;
  dateNaissance: string;
  sexe: string;
  telephone: string;
  email: string;
  departement?: string;
  typePatient: PatientType | '';
}
