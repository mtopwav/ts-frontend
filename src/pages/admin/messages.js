import { colors } from '../../utils/colors';
import React, { useState, useEffect } from 'react';
import { useResponsiveSidebar } from '../../utils/useResponsiveSidebar';
import SidebarBackdrop from '../../components/SidebarBackdrop';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaChartLine, 
  FaBox, 
  FaUsers, 
  FaShoppingCart,
  FaBars,
  FaSignOutAlt,
  FaChartBar,
  FaCog,
  FaUser,
  FaTags,
  FaCalendarAlt,
  FaBell
} from 'react-icons/fa';
import logo from '../../images/logo1.png';
import { getCurrentDateTime } from '../../utils/dateTime';
import { useTranslation } from '../../utils/useTranslation';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageSelector from '../../components/LanguageSelector';
import { getUnviewedOperationsCount } from '../../utils/notifications';
import Swal from 'sweetalert2';
import './dashboard.css';
import { BRAND_NAME, DEFAULT_SUPPLIER } from '../../utils/brand';

function Messages() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const { sidebarOpen, isMobile, toggleSidebar, closeSidebar } = useResponsiveSidebar();
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }

    // Initialize and update current date/time every second
    setCurrentDateTime(getCurrentDateTime());
    const dateTimeInterval = setInterval(() => {
      setCurrentDateTime(getCurrentDateTime());
    }, 1000);

    // Listen for date format changes
    const handleDateFormatChange = () => {
      setCurrentDateTime(getCurrentDateTime());
    };
    window.addEventListener('dateFormatChanged', handleDateFormatChange);

    // Update notification count
    const updateNotificationCount = () => {
      setNotificationCount(getUnviewedOperationsCount());
    };
    updateNotificationCount();
    window.addEventListener('unviewedOperationsChanged', updateNotificationCount);

    return () => {
      clearInterval(dateTimeInterval);
      window.removeEventListener('dateFormatChanged', handleDateFormatChange);
      window.removeEventListener('unviewedOperationsChanged', updateNotificationCount);
    };
  }, [navigate]);

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: 'question',
      title: t.logout || 'Logout',
      text: t.areYouSureLogout || 'Are you sure you want to logout?',
      showCancelButton: true,
      confirmButtonColor: colors.error,
      cancelButtonColor: colors.textMuted,
      confirmButtonText: t.yesLogout || 'Yes, logout',
      cancelButtonText: t.cancel || 'Cancel'
    });

    if (!result.isConfirmed) return;

    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-container">
      {isMobile && sidebarOpen ? <SidebarBackdrop onClose={closeSidebar} /> : null}
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <img src={logo} alt="Logo" className="sidebar-logo" />
          <span className="sidebar-title">{BRAND_NAME}</span>
        </div>
        
        <nav className="sidebar-nav" onClick={isMobile ? closeSidebar : undefined} style={{ padding: '20px 0' }}>
          <Link to="/admin/dashboard" className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px', color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none', transition: 'all 0.3s', borderLeft: '3px solid transparent' }}>
            <FaChartLine style={{ fontSize: '1.2rem', minWidth: '20px' }} />
            <span style={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? 'auto' : 0, overflow: 'hidden', transition: 'opacity 0.3s' }}>{t.dashboard}</span>
          </Link>
          <Link to="/admin/categories-brands" className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px', color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none', transition: 'all 0.3s', borderLeft: '3px solid transparent' }}>
            <FaTags style={{ fontSize: '1.2rem', minWidth: '20px' }} />
            <span style={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? 'auto' : 0, overflow: 'hidden', transition: 'opacity 0.3s' }}>{t.categoriesBrands}</span>
          </Link>
          <Link to="/admin/spareparts" className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px', color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none', transition: 'all 0.3s', borderLeft: '3px solid transparent' }}>
            <FaBox style={{ fontSize: '1.2rem', minWidth: '20px' }} />
            <span style={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? 'auto' : 0, overflow: 'hidden', transition: 'opacity 0.3s' }}>{t.spareParts}</span>
          </Link>
          <Link to="/admin/sales" className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px', color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none', transition: 'all 0.3s', borderLeft: '3px solid transparent' }}>
            <FaShoppingCart style={{ fontSize: '1.2rem', minWidth: '20px' }} />
            <span style={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? 'auto' : 0, overflow: 'hidden', transition: 'opacity 0.3s' }}>{t.sales}</span>
          </Link>
          <Link to="/admin/employees" className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px', color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none', transition: 'all 0.3s', borderLeft: '3px solid transparent' }}>
            <FaUsers style={{ fontSize: '1.2rem', minWidth: '20px' }} />
            <span style={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? 'auto' : 0, overflow: 'hidden', transition: 'opacity 0.3s' }}>{t.employees}</span>
          </Link>
          <Link
            to="/admin/transactions"
            className={'nav-item' + (window.location.pathname === '/admin/transactions' ? ' active' : '')}
            style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px', color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none', transition: 'all 0.3s', borderLeft: '3px solid transparent' }}
          >
            <FaCalendarAlt style={{ fontSize: '1.2rem', minWidth: '20px' }} />
            <span style={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? 'auto' : 0, overflow: 'hidden', transition: 'opacity 0.3s' }}>{t.transactions}</span>
          </Link>
          <Link to="/admin/reports" className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px', color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none', transition: 'all 0.3s', borderLeft: '3px solid transparent' }}>
            <FaChartBar style={{ fontSize: '1.2rem', minWidth: '20px' }} />
            <span style={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? 'auto' : 0, overflow: 'hidden', transition: 'opacity 0.3s' }}>{t.reports || 'Reports'}</span>
          </Link>
          <Link to="/admin/settings" className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px', color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none', transition: 'all 0.3s', borderLeft: '3px solid transparent' }}>
            <FaCog style={{ fontSize: '1.2rem', minWidth: '20px' }} />
            <span style={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? 'auto' : 0, overflow: 'hidden', transition: 'opacity 0.3s' }}>{t.settings}</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button type="button" className="menu-toggle" onClick={toggleSidebar}>
              <FaBars />
            </button>
            <h1 className="page-title">{t.messages}</h1>
          </div>
          <div className="header-right">
            <div className="date-time-display" style={{ marginRight: '20px', fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FaCalendarAlt style={{ fontSize: '16px' }} />
              <span>{currentDateTime}</span>
            </div>
            <button
              className="notification-btn"
              type="button"
              disabled
              title="New operations count"
            >
              <FaBell />
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount > 99 ? '99+' : notificationCount}</span>
              )}
            </button>
            <LanguageSelector />
            <ThemeToggle />
            <div className="user-info">
              <FaUser className="user-icon" />
              <span className="user-name">{user?.username || 'Admin'}</span>
            </div>
            <button type="button" className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt /> <span>{t.logout}</span>
            </button>
          </div>
        </header>
        <div className="dashboard-content">
          <h1>{t.messages}</h1>
          <p>{t.messages} management page coming soon...</p>
        </div>
      </div>
    </div>
  );
}

export default Messages;
