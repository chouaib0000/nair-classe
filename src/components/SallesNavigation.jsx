import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package,
  LogOut,
  Globe,
  Menu,
  X,
  ArrowLeft
} from 'lucide-react';
import Swal from 'sweetalert2';

function SallesNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const result = await Swal.fire({
      title: 'Déconnexion?',
      text: "Êtes-vous sûr de vouloir vous déconnecter?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, déconnecter'
    });

    if (result.isConfirmed) {
      await signOut();
      navigate('/login');
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const navItems = [
    { path: '/salles/dashboard', icon: LayoutDashboard, label: 'Tableau de Bord' },
    { path: '/salles/items', icon: Package, label: 'Articles' },
    { path: '/salles/sales', icon: ShoppingCart, label: 'Ventes' },
  ];

  return (
    <nav className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center space-x-3 sm:space-x-8">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <img 
                src="https://content-studio.biela.dev/content-studio/6917a86d5963993942011e9c/1763158137547-6917a86d5963993942011e9c/1763284260164.jpeg" 
                alt="NAIR CLASSE Logo" 
                className="h-10 w-auto sm:h-12"
              />
            </div>
            <div className="hidden lg:flex space-x-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-600 shadow-sm'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-green-600'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex items-center space-x-3">
            <button
              onClick={() => navigate('/role-selection')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-neutral-600 hover:bg-neutral-50 hover:text-green-600 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Retour</span>
            </button>
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-neutral-600 hover:bg-neutral-50 hover:text-green-600 transition-all duration-200"
            >
              <Globe className="w-5 h-5" />
              <span className="font-semibold">{language === 'fr' ? 'FR' : 'EN'}</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Déconnexion</span>
            </button>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center p-2 rounded-xl text-neutral-600 hover:bg-neutral-50 hover:text-green-600 transition-all duration-200"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-neutral-200">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-600 shadow-sm'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-green-600'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <div className="pt-3 border-t border-neutral-200 mt-3 space-y-2">
                <button
                  onClick={() => navigate('/role-selection')}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-neutral-600 hover:bg-neutral-50 hover:text-green-600 transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-semibold">Retour aux Modules</span>
                </button>
                <button
                  onClick={toggleLanguage}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-neutral-600 hover:bg-neutral-50 hover:text-green-600 transition-all duration-200"
                >
                  <Globe className="w-5 h-5" />
                  <span className="font-semibold">{language === 'fr' ? 'FR' : 'EN'}</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default SallesNavigation;
