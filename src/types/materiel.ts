export enum CategorieMateriels {
  EQUIPEMENT_MEDICAL = 'EQUIPEMENT_MEDICAL',
  MATERIEL_JETABLE = 'MATERIEL_JETABLE',
  MATERIEL_HYGIENE = 'MATERIEL_HYGIENE',
  MATERIEL_DIAGNOSTIC = 'MATERIEL_DIAGNOSTIC',
  MATERIEL_PROTECTION = 'MATERIEL_PROTECTION',
  MATERIEL_URGENCE = 'MATERIEL_URGENCE',
  FOURNITURE_BUREAU = 'FOURNITURE_BUREAU',
  AUTRE = 'AUTRE'
}

export enum Unite {
  UNITE = 'UNITE',
  BOITE = 'BOITE',
  PAQUET = 'PAQUET',
  CARTON = 'CARTON',
  LITRE = 'LITRE',
  ML = 'ML',
  GRAMME = 'GRAMME',
  KG = 'KG',
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
    [CategorieMateriels.EQUIPEMENT_MEDICAL]: 'Équipement médical',
    [CategorieMateriels.MATERIEL_JETABLE]: 'Matériel jetable',
    [CategorieMateriels.MATERIEL_HYGIENE]: 'Matériel d\'hygiène',
    [CategorieMateriels.MATERIEL_DIAGNOSTIC]: 'Matériel de diagnostic',
    [CategorieMateriels.MATERIEL_PROTECTION]: 'Matériel de protection',
    [CategorieMateriels.MATERIEL_URGENCE]: 'Matériel d\'urgence',
    [CategorieMateriels.FOURNITURE_BUREAU]: 'Fourniture de bureau',
    [CategorieMateriels.AUTRE]: 'Autre'
  };
  return names[categorie] || categorie;
}

// Helper function to get unit display name
export function getUniteDisplayName(unite: Unite): string {
  const names = {
    [Unite.UNITE]: 'Unité',
    [Unite.BOITE]: 'Boîte',
    [Unite.PAQUET]: 'Paquet',
    [Unite.CARTON]: 'Carton',
    [Unite.LITRE]: 'Litre',
    [Unite.ML]: 'ml',
    [Unite.GRAMME]: 'g',
    [Unite.KG]: 'kg',
    [Unite.AUTRE]: 'Autre'
  };
  return names[unite] || unite;
}

// Helper function to get category color classes
export function getCategorieBadgeColors(categorie: CategorieMateriels): string {
  const colors = {
    [CategorieMateriels.EQUIPEMENT_MEDICAL]: 'bg-blue-100 text-blue-800',
    [CategorieMateriels.MATERIEL_JETABLE]: 'bg-green-100 text-green-800',
    [CategorieMateriels.MATERIEL_HYGIENE]: 'bg-purple-100 text-purple-800',
    [CategorieMateriels.MATERIEL_DIAGNOSTIC]: 'bg-yellow-100 text-yellow-800',
    [CategorieMateriels.MATERIEL_PROTECTION]: 'bg-orange-100 text-orange-800',
    [CategorieMateriels.MATERIEL_URGENCE]: 'bg-red-100 text-red-800',
    [CategorieMateriels.FOURNITURE_BUREAU]: 'bg-indigo-100 text-indigo-800',
    [CategorieMateriels.AUTRE]: 'bg-gray-100 text-gray-800'
  };
  return colors[categorie] || 'bg-gray-100 text-gray-800';
}
