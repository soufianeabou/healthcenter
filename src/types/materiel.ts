// Using the same enum values as the backend for compatibility
export enum CategorieMateriels {
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

export interface Materiel {
  id?: number;
  nomMedicament: string; // Keep field name for API compatibility
  description: string;
  codeBarre39: string;
  perPile: boolean;
  categorie: CategorieMateriels;
  dosage: number; // Keep field name for API compatibility
  uniteDosage: Unite; // Keep field name for API compatibility
  defaultSize: number;
  qteStock: number;
  qteMinimum: number;
  compteurPiles?: number; // Optional as it's initialized to 0
}

// Helper function to get category display name
export function getCategorieDisplayName(categorie: CategorieMateriels): string {
  const names = {
    [CategorieMateriels.ANTIBIOTIQUE]: 'Antibiotique',
    [CategorieMateriels.ANTI_INFLAMMATOIRE]: 'Anti-inflammatoire',
    [CategorieMateriels.ANTALGIQUE]: 'Antalgique',
    [CategorieMateriels.ANTIPYRETIQUE]: 'Antipyrétique',
    [CategorieMateriels.ANTIVIRAL]: 'Antiviral',
    [CategorieMateriels.VITAMINE]: 'Vitamine',
    [CategorieMateriels.VACCIN]: 'Vaccin',
    [CategorieMateriels.AUTRE]: 'Autre'
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
export function getCategorieBadgeColors(categorie: CategorieMateriels): string {
  const colors = {
    [CategorieMateriels.ANTIBIOTIQUE]: 'bg-blue-100 text-blue-800',
    [CategorieMateriels.ANTI_INFLAMMATOIRE]: 'bg-red-100 text-red-800',
    [CategorieMateriels.ANTALGIQUE]: 'bg-green-100 text-green-800',
    [CategorieMateriels.ANTIPYRETIQUE]: 'bg-yellow-100 text-yellow-800',
    [CategorieMateriels.ANTIVIRAL]: 'bg-purple-100 text-purple-800',
    [CategorieMateriels.VITAMINE]: 'bg-orange-100 text-orange-800',
    [CategorieMateriels.VACCIN]: 'bg-indigo-100 text-indigo-800',
    [CategorieMateriels.AUTRE]: 'bg-gray-100 text-gray-800'
  };
  return colors[categorie] || 'bg-gray-100 text-gray-800';
}
