export enum UserRole {
  ADMIN = 'ADMIN',
  MEDECIN = 'MEDECIN',
  INFIRMIER = 'INFIRMIER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  STUDENT = 'STUDENT',
  DSA = 'DSA'
}

// Type for user status
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED'
}

// Type guard function to check if a string is a valid role
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

// Helper function to get role display name
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrator';
    case UserRole.MEDECIN:
      return 'Doctor';
    case UserRole.INFIRMIER:
      return 'Nurse';
    case UserRole.SUPER_ADMIN:
      return 'Super Admin';
    case UserRole.STUDENT:
      return 'Student';
    case UserRole.DSA:
      return 'DSA';
    default:
      return 'Unknown';
  }
}

// Helper function to get role color classes
export function getRoleBadgeColors(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'bg-purple-100 text-purple-800';
    case UserRole.MEDECIN:
      return 'bg-blue-100 text-blue-800';
    case UserRole.INFIRMIER:
      return 'bg-green-100 text-green-800';
    case UserRole.SUPER_ADMIN:
      return 'bg-red-100 text-red-800';
    case UserRole.STUDENT:
      return 'bg-teal-100 text-teal-800';
    case UserRole.DSA:
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
