import { colors } from '../../utils/colors';
import React, { useState, useEffect } from 'react';
import { useResponsiveSidebar } from '../../utils/useResponsiveSidebar';
import SidebarBackdrop from '../../components/SidebarBackdrop';
import { useNavigate, Link } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './manager-layout.css';
import './dashboard.css';
import { getPayments } from '../../services/api';
import { getCurrentDateTime } from '../../utils/dateTime';
import { useTranslation } from '../../utils/useTranslation';
import { canAccessBranch } from '../../utils/branchAuth';
import { BRANCH_BOMA } from '../../utils/branchLocations';
import { bomaLabels } from './bomaLabels';
import { capitalizeName } from './bomaUtils';
import BomaSidebar from './components/BomaSidebar';
import BomaPageHeader from './components/BomaPageHeader';
import { PageLoader } from '../../components/LoadingSpinner';

function ManagerDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const { sidebarOpen, isMobile, toggleSidebar, closeSidebar } = useResponsiveSidebar();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState(getCurrentDateTime());

  useEffect(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        if (!canAccessBranch(parsedUser, 'boma')) {
          setLoading(false);
          navigate('/login');
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setLoading(false);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
    } else {
      setLoading(false);
      setTimeout(() => navigate('/login'), 1000);
      return;
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const res = await getPayments({ location: BRANCH_BOMA });
        if (res.success && res.payments) setPayments(res.payments);
      } catch (err) {
        console.error('Error loading payments:', err);
      }
    };
    loadPayments();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentDateTime(getCurrentDateTime()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Logout',
      text: 'Are you sure you want to logout?',
      showCancelButton: true,
      confirmButtonColor: colors.error,
      cancelButtonColor: colors.textMuted,
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const formatPrice = (price) => {
    if (!price) return '0';
    return parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPayments = payments.filter((p) => {
    const d = new Date(p.created_at);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  const pendingApproval = todayPayments.filter((p) => {
    if (p.status === 'Rejected') return false;
    const total = Number(p.total_amount) || 0;
    const received = Number(p.amount_received) || 0;
    return total - received !== 0;
  }).length;
  const approvedToday = todayPayments.filter((p) => {
    if (p.status === 'Approved') return true;
    const total = Number(p.total_amount) || 0;
    const received = Number(p.amount_received) || 0;
    return p.status === 'Pending' && total - received === 0;
  }).length;
  const totalToday = todayPayments.length;

  const displayTransactions = todayPayments.slice(0, 15).map((p) => {
    const total = Number(p.total_amount) || 0;
    const received = Number(p.amount_received) || 0;
    const amountRemain = total - received;
    const displayStatus =
      p.status === 'Rejected'
        ? 'Rejected'
        : p.status === 'Approved' || amountRemain === 0
        ? 'Approved'
        : 'Pending';
    return { ...p, amountRemain, displayStatus };
  });

  const quickLinks = [
    { to: '/boma/transactions', label: t.transactions, desc: t.reviewApproveTransactions },
    { to: '/boma/loans', label: t.loans, desc: t.manageLoanApprovals },
    { to: '/boma/sales', label: t.sales, desc: t.salesOverview },
    { to: '/boma/spareparts', label: t.spareParts, desc: t.viewInventoryStock },
    { to: '/boma/reports', label: t.reports, desc: t.viewReportsAnalytics },
  ];

  if (loading) {
    return <PageLoader message={t.loading || 'Loading...'} />;
  }

  if (!user) return null;

  return (
    <div className="payments-container boma-portal">
      {isMobile && sidebarOpen ? <SidebarBackdrop onClose={closeSidebar} /> : null}
      <BomaSidebar
        sidebarOpen={sidebarOpen}
        isMobile={isMobile}
        onNavClick={closeSidebar}
      />
      <div className="main-content">
        <BomaPageHeader
          title={bomaLabels.pageTitles.dashboard}
          user={user}
          currentDateTime={currentDateTime}
          onToggleSidebar={toggleSidebar}
          onLogout={handleLogout}
        />
        <div className="payments-content manager-dashboard-content">
          <section className="manager-stats">
            <h3 className="manager-section-title">{t.todayOverview}</h3>
            <div className="stats-row manager-stats-row">
              <div className="stat-card manager-stat-card manager-stat-pending">
                <div className="stat-info">
                  <h3>{t.pendingApproval}</h3>
                  <p className="stat-value">{pendingApproval}</p>
                </div>
              </div>
              <div className="stat-card manager-stat-card manager-stat-approved">
                <div className="stat-info">
                  <h3>{t.approvedToday}</h3>
                  <p className="stat-value">{approvedToday}</p>
                </div>
              </div>
              <div className="stat-card manager-stat-card manager-stat-total">
                <div className="stat-info">
                  <h3>{t.totalTransactionsToday}</h3>
                  <p className="stat-value">{totalToday}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="manager-quick-links">
            <h3 className="manager-section-title">{t.quickActions}</h3>
            <div className="manager-quick-grid">
              {quickLinks.map((link) => (
                <Link key={link.to} to={link.to} className="manager-quick-card">
                  <div className="manager-quick-text">
                    <span className="manager-quick-label">{link.label}</span>
                    <span className="manager-quick-desc">{link.desc}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="manager-transactions-section">
            <div className="manager-section-header">
              <h3 className="manager-section-title">{t.transactions}</h3>
              <Link to="/boma/transactions" className="manager-view-all-link">
                {t.viewAll}
              </Link>
            </div>
            <div className="table-container manager-dashboard-table">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Total Amount</th>
                    <th>Amount Received</th>
                    <th>Amount Remain</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">
                        {t.noTransactionsToday}
                      </td>
                    </tr>
                  ) : (
                    displayTransactions.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="info-name">{capitalizeName(p.customer_name)}</div>
                          {p.customer_phone && (
                            <div className="info-detail" style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>
                              {p.customer_phone}
                            </div>
                          )}
                        </td>
                        <td className="amount-cell">TZS {formatPrice(p.total_amount)}</td>
                        <td className="amount-cell">
                          {p.amount_received != null ? `TZS ${formatPrice(p.amount_received)}` : '—'}
                        </td>
                        <td className="amount-cell">TZS {formatPrice(Math.max(0, p.amountRemain))}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              p.displayStatus === 'Approved'
                                ? 'approved'
                                : p.displayStatus === 'Rejected'
                                ? 'rejected'
                                : 'pending'
                            }`}
                          >
                            {p.displayStatus === 'Approved' && <FaCheckCircle />}
                            {p.displayStatus === 'Rejected' && <FaTimesCircle />}
                            {p.displayStatus === 'Pending' && <FaClock />}
                            {p.displayStatus === 'Approved' ? t.approved : p.displayStatus === 'Rejected' ? t.rejected : t.pending}
                          </span>
                        </td>
                        <td>{formatDateTime(p.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard;
