import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';
import { useLanguage } from '../context/LanguageContext';
import { ShoppingBag, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Calendar, Package } from 'lucide-react';
import { TrendingDown, DollarSign, Eye } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

import Swal from 'sweetalert2';

function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalCostumes: 0,
    availableCostumes: 0,
    totalCustomers: 0,
    activeRentals: 0,
    totalDailyRevenue: 0,
  });
  const [monthlyEarnings, setMonthlyEarnings] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchMonthlyEarnings();
  }, []);

  const fetchStats = async () => {
    const [costumes, customers, rentals] = await Promise.all([
      supabase.from('costumes').select('*', { count: 'exact' }),
      supabase.from('customers').select('*', { count: 'exact' }),
      supabase.from('rentals').select('*', { count: 'exact' }).eq('status', 'active'),
    ]);

    const availableCostumes = costumes.data?.reduce((total, c) => {
      return total + (c.available_quantity || 0);
    }, 0) || 0;

    setStats({
      totalCostumes: costumes.count || 0,
      availableCostumes,
      totalCustomers: customers.count || 0,
      activeRentals: rentals.count || 0,
    });
  };

  const fetchMonthlyEarnings = async () => {
    // Get rentals from the last 12 months
    const twelveMonthsAgo = subMonths(new Date(), 11);
    
    const { data: rentals, error } = await supabase
      .from('rentals')
      .select('price, actual_return_date, status')
      .eq('status', 'returned')
      .gte('actual_return_date', twelveMonthsAgo.toISOString());

    if (!error && rentals) {
      // Generate array of last 12 months
      const months = eachMonthOfInterval({
        start: twelveMonthsAgo,
        end: new Date()
      });

      // Calculate earnings for each month
      const earningsByMonth = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const monthRentals = rentals.filter(rental => {
          const returnDate = new Date(rental.actual_return_date);
          return returnDate >= monthStart && returnDate <= monthEnd;
        });

        const totalEarnings = monthRentals.reduce((sum, rental) => {
          return sum + (parseFloat(rental.price) || 0);
        }, 0);

        return {
          month: format(month, 'MMMM yyyy', { locale: fr }),
          monthShort: format(month, 'MMM', { locale: fr }),
          earnings: totalEarnings,
          count: monthRentals.length
        };
      });

      setMonthlyEarnings(earningsByMonth);

      // Fetch total daily revenue (from rentals when payment is made upfront)
      const { data: allRentals, error: allRentalsError } = await supabase
        .from('rentals')
        .select('price, rental_date, payment_status')
        .eq('payment_status', 'completed');

      if (!allRentalsError && allRentals) {
        const totalDailyRevenue = allRentals.reduce((sum, rental) => {
          return sum + (parseFloat(rental.price) || 0);
        }, 0);
        setStats(prev => ({ ...prev, totalDailyRevenue }));
      }
    }
  };

  const viewDailyBreakdown = async (monthData) => {
    const monthStart = startOfMonth(new Date(monthData.month));
    const monthEnd = endOfMonth(new Date(monthData.month));

    const { data: dailyRentals, error } = await supabase
      .from('rentals')
      .select('price, actual_return_date, status')
      .eq('status', 'returned')
      .gte('actual_return_date', monthStart.toISOString())
      .lte('actual_return_date', monthEnd.toISOString());

    if (error) {
      Swal.fire('Erreur', 'Impossible de charger les détails quotidiens', 'error');
      return;
    }

    // Group by day
    const dailyBreakdown = {};
    dailyRentals.forEach(rental => {
      const day = format(new Date(rental.actual_return_date), 'dd/MM/yyyy', { locale: fr });
      if (!dailyBreakdown[day]) {
        dailyBreakdown[day] = 0;
      }
      dailyBreakdown[day] += parseFloat(rental.price) || 0;
    });

    // Create HTML table
    const tableRows = Object.entries(dailyBreakdown)
      .sort((a, b) => new Date(a[0].split('/').reverse().join('-')) - new Date(b[0].split('/').reverse().join('-')))
      .map(([day, amount]) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${day}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #16a34a;">${amount.toFixed(2)} DH</td>
        </tr>
      `).join('');

    Swal.fire({
      title: `Détails Quotidiens - ${monthData.month}`,
      html: `
        <div style="max-height: 400px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead style="position: sticky; top: 0; background: white;">
              <tr>
                <th style="padding: 12px; border-bottom: 2px solid #d1d5db; text-align: left;">Date</th>
                <th style="padding: 12px; border-bottom: 2px solid #d1d5db; text-align: left;">Revenus</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      `,
      width: '600px',
      confirmButtonText: 'Fermer',
      confirmButtonColor: '#2563eb'
    });
  };

  const statCards = [
    {
      icon: ShoppingBag,
      label: t('totalCostumes'),
      value: stats.totalCostumes,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: TrendingUp,
      label: t('available'),
      value: stats.availableCostumes,
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: Users,
      label: t('totalCustomers'),
      value: stats.totalCustomers,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: AlertCircle,
      label: t('activeRentals'),
      value: stats.activeRentals,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      icon: DollarSign,
      label: 'Revenus Quotidiens Total',
      value: `${stats.totalDailyRevenue.toFixed(2)} DH`,
      color: 'bg-emerald-100 text-emerald-600',
    },
  ];

  const totalEarnings = monthlyEarnings.reduce((sum, month) => sum + month.earnings, 0);
  const currentMonthEarnings = monthlyEarnings.length > 0 ? monthlyEarnings[monthlyEarnings.length - 1].earnings : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      <Navigation />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">{t('dashboardTitle')}</h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-neutral-600">{t('dashboardSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {statCards.map((stat, index) => (
            <div key={index} className="group bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-4 sm:p-6 border border-neutral-100 hover:border-primary-200 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mt-2 sm:mt-3">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-neutral-100 p-4 sm:p-6 lg:p-10 mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900">Revenus Mensuels</h3>
              <p className="text-xs sm:text-sm lg:text-base text-neutral-600 mt-1 sm:mt-2">Suivi des revenus des 12 derniers mois</p>
            </div>
            <div className="text-right">
              <p className="text-xs sm:text-sm font-semibold text-neutral-500 uppercase tracking-wide">Total Cumulé</p>
              <p className="text-xl sm:text-2xl lg:text-4xl font-bold text-green-600 mt-1">{totalEarnings.toFixed(2)} DH</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {monthlyEarnings.map((monthData, index) => {
              const isCurrentMonth = index === monthlyEarnings.length - 1;
              return (
                <div
                  onClick={() => viewDailyBreakdown(monthData)}
                  key={index}
                  className={`p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
                    isCurrentMonth
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                      : 'bg-neutral-50 border-neutral-200 hover:border-green-200'
                  }`}
                  title="Cliquez pour voir les détails quotidiens"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                      isCurrentMonth ? 'bg-green-200' : 'bg-neutral-200'
                    }`}>
                      <Eye className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        isCurrentMonth ? 'text-green-700' : 'text-neutral-600'
                      }`} />
                    </div>
                    {isCurrentMonth && (
                      <span className="px-2 py-0.5 sm:py-1 bg-green-600 text-white text-xs font-bold rounded-full uppercase">
                        Actuel
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                    {monthData.month}
                  </p>
                  <p className={`text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2 ${
                    isCurrentMonth ? 'text-green-700' : 'text-neutral-900'
                  }`}>
                    {monthData.earnings.toFixed(2)} DH
                  </p>
                  <p className="text-xs text-neutral-500 mt-2">
                    {monthData.count} location{monthData.count !== 1 ? 's' : ''}
                  </p>
                </div>
              );
            })}
          </div>

          {monthlyEarnings.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600">Aucune donnée de revenus disponible</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold">{t('welcome')}</h2>
              </div>
              <p className="text-primary-50 leading-relaxed text-sm sm:text-base lg:text-lg">
                {t('welcomeMessage')}
              </p>
              <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-5 hover:bg-white/20 transition-colors">
                  <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                    <Calendar className="w-4 h-4 sm:w-6 sm:h-6" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">Aujourd'hui</span>
                  </div>
                  <p className="text-base sm:text-xl lg:text-2xl font-bold mt-1">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-5 hover:bg-white/20 transition-colors">
                  <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                    <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">Activité</span>
                  </div>
                  <p className="text-base sm:text-xl lg:text-2xl font-bold mt-1">+{stats.activeRentals}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-neutral-100 p-6 sm:p-8 lg:p-10">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 mb-6 sm:mb-8">Aperçu Rapide</h3>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-neutral-500 font-semibold">Costumes</p>
                    <p className="text-base sm:text-lg lg:text-xl font-bold text-neutral-900">{stats.totalCostumes} total</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.availableCostumes}</p>
                  <p className="text-xs text-neutral-500 font-semibold uppercase">disponibles</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-neutral-500 font-semibold">Clients</p>
                    <p className="text-base sm:text-lg lg:text-xl font-bold text-neutral-900">{stats.totalCustomers} total</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-700" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-neutral-500 font-semibold">Locations Actives</p>
                    <p className="text-base sm:text-lg lg:text-xl font-bold text-neutral-900">{stats.activeRentals} en cours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
