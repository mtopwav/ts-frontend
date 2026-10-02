import { colors } from '../../utils/colors';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useResponsiveSidebar } from '../../utils/useResponsiveSidebar';
import SidebarBackdrop from '../../components/SidebarBackdrop';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaChartLine, 
  FaBox, 
  FaMoneyBillAlt, 
  FaUsers, 
  FaShoppingCart,
  FaBars,
  FaSignOutAlt,
  FaChartBar,
  FaCog,
  FaUser,
  FaTags,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaBell,
  FaWallet,
  FaMapMarkerAlt,
  FaChevronDown,
  FaFilter
} from 'react-icons/fa';
import './dashboard.css';
import logo from '../../images/logo1.png';
import { getCurrentDateTime } from '../../utils/dateTime';
import { useTranslation } from '../../utils/useTranslation';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageSelector from '../../components/LanguageSelector';
import { getUnviewedOperationsCount } from '../../utils/notifications';
import { getPayments, getSpareParts, getCustomers } from '../../services/api';
import Swal from 'sweetalert2';
import { PageLoader } from '../../components/LoadingSpinner';
import { BRAND_NAME, DEFAULT_SUPPLIER } from '../../utils/brand';
import { BRANCH_BOMA, BRANCH_GEITA } from '../../utils/branchLocations';

function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const { sidebarOpen, isMobile, toggleSidebar, closeSidebar } = useResponsiveSidebar();
  const [loading, setLoading] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [payments, setPayments] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [sparePartsList, setSparePartsList] = useState([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const locationSelectRef = useRef(null);

  useEffect(() => {
    // Get user data from storage
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setLoading(false);
        
        // Redirect Sales department employees to sales page
        if (parsedUser.userType === 'employee' && parsedUser.department === 'Sales') {
          console.log('Redirecting Sales employee to sales page...');
          navigate('/sales/dashboard');
          return;
        }
        
        // Redirect Finance department employees to finance page
        if (parsedUser.userType === 'employee' && parsedUser.department === 'Finance') {
          console.log('Redirecting Finance employee to finance page...');
          navigate('/finance/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setLoading(false);
        // Don't redirect immediately, show error instead
        setTimeout(() => navigate('/login'), 2000);
      }
    } else {
      setLoading(false);
      // Don't redirect immediately, show message instead
      setTimeout(() => navigate('/login'), 1000);
    }

    // Initialize date/time display
    setCurrentDateTime(getCurrentDateTime());
    
    // Update current date/time every second
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

    // Fetch payments to calculate today's sales
    const fetchPayments = async () => {
      try {
        const response = await getPayments();
        if (response.success && response.payments) {
          setPayments(response.payments);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
        setPayments([]);
      }
    };
    fetchPayments();

    // Fetch spare parts to count total parts and total wholesale/retail values
    const fetchSpareParts = async () => {
      try {
        const response = await getSpareParts();
        if (response.success && response.spareParts) {
          setSparePartsList(response.spareParts);
        }
      } catch (error) {
        console.error('Error fetching spare parts:', error);
        setSparePartsList([]);
      }
    };
    fetchSpareParts();

    // Fetch customers to count total customers
    const fetchCustomers = async () => {
      try {
        const response = await getCustomers();
        if (response.success && response.customers) {
          setCustomersList(response.customers);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomersList([]);
      }
    };
    fetchCustomers();

    return () => {
      clearInterval(dateTimeInterval);
      window.removeEventListener('dateFormatChanged', handleDateFormatChange);
      window.removeEventListener('unviewedOperationsChanged', updateNotificationCount);
    };
  }, [navigate]);

  useEffect(() => {
    if (!locationMenuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (locationSelectRef.current && !locationSelectRef.current.contains(event.target)) {
        setLocationMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setLocationMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [locationMenuOpen]);

  const locationOptions = useMemo(
    () => [
      { value: '', label: t.allBranches || 'All Branches', hint: 'Boma & Geita' },
      { value: BRANCH_BOMA, label: t.bomaBranch || 'Boma Branch', hint: 'Boma data only' },
      { value: BRANCH_GEITA, label: t.geitaBranch || 'Geita Branch', hint: 'Geita data only' },
    ],
    [t]
  );

  const selectedLocationOption =
    locationOptions.find((opt) => opt.value === locationFilter) || locationOptions[0];

  const matchesLocation = (record) => {
    if (!locationFilter) return true;
    return (
      String(record?.location || '').trim().toLowerCase() ===
      String(locationFilter).trim().toLowerCase()
    );
  };

  const filteredPayments = useMemo(
    () => payments.filter(matchesLocation),
    [payments, locationFilter]
  );

  const filteredSpareParts = useMemo(
    () => sparePartsList.filter(matchesLocation),
    [sparePartsList, locationFilter]
  );

  const filteredCustomers = useMemo(
    () => customersList.filter(matchesLocation),
    [customersList, locationFilter]
  );

  const filteredRecentActivities = useMemo(
    () => recentActivities.filter(matchesLocation),
    [recentActivities, locationFilter]
  );

  const paymentStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const todayApproved = filteredPayments.filter((p) => {
      if (!p.status || p.status.trim() !== 'Approved') return false;
      if (!p.created_at) return false;
      const paymentDate = new Date(p.created_at);
      paymentDate.setHours(0, 0, 0, 0);
      return paymentDate.getTime() === today.getTime();
    });

    const todaySales = todayApproved.reduce((sum, p) => {
      const amount = parseFloat(p.amount_received ?? p.total_amount) || 0;
      return sum + amount;
    }, 0);

    const todayPending = filteredPayments.filter((p) => {
      const status = p.status ? p.status.trim() : '';
      if (status === 'Approved' || status === 'Rejected') return false;
      if (!p.created_at) return false;
      const paymentDate = new Date(p.created_at);
      paymentDate.setHours(0, 0, 0, 0);
      return paymentDate.getTime() === today.getTime();
    });

    const yesterdayApproved = filteredPayments.filter((p) => {
      if (!p.status || p.status.trim() !== 'Approved') return false;
      if (!p.created_at) return false;
      const paymentDate = new Date(p.created_at);
      paymentDate.setHours(0, 0, 0, 0);
      return paymentDate.getTime() === yesterday.getTime();
    });

    const yesterdaySales = yesterdayApproved.reduce((sum, p) => {
      const amount = parseFloat(p.amount_received ?? p.total_amount) || 0;
      return sum + amount;
    }, 0);

    const lastWeekOrders = filteredPayments.filter((p) => {
      if (!p.created_at) return false;
      const paymentDate = new Date(p.created_at);
      paymentDate.setHours(0, 0, 0, 0);
      return paymentDate.getTime() >= lastWeek.getTime() && paymentDate.getTime() < today.getTime();
    }).length;

    return {
      totalSales: todaySales,
      totalOrders: filteredPayments.length,
      yesterdaySales,
      lastWeekOrders,
      todaySalesCount: todayApproved.length,
      todayPendingOrdersCount: todayPending.length,
    };
  }, [filteredPayments]);

  const partsStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastWeekParts = filteredSpareParts.filter((part) => {
      if (!part.created_at && !part.date_added) return false;
      const partDate = new Date(part.created_at || part.date_added);
      partDate.setHours(0, 0, 0, 0);
      return partDate.getTime() < lastWeek.getTime();
    }).length;

    return {
      totalParts: filteredSpareParts.length,
      lastWeekParts,
    };
  }, [filteredSpareParts]);

  const customersStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastWeekCustomers = filteredCustomers.filter((customer) => {
      if (!customer.created_at && !customer.registered_date) return false;
      const customerDate = new Date(customer.created_at || customer.registered_date);
      customerDate.setHours(0, 0, 0, 0);
      return customerDate.getTime() < lastWeek.getTime();
    }).length;

    return {
      totalCustomers: filteredCustomers.length,
      lastWeekCustomers,
    };
  }, [filteredCustomers]);

  // Time ago helper (uses t for language)
  const getTimeAgo = (dateString) => {
    if (!dateString) return t.na;
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return t.justNow;
    if (diffInSeconds < 3600) return t.timeAgoMinutes.replace('%s', Math.floor(diffInSeconds / 60));
    if (diffInSeconds < 86400) return t.timeAgoHours.replace('%s', Math.floor(diffInSeconds / 3600));
    if (diffInSeconds < 604800) return t.timeAgoDays.replace('%s', Math.floor(diffInSeconds / 86400));
    if (diffInSeconds < 2592000) return t.timeAgoWeeks.replace('%s', Math.floor(diffInSeconds / 604800));
    return t.timeAgoMonths.replace('%s', Math.floor(diffInSeconds / 2592000));
  };

  // Fetch recent operations
  useEffect(() => {
    const fetchRecentOperations = async () => {
      try {
        // Fetch all data needed for operations
        const [paymentsRes, sparePartsRes, customersRes] = await Promise.all([
          getPayments(),
          getSpareParts(),
          getCustomers()
        ]);

        const activities = [];

        // Helper function to format currency
        const formatCurrencyLocal = (amount) => {
          const formatted = new Intl.NumberFormat('en-TZ', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(amount || 0);
          return `TZS ${formatted}`;
        };

        // Add payment operations (approved/rejected) - store raw data for translated description in render
        if (paymentsRes.success && paymentsRes.payments) {
          const operations = paymentsRes.payments
            .filter(p => p.status && (p.status === 'Approved' || p.status === 'Rejected') && p.approved_at)
            .sort((a, b) => new Date(b.approved_at || b.created_at) - new Date(a.approved_at || a.created_at))
            .slice(0, 10)
            .map(p => ({
              id: `payment_${p.id}`,
              type: 'Sale',
              paymentId: p.id,
              status: p.status,
              amount: formatCurrencyLocal(parseFloat(p.total_amount) || 0),
              location: p.location || '',
              date: new Date(p.approved_at || p.created_at)
            }));
          activities.push(...operations);
        }

        // Add recent spare parts
        if (sparePartsRes.success && sparePartsRes.spareParts) {
          const recentParts = sparePartsRes.spareParts
            .sort((a, b) => new Date(b.created_at || b.date_added) - new Date(a.created_at || a.date_added))
            .slice(0, 5)
            .map(part => ({
              id: `part_${part.id}`,
              type: 'Product',
              partName: part.part_name || 'Unknown',
              location: part.location || '',
              date: new Date(part.created_at || part.date_added)
            }));
          activities.push(...recentParts);
        }

        // Add recent customers
        if (customersRes.success && customersRes.customers) {
          const recentCustomers = customersRes.customers
            .sort((a, b) => new Date(b.created_at || b.registered_date) - new Date(a.created_at || a.registered_date))
            .slice(0, 5)
            .map(customer => ({
              id: `customer_${customer.id}`,
              type: 'Customer',
              customerName: customer.name || 'Unknown',
              location: customer.location || '',
              date: new Date(customer.created_at || customer.registered_date)
            }));
          activities.push(...recentCustomers);
        }

        // Sort by date (most recent first) and take top 7
        activities.sort((a, b) => b.date - a.date);
        setRecentActivities(activities.slice(0, 7));
      } catch (error) {
        console.error('Error fetching recent operations:', error);
        setRecentActivities([]);
      }
    };
    fetchRecentOperations();
  }, []);

  /** Inventory stock value at buying price (on-hand qty only). */
  const inventoryBuyingValue = useMemo(() => {
    const parsePrice = (v) => {
      if (v == null || v === '') return 0;
      const n = parseFloat(String(v).replace(/,/g, ''));
      return Number.isNaN(n) ? 0 : n;
    };
    let buying = 0;
    for (const part of filteredSpareParts) {
      const qty = Number(part.quantity) || 0;
      buying += qty * parsePrice(part.buying_price ?? part.buyingPrice);
    }
    return buying;
  }, [filteredSpareParts]);

  /**
   * Amount received + profit after sale generation.
   * Received: Σ amount_received (Approved).
   * Profit: Σ qty × (wholesale|retail sell price − buying price) per sold line.
   */
  const transactionMetrics = useMemo(() => {
    const parseNum = (v) => {
      if (v == null || v === '') return 0;
      const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
      return Number.isFinite(n) ? n : 0;
    };

    const spareById = new Map();
    for (const part of sparePartsList) {
      if (part?.id == null) continue;
      spareById.set(String(part.id), part);
    }

    const getItemSoldQty = (item) => {
      if (item?.original_quantity != null) {
        return Math.max(0, parseInt(item.original_quantity, 10) || 0);
      }
      if (item?.returned_quantity != null) {
        return Math.max(
          0,
          (parseInt(item.quantity, 10) || 0) + (parseInt(item.returned_quantity, 10) || 0)
        );
      }
      return Math.max(0, parseInt(item?.quantity, 10) || 0);
    };

    const getPaymentItems = (p) => {
      if (Array.isArray(p?.items) && p.items.length > 0) return p.items;
      if (p?.sparepart_id != null) {
        return [
          {
            sparepart_id: p.sparepart_id,
            quantity: p.quantity,
            unit_price: p.unit_price ?? p.price,
          },
        ];
      }
      return [];
    };

    let received = 0;
    let profit = 0;

    for (const p of filteredPayments) {
      if (String(p.status || '').trim() !== 'Approved') continue;
      received += parseNum(p.amount_received);

      const priceType = String(p.price_type || 'retail').trim().toLowerCase();
      const items = getPaymentItems(p);

      for (const item of items) {
        const sparepartId = item.sparepart_id ?? item.sparepartId;
        const qty = getItemSoldQty(item);
        if (sparepartId == null || qty <= 0) continue;

        const sp = spareById.get(String(sparepartId)) || {};
        const buy = parseNum(sp.buying_price ?? sp.buyingPrice);
        let sell = parseNum(item.unit_price ?? item.price ?? item.unitPrice);
        if (sell <= 0) {
          sell =
            priceType === 'wholesale'
              ? parseNum(sp.wholesale_price ?? sp.wholesalePrice)
              : parseNum(sp.retail_price ?? sp.retailPrice);
        }
        profit += qty * (sell - buy);
      }
    }

    return {
      received,
      profit: Math.round(profit * 100) / 100,
    };
  }, [filteredPayments, sparePartsList]);

  /** Total sold-out quantity across filtered spare parts. */
  const totalSoldOutSpareparts = useMemo(() => {
    return filteredSpareParts.reduce((sum, part) => sum + (Number(part.soldout_quantity) || 0), 0);
  }, [filteredSpareParts]);
  // Show loading while checking authentication
  if (loading) {
    return <PageLoader message={t.loading || 'Loading...'} />;
  }

  // If no user after loading, show message
  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '1.2rem',
        backgroundColor: '#f5f7fa',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <p>{t.redirectingToLogin}</p>
      </div>
    );
  }

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

  // Format currency function
  const formatCurrency = (amount) => {
    const formatted = new Intl.NumberFormat('en-TZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
    // Add "TZS" prefix
    return `TZS ${formatted}`;
  };

  // Calculate percentage change
  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) {
      return {
        value: current > 0 ? '+100%' : '0%',
        isPositive: current > 0
      };
    }
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return {
      value: `${sign}${change.toFixed(1)}%`,
      isPositive: change >= 0
    };
  };

  // Calculate percentage changes
  const salesChange = calculatePercentageChange(paymentStats.totalSales, paymentStats.yesterdaySales);
  const partsChange = calculatePercentageChange(partsStats.totalParts, partsStats.lastWeekParts);
  const ordersChange = calculatePercentageChange(paymentStats.totalOrders, paymentStats.lastWeekOrders);
  const customersChange = calculatePercentageChange(
    customersStats.totalCustomers,
    customersStats.lastWeekCustomers
  );

  const receivedLineRetail = `${t.totalReceived || 'Total received'}: ${formatCurrency(transactionMetrics.received)}`;
  const profitLine = `${t.profit || 'Profit'}: ${formatCurrency(transactionMetrics.profit)}`;

  // Dashboard statistics
  const stats = [
    {
      title: t.todaySales || 'Today\'s Sales',
      value: formatCurrency(paymentStats.totalSales),
      change: salesChange.value,
      changePositive: salesChange.isPositive,
      icon: <FaMoneyBillAlt />,
      color: 'success'
    },
    {
      title: t.totalParts,
      value: partsStats.totalParts.toLocaleString('en-TZ'),
      change: partsChange.value,
      changePositive: partsChange.isPositive,
      icon: <FaBox />,
      color: 'primary'
    },
    {
      title: t.totalOrders,
      value: paymentStats.totalOrders.toLocaleString('en-TZ'),
      change: ordersChange.value,
      changePositive: ordersChange.isPositive,
      icon: <FaShoppingCart />,
      color: 'info'
    },
    {
      title: t.customers,
      value: customersStats.totalCustomers.toLocaleString('en-TZ'),
      change: customersChange.value,
      changePositive: customersChange.isPositive,
      icon: <FaUsers />,
      color: 'warning'
    },
    {
      title: t.totalValue || 'Total Value',
      value: formatCurrency(inventoryBuyingValue),
      change: receivedLineRetail,
      changePositive: true,
      changes: [
        { text: receivedLineRetail, positive: true },
        { text: profitLine, positive: transactionMetrics.profit >= 0 },
      ],
      icon: <FaMoneyBillAlt />,
      color: 'secondary'
    },
    {
      title: t.totalSoldOutSpareparts || 'Total Sold Out Spareparts',
      value: totalSoldOutSpareparts.toLocaleString('en-TZ'),
      change: t.soldOutQuantity || 'Sold-out quantity',
      changePositive: true,
      icon: <FaBox />,
      color: 'warning'
    }
  ];
  // Recent activities are now fetched from the database

  // Debug: Log when component renders
  console.log('Dashboard rendering, user:', user, 'loading:', loading);

  return (
    <div className="dashboard-container">
      {isMobile && sidebarOpen ? <SidebarBackdrop onClose={closeSidebar} /> : null}
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <img src={logo} alt="Logo" className="sidebar-logo" />
          <span className="sidebar-title">{BRAND_NAME}</span>
        </div>
        
        <nav className="sidebar-nav" onClick={isMobile ? closeSidebar : undefined}>
          <Link to="/admin/dashboard" className="nav-item active">
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
          <Link
            to="/admin/loans"
            className={'nav-item' + (window.location.pathname === '/admin/loans' ? ' active' : '')}
          >
            <FaMoneyBillWave className="nav-icon" />
            <span>{t.loans}</span>
          </Link>
          <Link
            to="/admin/expenses"
            className={'nav-item' + (window.location.pathname === '/admin/expenses' ? ' active' : '')}
          >
            <FaWallet className="nav-icon" />
            <span>{t.expenses || 'Expenses'}</span>
          </Link>
          <Link to="/admin/reports" className="nav-item">
            <FaChartBar className="nav-icon" />
            <span>{t.reports || 'Reports'}</span>
          </Link>
          <Link to="/admin/settings" className="nav-item">
            <FaCog className="nav-icon" />
            <span>{t.settings}</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <button 
              className="menu-toggle"
              onClick={toggleSidebar}
            >
              <FaBars />
            </button>
            <h1 className="page-title">{t.dashboard}</h1>
          </div>
          
          <div className="header-right">
            <div style={{ marginRight: '15px' }}>
              <LanguageSelector />
            </div>
            <div className="date-time-display" style={{ 
              marginRight: '20px', 
              fontSize: '14px', 
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
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
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
                e.currentTarget.style.color = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#666';
              }}
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

        {/* Dashboard Content */}
        <div className="dashboard-content">
          <div className="dashboard-location-bar">
            <div
              className={`dashboard-location-dropdown${locationFilter ? ' is-active' : ''}${
                locationMenuOpen ? ' is-open' : ''
              }`}
              ref={locationSelectRef}
            >
              <button
                type="button"
                id="admin-dashboard-location-filter"
                className="dashboard-location-btn"
                onClick={() => setLocationMenuOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={locationMenuOpen}
              >
                <FaFilter className="dashboard-location-btn-icon" aria-hidden="true" />
                <FaMapMarkerAlt className="dashboard-location-btn-icon" aria-hidden="true" />
                <span className="dashboard-location-btn-label">{selectedLocationOption.label}</span>
                <FaChevronDown className="dashboard-location-chevron" aria-hidden="true" />
              </button>
              {locationMenuOpen ? (
                <ul className="dashboard-location-menu" role="listbox">
                  {locationOptions.map((opt) => (
                    <li key={opt.value || 'all'} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={opt.value === locationFilter}
                        className={`dashboard-location-option${
                          opt.value === locationFilter ? ' is-selected' : ''
                        }`}
                        onClick={() => {
                          setLocationFilter(opt.value);
                          setLocationMenuOpen(false);
                        }}
                      >
                        <FaMapMarkerAlt className="dashboard-location-option-icon" aria-hidden="true" />
                        <span className="dashboard-location-option-text">
                          <span className="dashboard-location-option-label">{opt.label}</span>
                          <span className="dashboard-location-option-hint">{opt.hint}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid">            {stats.map((stat, index) => (
              <div key={index} className={`stat-card stat-${stat.color}`}>
                <div className="stat-info">
                  <h3 className="stat-title">{stat.title}</h3>
                  <p className="stat-value">{stat.value}</p>
                  {Array.isArray(stat.changes) && stat.changes.length > 0 ? (
                    <div className="stat-changes">
                      {stat.changes.map((line, lineIdx) => (
                        <span
                          key={lineIdx}
                          className={`stat-change ${line.positive ? 'positive' : 'negative'}`}
                        >
                          {line.text}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className={`stat-change ${stat.changePositive ? 'positive' : 'negative'}`}>
                      {stat.change}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Charts and Activities Row */}
          <div className="dashboard-row">
            {/* Recent Activities */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>{t.recentOperations}</h2>
              </div>
              <div className="card-body">
                {filteredRecentActivities.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px 20px', 
                    color: colors.textMuted,
                    fontSize: '0.95rem'
                  }}>
                    {t.noRecentOperations}
                  </div>
                ) : (
                  <ul className="activity-list">
                    {filteredRecentActivities.map(activity => {
                      const description = activity.type === 'Sale'
                        ? (activity.status === 'Approved' ? t.paymentApproved.replace('%s', activity.paymentId) : t.paymentRejected.replace('%s', activity.paymentId))
                        : activity.type === 'Product'
                        ? t.newSparePartAdded.replace('%s', activity.partName)
                        : t.newCustomerRegistered.replace('%s', activity.customerName);
                      return (
                        <li key={activity.id} className="activity-item">
                          <div className="activity-icon">
                            {activity.type === 'Sale' && <FaShoppingCart />}
                            {activity.type === 'Product' && <FaBox />}
                            {activity.type === 'Customer' && <FaUsers />}
                          </div>
                          <div className="activity-content">
                            <p className="activity-description">{description}</p>
                            <span className="activity-time">{getTimeAgo(activity.date)}</span>
                          </div>
                          {activity.amount && (
                            <div className="activity-amount">{activity.amount}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>{t.quickActions}</h2>
              </div>
              <div className="card-body">
                <div className="quick-actions">
                  <button 
                    className="action-btn primary"
                    onClick={() => navigate('/admin/sales')}
                  >
                    <FaShoppingCart /> {t.sales}
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={() => navigate('/sales/spareparts')}
                  >
                    <FaBox /> {t.add} {t.spareParts}
                  </button>
                  <button className="action-btn info">
                    <FaUsers /> {t.add} {t.customer}
                  </button>
                  <button className="action-btn warning">
                    <FaMoneyBillAlt /> {t.viewReports}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="summary-grid">
            <div className="summary-card">
              <h3>{t.todaySales}</h3>
              <p className="summary-value">{paymentStats.todaySalesCount}</p>
              <span className="summary-label">{paymentStats.todaySalesCount === 1 ? t.sale : t.sales} {t.approved.toLowerCase()}</span>
            </div>
            <div className="summary-card">
              <h3>{t.pending} {t.totalOrders}</h3>
              <p className="summary-value">{paymentStats.todayPendingOrdersCount}</p>
              <span className="summary-label">{paymentStats.todayPendingOrdersCount === 1 ? t.order : t.orders} {t.pending.toLowerCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

