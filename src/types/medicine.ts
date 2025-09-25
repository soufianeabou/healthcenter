export enum CategorieMedicament {
  ANTIBIOTIQUE = 'ANTIBIOTIQUE',
  ANTI_INFLAMMATOIRE = 'ANTI_INFLAMMATOIRE',
  ANTALGIQUE = 'ANTALGIQUE',
  ANTIPYRETIQUE = 'ANTIPYRETIQUE',
  ANTIVIRAL = 'ANTIVIRAL',
  VITAMINE = 'VITAMINE',
  VACCIN = 'VACCIN',
  AUTRE = 'AUTRE'
}

export enum Unite {
  MG = 'MG',
  G = 'G',
  ML = 'ML',
  L = 'L',
  UI = 'UI',
  TABLETTE = 'TABLETTE',
  AUTRE = 'AUTRE'
}

export interface Medicine {
  id?: number;
  nomMedicament: string;
  description: string;
  codeBarre39: string;
  perPile: boolean;
  categorie: CategorieMedicament;
  dosage: number;
  uniteDosage: Unite;
  defaultSize: number;
  qteStock: number;
  qteMinimum: number;
  compteurPiles?: number; // Optional as it's initialized to 0
}

// Helper function to get category display name
export function getCategorieDisplayName(categorie: CategorieMedicament): string {
  const names = {
    [CategorieMedicament.ANTIBIOTIQUE]: 'Antibiotique',
    [CategorieMedicament.ANTI_INFLAMMATOIRE]: 'Anti-inflammatoire',
    [CategorieMedicament.ANTALGIQUE]: 'Antalgique',
    [CategorieMedicament.ANTIPYRETIQUE]: 'Antipyrétique',
    [CategorieMedicament.ANTIVIRAL]: 'Antiviral',
    [CategorieMedicament.VITAMINE]: 'Vitamine',
    [CategorieMedicament.VACCIN]: 'Vaccin',
    [CategorieMedicament.AUTRE]: 'Autre'
  };
  return names[categorie] || categorie;
}

// Helper function to get unit display name
export function getUniteDisplayName(unite: Unite): string {
  const names = {
    [Unite.MG]: 'mg',
    [Unite.G]: 'g',
    [Unite.ML]: 'ml',
    [Unite.L]: 'L',
    [Unite.UI]: 'UI',
    [Unite.TABLETTE]: 'Tablette',
    [Unite.AUTRE]: 'Autre'
  };
  return names[unite] || unite;
}

// Helper function to get category color classes
export function getCategorieBadgeColors(categorie: CategorieMedicament): string {
  const colors = {
    [CategorieMedicament.ANTIBIOTIQUE]: 'bg-blue-100 text-blue-800',
    [CategorieMedicament.ANTI_INFLAMMATOIRE]: 'bg-red-100 text-red-800',
    [CategorieMedicament.ANTALGIQUE]: 'bg-green-100 text-green-800',
    [CategorieMedicament.ANTIPYRETIQUE]: 'bg-yellow-100 text-yellow-800',
    [CategorieMedicament.ANTIVIRAL]: 'bg-purple-100 text-purple-800',
    [CategorieMedicament.VITAMINE]: 'bg-orange-100 text-orange-800',
    [CategorieMedicament.VACCIN]: 'bg-indigo-100 text-indigo-800',
    [CategorieMedicament.AUTRE]: 'bg-gray-100 text-gray-800'
  };
  return colors[categorie] || 'bg-gray-100 text-gray-800';
}
