import { colors } from '../../utils/colors';
import React, { useState, useEffect } from 'react';
import { useResponsiveSidebar } from '../../utils/useResponsiveSidebar';
import SidebarBackdrop from '../../components/SidebarBackdrop';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
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
  FaBell,
  FaShieldAlt,
  FaPalette,
  FaSave,
  FaEye,
  FaEyeSlash,
  FaClock,
  FaTags,
  FaCalendarAlt
} from 'react-icons/fa';
import './setting.css';
import logo from '../../images/logo1.png';
import { changeAdminPassword } from '../../services/api';
import { getCurrentDateTime } from '../../utils/dateTime';
import { useTranslation } from '../../utils/useTranslation';
import { applyTheme } from '../../utils/theme';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageSelector from '../../components/LanguageSelector';
import { getUnviewedOperationsCount } from '../../utils/notifications';
import { getSectionFromPath } from '../../utils/settingsSection';
import { PageLoader } from '../../components/LoadingSpinner';
import { BRAND_NAME, DEFAULT_SUPPLIER } from '../../utils/brand';

function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const section = getSectionFromPath(location.pathname);
  const [user, setUser] = useState(null);
  const { sidebarOpen, isMobile, toggleSidebar, closeSidebar } = useResponsiveSidebar();
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('security');
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [passwordSaving, setPasswordSaving] = useState(false);
  
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [systemSettings, setSystemSettings] = useState({
    timezone: localStorage.getItem('systemTimezone') || 'Africa/Dar_es_Salaam',
    dateFormat: localStorage.getItem('systemDateFormat') || 'DD/MM/YYYY',
    timeFormat: localStorage.getItem('systemTimeFormat') || '24h',
    theme: localStorage.getItem('systemTheme') || 'light'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    lowStockAlerts: true,
    salesAlerts: true,
    employeeAlerts: true
  });

  useEffect(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
        return;
      }
    } else {
      navigate('/login');
      return;
    }
    
    setLoading(false);

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

    // Apply saved theme preference on mount
    const savedTheme = localStorage.getItem('systemTheme') || 'light';
    applyTheme(savedTheme);

    return () => {
      clearInterval(dateTimeInterval);
      window.removeEventListener('dateFormatChanged', handleDateFormatChange);
      window.removeEventListener('unviewedOperationsChanged', updateNotificationCount);
    };
  }, [navigate, section]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const handleSecuritySave = async (e) => {
    e.preventDefault();
    if (passwordSaving) return;

    const usernameForPasswordChange = String(
      user?.username || ''
    ).trim();

    if (!usernameForPasswordChange) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Unable to identify user account for password change.',
        confirmButtonColor: colors.primary
      });
      return;
    }
    
    if (!securitySettings.currentPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter your current password.',
        confirmButtonColor: colors.primary
      });
      return;
    }

    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'New password and confirm password do not match.',
        confirmButtonColor: colors.primary
      });
      return;
    }

    if (securitySettings.currentPassword === securitySettings.newPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'New password must be different from current password.',
        confirmButtonColor: colors.primary
      });
      return;
    }

    if (securitySettings.newPassword.length < 8) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Password must be at least 8 characters long.',
        confirmButtonColor: colors.primary
      });
      return;
    }

    try {
      setPasswordSaving(true);
      // Call API to change password
      const response = await changeAdminPassword(
        usernameForPasswordChange,
        securitySettings.currentPassword,
        securitySettings.newPassword
      );

      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Password updated successfully in database.',
          confirmButtonColor: colors.primary,
          timer: 2000,
          showConfirmButton: false
        });

        // Clear form
        setSecuritySettings({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to update password. Please check your current password and try again.',
        confirmButtonColor: colors.primary
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSystemSave = async (e) => {
    e.preventDefault();
    
    // Save system settings to localStorage
    localStorage.setItem('systemTimezone', systemSettings.timezone);
    localStorage.setItem('systemDateFormat', systemSettings.dateFormat);
    localStorage.setItem('systemTimeFormat', systemSettings.timeFormat);
    localStorage.setItem('systemTheme', systemSettings.theme);
    
    // Dispatch custom event for date format changes to trigger re-renders
    window.dispatchEvent(new Event('dateFormatChanged'));
    
    // Apply theme immediately
    applyTheme(systemSettings.theme);
    
    // Force immediate update of current date/time display
    setCurrentDateTime(getCurrentDateTime());
    
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'System settings updated successfully. Date format changes will take effect immediately.',
      confirmButtonColor: colors.primary,
      timer: 3000,
      showConfirmButton: true
    });
  };

  const handleNotificationSave = async (e) => {
    e.preventDefault();
    // TODO: Implement API call to update notification settings
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'Notification settings updated successfully.',
      confirmButtonColor: colors.primary,
      timer: 2000,
      showConfirmButton: false
    });
  };

  if (loading) {
    return <PageLoader message={t.loading || 'Loading...'} />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="settings-container">
      {isMobile && sidebarOpen ? <SidebarBackdrop onClose={closeSidebar} /> : null}
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <img src={logo} alt="Logo" className="sidebar-logo" />
          <span className="sidebar-title">{BRAND_NAME}</span>
        </div>
        
        <nav className="sidebar-nav" onClick={isMobile ? closeSidebar : undefined}>
          <Link to="/admin/dashboard" className="nav-item">
            <FaChartLine className="nav-icon" />
            <span>{t.dashboard}</span>
          </Link>
          <Link to="/admin/categories-brands" className="nav-item">
            <FaTags className="nav-icon" />
            <span>{t.categoriesBrands}</span>
          </Link>
          <Link to="/admin/spareparts" className="nav-item">
            <FaBox className="nav-icon" />
            <span>{t.spareParts}</span>
          </Link>
          <Link to="/admin/sales" className="nav-item">
            <FaShoppingCart className="nav-icon" />
            <span>{t.sales}</span>
          </Link>
          <Link to="/admin/employees" className="nav-item">
            <FaUsers className="nav-icon" />
            <span>{t.employees}</span>
          </Link>
          <Link
            to="/admin/transactions"
            className={'nav-item' + (window.location.pathname === '/admin/transactions' ? ' active' : '')}
          >
            <FaCalendarAlt className="nav-icon" />
            <span>{t.transactions}</span>
          </Link>
          <Link to="/admin/reports" className="nav-item">
            <FaChartBar className="nav-icon" />
            <span>{t.reports || 'Reports'}</span>
          </Link>
          <Link to="/admin/settings" className="nav-item active">
            <FaCog className="nav-icon" />
            <span>{t.settings}</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="settings-header">
          <div className="header-left">
            <button 
              className="menu-toggle"
              onClick={toggleSidebar}
            >
              <FaBars />
            </button>
            <h1 className="page-title">{t.settings}</h1>
          </div>
          
          <div className="header-right">
            <div
              className="date-time-display"
              style={{
                marginRight: '20px',
                fontSize: '14px',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <FaCalendarAlt style={{ fontSize: '16px' }} />
              <span>{currentDateTime}</span>
            </div>
            <button 
              className="notification-btn"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'default',
                position: 'relative',
                marginRight: '15px',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '18px',
                transition: 'all 0.3s ease'
              }}
              disabled
              title="New operations count"
            >
              <FaBell />
              {notificationCount > 0 && (
                <span 
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: colors.error,
                    color: 'white',
                    borderRadius: '50%',
                    minWidth: '16px',
                    height: '16px',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    padding: notificationCount > 9 ? '0 4px' : '0'
                  }}
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
            <div style={{ marginRight: '15px' }}>
              <LanguageSelector />
            </div>
            <div style={{ marginRight: '15px' }}>
              <ThemeToggle />
            </div>
            <div className="user-info">
              <FaUser className="user-icon" />
              <span className="user-name">{user?.username || 'Admin'}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt /> {t.logout}
            </button>
          </div>
        </header>

        {/* Settings Content */}
        <div className="settings-content">
          {/* Settings Tabs */}
          <div className="settings-tabs">
            <button 
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <FaShieldAlt className="tab-icon" />
              <span>{t.security}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
              onClick={() => setActiveTab('system')}
            >
              <FaCog className="tab-icon" />
              <span>{t.system}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <FaBell className="tab-icon" />
              <span>{t.notifications}</span>
            </button>
          </div>

          {/* Settings Panels */}
          <div className="settings-panels">
            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="settings-panel">
                <div className="panel-header">
                  <FaShieldAlt className="panel-icon" />
                  <h2>{t.securitySettings}</h2>
                </div>
                <form onSubmit={handleSecuritySave} className="settings-form">
                  <div className="form-group">
                    <label>{t.currentPassword}</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={securitySettings.currentPassword}
                        onChange={(e) => setSecuritySettings({...securitySettings, currentPassword: e.target.value})}
                        placeholder={t.enterCurrentPassword}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{t.newPassword}</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={securitySettings.newPassword}
                        onChange={(e) => setSecuritySettings({...securitySettings, newPassword: e.target.value})}
                        placeholder={t.enterNewPassword}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{t.confirmNewPassword}</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={securitySettings.confirmPassword}
                        onChange={(e) => setSecuritySettings({...securitySettings, confirmPassword: e.target.value})}
                        placeholder={t.enterConfirmPassword}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={passwordSaving}>
                      <FaSave /> {passwordSaving ? t.updating : t.updatePassword}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* System Settings */}
            {activeTab === 'system' && (
              <div className="settings-panel">
                <div className="panel-header">
                  <FaCog className="panel-icon" />
                  <h2>{t.systemSettings}</h2>
                </div>
                <form onSubmit={handleSystemSave} className="settings-form">
                  <div className="form-group">
                    <label>{t.language}</label>
                    <p className="settings-hint" style={{ margin: '0 0 8px', color: 'var(--text-secondary, #666)', fontSize: 13 }}>
                      {t.languageSwitchHint}
                    </p>
                    <LanguageSelector />
                  </div>
                  <div className="form-group">
                    <label>
                      <FaClock className="form-icon" />
                      {t.timezone}
                    </label>
                    <select
                      value={systemSettings.timezone}
                      onChange={(e) => setSystemSettings({...systemSettings, timezone: e.target.value})}
                    >
                      <option value="Africa/Dar_es_Salaam">Africa/Dar es Salaam (EAT)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t.dateFormat}</label>
                    <select
                      value={systemSettings.dateFormat}
                      onChange={(e) => {
                        const newFormat = e.target.value;
                        setSystemSettings({...systemSettings, dateFormat: newFormat});
                        // Save immediately to localStorage so format functions can read it
                        localStorage.setItem('systemDateFormat', newFormat);
                        // Update current date/time display immediately
                        setCurrentDateTime(getCurrentDateTime());
                        // Dispatch event to update other components
                        window.dispatchEvent(new Event('dateFormatChanged'));
                      }}
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                    <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
                      Preview: {getCurrentDateTime()}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{t.timeFormat}</label>
                    <select
                      value={systemSettings.timeFormat}
                      onChange={(e) => {
                        const newFormat = e.target.value;
                        setSystemSettings({...systemSettings, timeFormat: newFormat});
                        // Save immediately to localStorage so format functions can read it
                        localStorage.setItem('systemTimeFormat', newFormat);
                        // Update current date/time display immediately
                        setCurrentDateTime(getCurrentDateTime());
                        // Dispatch event to update other components
                        window.dispatchEvent(new Event('dateFormatChanged'));
                      }}
                    >
                      <option value="24h">24 Hour</option>
                      <option value="12h">12 Hour</option>
                    </select>
                    <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
                      Preview: {getCurrentDateTime()}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>
                      <FaPalette className="form-icon" />
                      {t.theme}
                    </label>
                    <select
                      value={systemSettings.theme}
                      onChange={(e) => {
                        const newTheme = e.target.value;
                        setSystemSettings({...systemSettings, theme: newTheme});
                        // Apply theme immediately
                        applyTheme(newTheme);
                      }}
                    >
                      <option value="light">{t.light}</option>
                      <option value="dark">{t.dark}</option>
                      <option value="auto">{t.auto}</option>
                    </select>
                    <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
                      {systemSettings.theme === 'auto' 
                        ? `Auto: ${window.matchMedia('(prefers-color-scheme: dark)').matches ? t.dark : t.light}`
                        : systemSettings.theme === 'dark' 
                        ? t.dark 
                        : t.light}
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="save-btn">
                      <FaSave /> {t.saveChanges}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="settings-panel">
                <div className="panel-header">
                  <FaBell className="panel-icon" />
                  <h2>{t.notificationSettings}</h2>
                </div>
                <form onSubmit={handleNotificationSave} className="settings-form">
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                      />
                      <span>{t.emailNotifications}</span>
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, smsNotifications: e.target.checked})}
                      />
                      <span>{t.smsNotifications}</span>
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, pushNotifications: e.target.checked})}
                      />
                      <span>{t.pushNotifications}</span>
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={notificationSettings.lowStockAlerts}
                        onChange={(e) => setNotificationSettings({...notificationSettings, lowStockAlerts: e.target.checked})}
                      />
                      <span>{t.lowStockAlerts}</span>
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={notificationSettings.salesAlerts}
                        onChange={(e) => setNotificationSettings({...notificationSettings, salesAlerts: e.target.checked})}
                      />
                      <span>{t.salesAlerts}</span>
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={notificationSettings.employeeAlerts}
                        onChange={(e) => setNotificationSettings({...notificationSettings, employeeAlerts: e.target.checked})}
                      />
                      <span>{t.employeeAlerts}</span>
                    </label>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="save-btn">
                      <FaSave /> {t.saveChanges}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;



