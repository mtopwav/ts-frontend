import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Login from './login';
import OfflineBanner from './components/OfflineBanner';

import AdminDashboard from './pages/admin/dashboard';
import AdminCategoriesBrands from './pages/admin/categories&brands';
import AdminSpareParts from './pages/admin/spareparts';
import AdminSales from './pages/admin/sales';
import AdminEmployees from './pages/admin/employees';
import AdminTransactions from './pages/admin/transactions';
import AdminReports from './pages/admin/reports';
import AdminSettings from './pages/admin/setting';
import AdminFinances from './pages/admin/finances';
import AdminMessages from './pages/admin/messages';

import ManagerDashboard from './pages/geita/dashboard';
import ManagerSpareparts from './pages/geita/spareparts';
import ManagerCustomersInfo from './pages/geita/customersInfo';
import ManagerGenerateSales from './pages/geita/generateSales';
import ManagerTransactions from './pages/geita/transactions';
import ManagerLoans from './pages/geita/loans';
import ManagerReports from './pages/geita/reports';
import ManagerMessages from './pages/geita/messages';
import ManagerSales from './pages/geita/sales';

import BomaDashboard from './pages/boma/dashboard';
import BomaSpareparts from './pages/boma/spareparts';
import BomaCustomersInfo from './pages/boma/customersInfo';
import BomaGenerateSales from './pages/boma/generateSales';
import BomaTransactions from './pages/boma/transactions';
import BomaLoans from './pages/boma/loans';
import BomaReports from './pages/boma/reports';
import BomaMessages from './pages/boma/messages';
import BomaSales from './pages/boma/sales';

import { getCurrentLanguage } from './utils/translations';
import './App.css';

function App() {
  useEffect(() => {
    document.documentElement.lang = getCurrentLanguage();
  }, []);

  return (
    <BrowserRouter>
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/categories-brands" element={<AdminCategoriesBrands />} />
        <Route path="/admin/spareparts" element={<AdminSpareParts />} />
        <Route path="/admin/sales" element={<AdminSales />} />
        <Route path="/admin/employees" element={<AdminEmployees />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/finances" element={<AdminFinances />} />
        <Route path="/admin/messages" element={<AdminMessages />} />

        <Route path="/geita" element={<Navigate to="/geita/dashboard" replace />} />
        <Route path="/geita/dashboard" element={<ManagerDashboard />} />
        <Route path="/geita/spareparts" element={<ManagerSpareparts />} />
        <Route path="/geita/customers-info" element={<ManagerCustomersInfo />} />
        <Route path="/geita/generate-sales" element={<ManagerGenerateSales />} />
        <Route path="/geita/transactions" element={<ManagerTransactions />} />
        <Route path="/geita/loans" element={<ManagerLoans />} />
        <Route path="/geita/reports" element={<ManagerReports />} />
        <Route path="/geita/messages" element={<ManagerMessages />} />
        <Route path="/geita/sales" element={<ManagerSales />} />

        <Route path="/boma" element={<Navigate to="/boma/dashboard" replace />} />
        <Route path="/boma/dashboard" element={<BomaDashboard />} />
        <Route path="/boma/spareparts" element={<BomaSpareparts />} />
        <Route path="/boma/customers-info" element={<BomaCustomersInfo />} />
        <Route path="/boma/generate-sales" element={<BomaGenerateSales />} />
        <Route path="/boma/transactions" element={<BomaTransactions />} />
        <Route path="/boma/loans" element={<BomaLoans />} />
        <Route path="/boma/reports" element={<BomaReports />} />
        <Route path="/boma/messages" element={<BomaMessages />} />
        <Route path="/boma/sales" element={<BomaSales />} />

        <Route path="/finance/accountant/dashboard" element={<Navigate to="/admin/finances" replace />} />
        <Route path="/finance/cashier/dashboard" element={<Navigate to="/admin/finances" replace />} />
        <Route path="/sales/dashboard" element={<Navigate to="/geita/dashboard" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
