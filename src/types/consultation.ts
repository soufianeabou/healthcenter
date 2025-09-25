export interface ConsultationDTO {
  id?: number;
  patient: { id: number };
  personnel: { id: number };
  dateConsultation: string; // ISO datetime
  motif: string;
  diagnostic: string;
  traitement: string;
}

export interface ConsultationView extends ConsultationDTO {
  patient: { id: number; nom?: string; prenom?: string };
  personnel: { id: number; nom?: string; prenom?: string };
}

export interface SortieStockDTO {
  id?: number;
  consultation: { id: number };
  medicament: { id: number };
  parUnite: boolean;
  quantite: number;
  dateSortie: string; // ISO date
}
