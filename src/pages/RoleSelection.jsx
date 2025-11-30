import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ShoppingCart, Calendar, TrendingUp, Users } from 'lucide-react';

function RoleSelection() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const modules = [
    {
      id: 'gestion-rent',
      title: 'Gestion Rent',
      description: 'Système complet de gestion de location de costumes',
      icon: Calendar,
      color: 'from-blue-600 to-blue-700',
      hoverColor: 'hover:from-blue-700 hover:to-blue-800',
      features: ['Locations', 'Clients', 'Costumes', 'Liste Noire', 'Rappels'],
      path: '/dashboard'
    },
    {
      id: 'salles',
      title: 'Sales',
      description: 'Suivi des ventes quotidiennes et gestion des revenus',
      icon: ShoppingCart,
      color: 'from-green-600 to-green-700',
      hoverColor: 'hover:from-green-700 hover:to-green-800',
      features: ['Ventes du Jour', 'Revenus', 'Stock', 'Statistiques'],
      path: '/salles/dashboard'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <img 
            src="https://content-studio.biela.dev/content-studio/6917a86d5963993942011e9c/1763158137547-6917a86d5963993942011e9c/1763284260164.jpeg" 
            alt="NAIR CLASSE Logo" 
            className="h-24 w-auto mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-3">
            Choisissez Votre Module
          </h1>
          <p className="text-lg text-neutral-600">
            Sélectionnez le module que vous souhaitez utiliser
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {modules.map((module) => (
            <div
              key={module.id}
              onClick={() => navigate(module.path)}
              className="group bg-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer overflow-hidden border border-neutral-100 hover:border-primary-200 hover:-translate-y-2"
            >
              <div className={`bg-gradient-to-r ${module.color} ${module.hoverColor} p-8 transition-all duration-300`}>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <module.icon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">{module.title}</h2>
                </div>
                <p className="text-white/90 text-lg">{module.description}</p>
              </div>

              <div className="p-8">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">
                  Fonctionnalités Principales
                </h3>
                <ul className="space-y-3">
                  {module.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      <span className="text-neutral-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className="mt-8 w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl font-bold hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                  Accéder au Module
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RoleSelection;
