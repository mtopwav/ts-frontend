import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaChartLine,
  FaBox,
  FaUsers,
  FaFileInvoice,
  FaReceipt,
  FaMoneyBillWave,
  FaWallet,
  FaChartBar,
} from 'react-icons/fa';
import logo from '../../../images/logo.png';
import { bomaLabels } from '../bomaLabels';
import { useTranslation } from '../../../utils/useTranslation';
import { BRAND_NAME, BRAND_LOGO_ALT } from '../../../utils/brand';

const NAV_ITEMS = [
  { to: '/boma/dashboard', Icon: FaChartLine, labelKey: 'dashboard' },
  { to: '/boma/spareparts', Icon: FaBox, labelKey: 'spareParts' },
  { to: '/boma/customers-info', Icon: FaUsers, labelKey: 'customerInfo' },
  { to: '/boma/generate-sales', Icon: FaFileInvoice, labelKey: 'generateSales' },
  { to: '/boma/transactions', Icon: FaReceipt, labelKey: 'transactions' },
  { to: '/boma/loans', Icon: FaMoneyBillWave, labelKey: 'loans' },
  { to: '/boma/expenses', Icon: FaWallet, labelKey: 'expenses' },
  { to: '/boma/reports', Icon: FaChartBar, labelKey: 'reports' },
];

function navLabel(t, key) {
  const map = {
    dashboard: t.dashboard,
    spareParts: t.spareParts,
    customerInfo: t.customerInfo,
    generateSales: t.generateSales,
    transactions: t.transactions,
    loans: t.loans,
    expenses: t.expenses,
    reports: t.reports,
  };
  return map[key] || t[key] || key;
}

export default function BomaSidebar({ sidebarOpen, isMobile, onNavClick }) {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <img src={logo} alt={BRAND_LOGO_ALT} className="sidebar-logo" />
        <div className="boma-sidebar-brand">
          <span className="sidebar-title">{bomaLabels.sidebarTitle}</span>
          <span className="boma-sidebar-tagline">{BRAND_NAME}</span>
        </div>
      </div>
      <nav className="sidebar-nav" onClick={isMobile ? onNavClick : undefined}>
        {NAV_ITEMS.map(({ to, Icon, labelKey }) => (
          <Link
            key={to}
            to={to}
            className={`nav-item${location.pathname === to ? ' active' : ''}`}
          >
            <Icon className="nav-icon" aria-hidden />
            <span>{navLabel(t, labelKey)}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
