import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import RoleSelection from './pages/RoleSelection';
import Dashboard from './pages/Dashboard';
import Costumes from './pages/Costumes';
import Customers from './pages/Customers';
import Rentals from './pages/Rentals';
import Blacklist from './pages/Blacklist';
import Reminders from './pages/Reminders';
import SallesDashboard from './pages/salles/SallesDashboard';
import SalesItems from './pages/salles/SalesItems';
import DailySales from './pages/salles/DailySales';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/role-selection"
            element={
              <ProtectedRoute>
                <RoleSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/costumes"
            element={
              <ProtectedRoute>
                <Costumes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rentals"
            element={
              <ProtectedRoute>
                <Rentals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blacklist"
            element={
              <ProtectedRoute>
                <Blacklist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reminders"
            element={
              <ProtectedRoute>
                <Reminders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salles/dashboard"
            element={
              <ProtectedRoute>
                <SallesDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salles/items"
            element={
              <ProtectedRoute>
                <SalesItems />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salles/sales"
            element={
              <ProtectedRoute>
                <DailySales />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/role-selection" replace />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
