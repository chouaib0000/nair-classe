import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import SallesNavigation from '../../components/SallesNavigation';
import { useLanguage } from '../../context/LanguageContext';
import { ShoppingCart, TrendingUp, DollarSign, Package, Eye } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import Swal from 'sweetalert2';

function SallesDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    monthlyEarnings: [],
    monthlyEarnings: [],
  });

  useEffect(() => {
    fetchStats();
    fetchMonthlyEarnings();
  }, []);

  const fetchStats = async () => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const [todaySales, monthSales, items] = await Promise.all([
      supabase
        .from('daily_sales')
        .select('*')
        .gte('sale_date', todayStart.toISOString())
        .lte('sale_date', todayEnd.toISOString()),
      supabase
        .from('daily_sales')
        .select('*')
        .gte('sale_date', monthStart.toISOString())
        .lte('sale_date', monthEnd.toISOString()),
      supabase.from('sales_items').select('*', { count: 'exact' }),
    ]);

    const todayRevenue = todaySales.data?.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0) || 0;
    const monthRevenue = monthSales.data?.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0) || 0;

    setStats({
      todaySales: todaySales.data?.length || 0,
      todayRevenue,
      monthRevenue,
      totalItems: items.count || 0,
    });
  };

  const fetchMonthlyEarnings = async () => {
    const twelveMonthsAgo = subMonths(new Date(), 11);
    
    const { data: sales, error } = await supabase
      .from('daily_sales')
      .select('total_amount, sale_date')
      .gte('sale_date', twelveMonthsAgo.toISOString());

    if (!error && sales) {
      const months = eachMonthOfInterval({
        start: twelveMonthsAgo,
        end: new Date()
      });

      const earningsByMonth = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const monthSales = sales.filter(sale => {
          const saleDate = new Date(sale.sale_date);
          return saleDate >= monthStart && saleDate <= monthEnd;
        });

        const totalEarnings = monthSales.reduce((sum, sale) => {
          return sum + (parseFloat(sale.total_amount) || 0);
        }, 0);

        return {
          month: format(month, 'MMMM yyyy', { locale: fr }),
          monthShort: format(month, 'MMM', { locale: fr }),
          earnings: totalEarnings,
          count: monthSales.length
        };
      });

      setStats(prev => ({ ...prev, monthlyEarnings: earningsByMonth }));
    }
  };

  const totalEarnings = (stats.monthlyEarnings || []).reduce((sum, month) => sum + month.earnings, 0);
  const currentMonthEarnings = (stats.monthlyEarnings || []).length > 0 ? stats.monthlyEarnings[stats.monthlyEarnings.length - 1].earnings : 0;

  const viewDailyBreakdown = async (monthData) => {
    const monthStart = startOfMonth(new Date(monthData.month));
    const monthEnd = endOfMonth(new Date(monthData.month));

    const { data: dailySales, error } = await supabase
      .from('daily_sales')
      .select('total_amount, sale_date')
      .gte('sale_date', monthStart.toISOString())
      .lte('sale_date', monthEnd.toISOString());

    if (error) {
      Swal.fire('Erreur', 'Impossible de charger les détails quotidiens', 'error');
      return;
    }

    const dailyBreakdown = {};
    dailySales.forEach(sale => {
      const day = format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: fr });
      if (!dailyBreakdown[day]) {
        dailyBreakdown[day] = 0;
      }
      dailyBreakdown[day] += parseFloat(sale.total_amount) || 0;
    });

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
      confirmButtonColor: '#16a34a'
    });
  };

  const statCards = [
    {
      icon: ShoppingCart,
      label: "Ventes Aujourd'hui",
      value: stats.todaySales,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: DollarSign,
      label: "Revenus du Jour",
      value: `${stats.todayRevenue.toFixed(2)} DH`,
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: TrendingUp,
      label: 'Revenus du Mois',
      value: `${stats.monthRevenue.toFixed(2)} DH`,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: Package,
      label: 'Articles en Stock',
      value: stats.totalItems,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      <SallesNavigation />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
            Tableau de Bord - Salles
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-neutral-600">
            Aperçu de vos ventes quotidiennes
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="group bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-4 sm:p-6 border border-neutral-100 hover:border-green-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mt-2 sm:mt-3">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                >
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
            {(stats.monthlyEarnings || []).map((monthData, index) => {
              const isCurrentMonth = index === (stats.monthlyEarnings || []).length - 1;
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
                    {monthData.count} vente{monthData.count !== 1 ? 's' : ''}
                  </p>
                </div>
              );
            })}
          </div>

          {(!stats.monthlyEarnings || stats.monthlyEarnings.length === 0) && (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600">Aucune donnée de revenus disponible</p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">Bienvenue dans Salles!</h2>
            </div>
            <p className="text-green-50 leading-relaxed text-sm sm:text-base lg:text-lg">
              Gérez vos ventes quotidiennes, suivez vos revenus et maintenez votre inventaire de produits avec facilité.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SallesDashboard;