import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserStatus, isValidRole } from '../types/roles';

interface User {
  id: number;
  nom: string;
  prenom: string;
  username: string;
  passwd: string;
  role: UserRole;
  specialite: string;
  telephone: string;
  email: string;
  status: UserStatus;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isMedecin: () => boolean;
  isInfirmier: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/personnels/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, passwd: password })
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Invalid username or password' };
        } else if (response.status === 500) {
          return { success: false, error: 'Server error. Please try again later.' };
        } else {
          return { success: false, error: `Login failed with status: ${response.status}` };
        }
      }

      const userData = await response.json();
      
      // Validate that the role from backend is valid
      if (!isValidRole(userData.role)) {
        console.error('Invalid role received from backend:', userData.role);
        return { success: false, error: 'Invalid user role received from server' };
      }
      
      // Don't store password in localStorage
      const userToStore = { ...userData, passwd: null };
      
      setUser(userToStore);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userToStore));
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'An unexpected error occurred during login.' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Build payload and omit passwd when not provided/empty to avoid nulling it server-side
      const payload: any = { ...user, ...userData };
      if (!userData.passwd || userData.passwd.toString().trim() === '') {
        delete payload.passwd;
      }

      const response = await fetch(`/api/personnels/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Profile update failed');
      }

      const updatedUser = await response.json();
      const userToStore = { ...updatedUser, passwd: null };
      
      setUser(userToStore);
      localStorage.setItem('user', JSON.stringify(userToStore));
      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    }
  };

  const hasRole = (role: UserRole) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]) => {
    return roles.some(role => hasRole(role));
  };

  const isAdmin = () => {
    return hasRole(UserRole.ADMIN);
  };

  const isMedecin = () => {
    return hasRole(UserRole.MEDECIN);
  };

  const isInfirmier = () => {
    return hasRole(UserRole.INFIRMIER);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateProfile, hasRole, hasAnyRole, isAdmin, isMedecin, isInfirmier }}>
      {children}
    </AuthContext.Provider>
  );
};