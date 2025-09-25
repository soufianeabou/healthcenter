export interface Supplier {
  id?: number;
  nomFournisseur: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  dateJointure?: string;
  typeFournisseur?: string;
  status?: string;
}

export interface EntryStock {
  id?: number;
  medicament: {
    id: number;
    nomMedicament: string;
    codeBarre39: string;
    dosage?: number | string;
    uniteDosage?: string;
  };
  fournisseur: {
    id: number;
    nomFournisseur: string;
    telephone?: string;
    typeFournisseur?: string;
  };
  dateEntre: string; // ISO date string
  qte: number;
  badge: string;
  // Unit price field (matches backend API field name)
  unitPrice?: number;
  unite_prix?: number;
}

export interface ExitStock {
  id?: number;
  medicament: {
    id: number;
    nomMedicament: string;
    codeBarre39: string;
  };
  dateSortie: string; // ISO date string
  qte: number;
  motif: string;
  beneficiaire?: string;
}
