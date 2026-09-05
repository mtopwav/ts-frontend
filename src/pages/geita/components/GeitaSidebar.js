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
import { geitaLabels } from '../geitaLabels';
import { useTranslation } from '../../../utils/useTranslation';
import { BRAND_NAME, BRAND_LOGO_ALT } from '../../../utils/brand';

const NAV_ITEMS = [
  { to: '/geita/dashboard', Icon: FaChartLine, labelKey: 'dashboard' },
  { to: '/geita/spareparts', Icon: FaBox, labelKey: 'spareParts' },
  { to: '/geita/customers-info', Icon: FaUsers, labelKey: 'customerInfo' },
  { to: '/geita/generate-sales', Icon: FaFileInvoice, labelKey: 'generateSales' },
  { to: '/geita/transactions', Icon: FaReceipt, labelKey: 'transactions' },
  { to: '/geita/loans', Icon: FaMoneyBillWave, labelKey: 'loans' },
  { to: '/geita/expenses', Icon: FaWallet, labelKey: 'expenses' },
  { to: '/geita/reports', Icon: FaChartBar, labelKey: 'reports' },
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

export default function GeitaSidebar({ sidebarOpen, isMobile, onNavClick }) {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <img src={logo} alt={BRAND_LOGO_ALT} className="sidebar-logo" />
        <div className="geita-sidebar-brand">
          <span className="sidebar-title">{geitaLabels.sidebarTitle}</span>
          <span className="geita-sidebar-tagline">{BRAND_NAME}</span>
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
