// Material categories matching backend
export enum CategorieMateriels {
  MEDICAL = 'MEDICAL',
  DISPOSABLE = 'DISPOSABLE',
  SUPPLIES = 'SUPPLIES',
  EQUIPMENT = 'EQUIPMENT',
  INSTRUMENTS = 'INSTRUMENTS',
  PROTECTION = 'PROTECTION',
  HYGIENE = 'HYGIENE',
  OTHER = 'OTHER'
}

// Material status
export enum MaterialStatus {
  AVAILABLE = 'AVAILABLE',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  ASSIGNED = 'ASSIGNED'
}

// Material interface matching MaterialRequest from backend
export interface Materiel {
  id?: number;
  patientId?: number; // For assigned materials
  name: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  supplierId?: number; // Supplier ID
  status?: string;
}

// Supplier interface
export interface Supplier {
  id: number;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
}

// Helper function to get category display name
export function getCategorieDisplayName(categorie: string): string {
  const names: Record<string, string> = {
    'MEDICAL': 'Matériel médical',
    'DISPOSABLE': 'Matériel jetable',
    'SUPPLIES': 'Fournitures',
    'EQUIPMENT': 'Équipement',
    'INSTRUMENTS': 'Instruments',
    'PROTECTION': 'Protection',
    'HYGIENE': 'Hygiène',
    'OTHER': 'Autre'
  };
  return names[categorie] || categorie;
}

// Helper function to get category color classes
export function getCategorieBadgeColors(categorie: string): string {
  const colors: Record<string, string> = {
    'MEDICAL': 'bg-blue-100 text-blue-800',
    'DISPOSABLE': 'bg-red-100 text-red-800',
    'SUPPLIES': 'bg-green-100 text-green-800',
    'EQUIPMENT': 'bg-yellow-100 text-yellow-800',
    'INSTRUMENTS': 'bg-purple-100 text-purple-800',
    'PROTECTION': 'bg-orange-100 text-orange-800',
    'HYGIENE': 'bg-indigo-100 text-indigo-800',
    'OTHER': 'bg-gray-100 text-gray-800'
  };
  return colors[categorie] || 'bg-gray-100 text-gray-800';
}

// Helper function to get status color
export function getStatusBadgeColors(status: string): string {
  const colors: Record<string, string> = {
    'AVAILABLE': 'bg-green-100 text-green-800',
    'LOW_STOCK': 'bg-yellow-100 text-yellow-800',
    'OUT_OF_STOCK': 'bg-red-100 text-red-800',
    'ASSIGNED': 'bg-blue-100 text-blue-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// Helper function to get status display name
export function getStatusDisplayName(status: string): string {
  const names: Record<string, string> = {
    'AVAILABLE': 'Disponible',
    'LOW_STOCK': 'Stock faible',
    'OUT_OF_STOCK': 'Rupture',
    'ASSIGNED': 'Assigné'
  };
  return names[status] || status;
}
