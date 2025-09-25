import React, { useState, useEffect } from 'react';
import { Bell, Search, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Medicine } from '../types/medicine';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [lowStockMedicines, setLowStockMedicines] = useState<Medicine[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const handleProfileClick = () => {
    navigate('/profile');
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Fetch low stock medicines
  useEffect(() => {
    const fetchLowStockMedicines = async () => {
      if (!user) return;
      
      try {
        setIsLoadingNotifications(true);
        const response = await fetch('/api/medicaments');
        if (response.ok) {
          const medicines: Medicine[] = await response.json();
          // Filter medicines with low stock (qteStock <= qteMinimum)
          const lowStock = medicines.filter(med => med.qteStock <= med.qteMinimum);
          setLowStockMedicines(lowStock);
        }
      } catch (error) {
        console.error('Failed to fetch low stock medicines:', error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    fetchLowStockMedicines();
    // Refresh every 5 minutes
    const interval = setInterval(fetchLowStockMedicines, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search medicines, patients, or suppliers..."
              className="pl-10 pr-4 py-2 w-96 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              onClick={toggleNotifications}
              className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Bell className="w-6 h-6" />
              {lowStockMedicines.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    {lowStockMedicines.length > 9 ? '9+' : lowStockMedicines.length}
                  </span>
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                      <p className="text-xs text-gray-500">
                        {lowStockMedicines.length > 0 
                          ? `${lowStockMedicines.length} médicament(s) en stock faible`
                          : 'Aucune notification'
                        }
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const fetchLowStockMedicines = async () => {
                          try {
                            setIsLoadingNotifications(true);
                            const response = await fetch('/api/medicaments');
                            if (response.ok) {
                              const medicines: Medicine[] = await response.json();
                              const lowStock = medicines.filter(med => med.qteStock <= med.qteMinimum);
                              setLowStockMedicines(lowStock);
                            }
                          } catch (error) {
                            console.error('Failed to fetch low stock medicines:', error);
                          } finally {
                            setIsLoadingNotifications(false);
                          }
                        };
                        fetchLowStockMedicines();
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Actualiser"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {isLoadingNotifications ? (
                  <div className="px-4 py-3 text-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-xs text-gray-500 mt-1">Chargement...</p>
                  </div>
                ) : lowStockMedicines.length > 0 ? (
                  <div className="space-y-1">
                    {lowStockMedicines.map((medicine) => (
                      <div key={medicine.id} className="px-4 py-2 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {medicine.nomMedicament}
                            </p>
                            <p className="text-xs text-gray-500">
                              Stock: {medicine.qteStock} / Minimum: {medicine.qteMinimum}
                            </p>
                          </div>
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Faible
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-center text-sm text-gray-500">
                    Aucun médicament en stock faible
                  </div>
                )}
                
                {lowStockMedicines.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-200">
                    <button
                      onClick={() => {
                        navigate('/medicines');
                        setShowNotifications(false);
                      }}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Voir tous les médicaments
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="relative">
            <button 
              onClick={toggleProfileMenu}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm text-left">
                <p className="font-medium text-gray-700">{user ? `${user.prenom} ${user.nom}` : 'User'}</p>
                <p className="text-gray-500 capitalize">{user?.role || 'Unknown'}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={handleProfileClick}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>View Profile</span>
                </button>
                <button
                  onClick={handleProfileClick}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
                <hr className="my-2 border-gray-200" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Click outside to close dropdowns */}
      {(showProfileMenu || showNotifications) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowProfileMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;