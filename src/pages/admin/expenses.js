import { colors } from '../../utils/colors';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useResponsiveSidebar } from '../../utils/useResponsiveSidebar';
import SidebarBackdrop from '../../components/SidebarBackdrop';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  FaChartLine,
  FaBars,
  FaSignOutAlt,
  FaUser,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaCalendarAlt,
  FaTag,
  FaAlignLeft,
  FaCoins,
  FaTags,
  FaBox,
  FaShoppingCart,
  FaUsers,
  FaCog,
  FaChartBar,
  FaWallet,
  FaMapMarkerAlt,
  FaFilter,
  FaChevronDown,
} from 'react-icons/fa';
import './dashboard.css';
import './expenses.css';
import logo from '../../images/logo1.png';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../../services/api';
import { getCurrentDateTime } from '../../utils/dateTime';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageSelector from '../../components/LanguageSelector';
import { useTranslation } from '../../utils/useTranslation';
import { BRANCH_BOMA, BRANCH_GEITA, BRANCH_LOCATIONS } from '../../utils/branchLocations';
import { PageLoader, InlineLoader } from '../../components/LoadingSpinner';
import { BRAND_NAME } from '../../utils/brand';

const EXPENSE_CATEGORIES = [
  'Transport',
  'Utilities',
  'Rent',
  'Supplies',
  'Maintenance',
  'Fuel',
  'Salaries',
  'Other',
];

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatAmountWithCommas(value) {
  if (value === null || value === undefined || value === '') return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function parseAmountInput(value) {
  if (value == null || value === '') return NaN;
  return parseInt(String(value).replace(/,/g, ''), 10);
}

function emptyForm() {
  return {
    date: todayIso(),
    description: '',
    category: 'Other',
    amount: '',
    status: 'Pending',
    location: BRANCH_BOMA,
  };
}

function AdminExpenses() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const { sidebarOpen, isMobile, toggleSidebar, closeSidebar } = useResponsiveSidebar();
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [openFilter, setOpenFilter] = useState(null);
  const filtersRef = useRef(null);
  const [currentDateTime, setCurrentDateTime] = useState(getCurrentDateTime());
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm());

  useEffect(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    try {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.userType !== 'admin') {
        navigate('/login');
        return;
      }
    } catch {
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [navigate]);

  const loadExpenses = async () => {
    setDataLoading(true);
    try {
      const response = await getExpenses();
      if (response.success && Array.isArray(response.expenses)) {
        setExpenses(response.expenses);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      setExpenses([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load expenses.',
        confirmButtonColor: colors.primary,
      });
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    const dateTimeInterval = setInterval(() => setCurrentDateTime(getCurrentDateTime()), 1000);
    return () => clearInterval(dateTimeInterval);
  }, []);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setOpenFilter(null);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return Number.isNaN(num)
      ? '0'
      : num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatDate = (value) => {
    if (!value) return '—';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
      return d.toLocaleDateString('en-GB');
    } catch {
      return String(value).slice(0, 10);
    }
  };

  const filteredExpenses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return expenses.filter((e) => {
      if (statusFilter !== 'All' && String(e.status || '') !== statusFilter) return false;
      if (branchFilter !== 'All') {
        const loc = String(e.location || '').trim().toLowerCase();
        if (loc !== String(branchFilter).trim().toLowerCase()) return false;
      }
      if (!q) return true;
      return (
        String(e.description || '').toLowerCase().includes(q) ||
        String(e.category || '').toLowerCase().includes(q) ||
        String(e.status || '').toLowerCase().includes(q) ||
        String(e.location || '').toLowerCase().includes(q)
      );
    });
  }, [expenses, searchTerm, statusFilter, branchFilter]);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const paidCount = filteredExpenses.filter((e) => String(e.status) === 'Paid').length;
  const pendingCount = filteredExpenses.filter((e) => String(e.status) !== 'Paid').length;

  if (loading) {
    return <PageLoader message={t.loading || 'Loading...'} />;
  }
  if (!user) return null;

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: 'question',
      title: t.logout || 'Logout',
      text: t.areYouSureLogout || 'Are you sure you want to logout?',
      showCancelButton: true,
      confirmButtonColor: colors.error,
      cancelButtonColor: colors.textMuted,
      confirmButtonText: t.yesLogout || 'Yes, logout',
      cancelButtonText: t.cancel || 'Cancel',
    });
    if (!result.isConfirmed) return;
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setFormData(emptyForm());
    setShowModal(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    const loc = String(expense.location || '').trim();
    setFormData({
      date: expense.date ? String(expense.date).slice(0, 10) : todayIso(),
      description: expense.description || '',
      category: expense.category || 'Other',
      amount: formatAmountWithCommas(Math.round(Number(expense.amount) || 0)),
      status: expense.status === 'Paid' ? 'Paid' : 'Pending',
      location: BRANCH_LOCATIONS.includes(loc) ? loc : BRANCH_BOMA,
    });
    setShowModal(true);
  };

  const handleDelete = async (expense) => {
    const desc = String(expense?.description || '').trim();
    const label = desc
      ? desc.charAt(0).toUpperCase() + desc.slice(1)
      : 'this expense';
    const result = await Swal.fire({
      title: t.areYouSure || 'Are you sure?',
      text: `Do you want to delete "${label}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: colors.error,
      cancelButtonColor: colors.textMuted,
      confirmButtonText: t.yesDelete || 'Yes, delete it!',
      cancelButtonText: t.cancel || 'Cancel',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteExpense(expense.id);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to delete expense');
      }
      await loadExpenses();
      Swal.fire({
        icon: 'success',
        title: t.deleted || 'Deleted!',
        text: t.expenseDeleted || 'Expense has been deleted.',
        confirmButtonColor: colors.primary,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to delete expense.',
        confirmButtonColor: colors.primary,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const description = String(formData.description || '').trim();
    const category = String(formData.category || '').trim();
    const amountNum = parseAmountInput(formData.amount);
    const branchLocation = String(formData.location || '').trim();

    if (!description || !category) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Description and category are required.',
        confirmButtonColor: colors.primary,
      });
      return;
    }
    if (!BRANCH_LOCATIONS.includes(branchLocation)) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please select a branch location.',
        confirmButtonColor: colors.primary,
      });
      return;
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Amount must be a positive whole number.',
        confirmButtonColor: colors.primary,
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date: editingExpense ? formData.date || todayIso() : todayIso(),
        description,
        category,
        amount: amountNum,
        status: formData.status === 'Paid' ? 'Paid' : 'Pending',
        location: branchLocation,
        added_by: user?.id || null,
      };

      const response = editingExpense
        ? await updateExpense(editingExpense.id, payload)
        : await createExpense(payload);

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to save expense');
      }

      setShowModal(false);
      setEditingExpense(null);
      setFormData(emptyForm());
      await loadExpenses();
      Swal.fire({
        icon: 'success',
        title: t.saved || 'Saved',
        text: editingExpense
          ? t.expenseUpdated || 'Expense updated successfully.'
          : t.expenseSaved || 'Expense saved successfully.',
        confirmButtonColor: colors.primary,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error saving expense:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to save expense.',
        confirmButtonColor: colors.primary,
      });
    } finally {
      setSaving(false);
    }
  };

  const navClass = (path) =>
    'nav-item' + (location.pathname === path ? ' active' : '');

  const statusFilterOptions = [
    { value: 'All', label: t.allStatus || 'All Status', hint: 'Pending & paid expenses' },
    { value: 'Pending', label: t.pendingExpenses || 'Pending', hint: 'Awaiting payment' },
    { value: 'Paid', label: t.paidExpenses || 'Paid', hint: 'Paid expenses only' },
  ];

  const branchFilterOptions = [
    { value: 'All', label: t.allBranches || 'All Branches', hint: 'Boma & Geita' },
    { value: BRANCH_BOMA, label: t.bomaBranch || 'Boma Branch', hint: 'Boma expenses only' },
    { value: BRANCH_GEITA, label: t.geitaBranch || 'Geita Branch', hint: 'Geita expenses only' },
  ];

  const activeStatusOption =
    statusFilterOptions.find((opt) => opt.value === statusFilter) || statusFilterOptions[0];
  const activeBranchOption =
    branchFilterOptions.find((opt) => opt.value === branchFilter) || branchFilterOptions[0];

  const renderFilterDropdown = ({
    id,
    keyName,
    activeOption,
    options,
    isActive,
    onSelect,
    icon,
  }) => (
    <div
      className={`expense-filter-dropdown${isActive ? ' is-active' : ''}${
        openFilter === keyName ? ' is-open' : ''
      }`}
    >
      <button
        type="button"
        id={id}
        className="expense-filter-btn"
        onClick={() => setOpenFilter((prev) => (prev === keyName ? null : keyName))}
        aria-haspopup="listbox"
        aria-expanded={openFilter === keyName}
      >
        <FaFilter className="expense-filter-icon" aria-hidden="true" />
        <span className="expense-filter-label">{activeOption.label}</span>
        <FaChevronDown className="expense-filter-chevron" aria-hidden="true" />
      </button>
      {openFilter === keyName && (
        <ul className="expense-filter-menu" role="listbox">
          {options.map((opt) => (
            <li key={opt.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={activeOption.value === opt.value}
                className={`expense-filter-option${
                  activeOption.value === opt.value ? ' is-selected' : ''
                }`}
                onClick={() => {
                  onSelect(opt.value);
                  setOpenFilter(null);
                }}
              >
                {icon}
                <span className="expense-filter-option-text">
                  <span className="expense-filter-option-label">{opt.label}</span>
                  <span className="expense-filter-option-hint">{opt.hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="finance-dashboard-container admin-expenses-page">
      {isMobile && sidebarOpen ? <SidebarBackdrop onClose={closeSidebar} /> : null}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <img src={logo} alt="Logo" className="sidebar-logo" />
          <span className="sidebar-title">{BRAND_NAME}</span>
        </div>
        <nav className="sidebar-nav" onClick={isMobile ? closeSidebar : undefined}>
          <Link to="/admin/dashboard" className={navClass('/admin/dashboard')}>
            <FaChartLine className="nav-icon" />
            <span>{t.dashboard}</span>
          </Link>
          <Link to="/admin/categories-brands" className={navClass('/admin/categories-brands')}>
            <FaTags className="nav-icon" />
            <span>{t.categoriesBrands}</span>
          </Link>
          <Link to="/admin/spareparts" className={navClass('/admin/spareparts')}>
            <FaBox className="nav-icon" />
            <span>{t.spareParts}</span>
          </Link>
          <Link to="/admin/sales" className={navClass('/admin/sales')}>
            <FaShoppingCart className="nav-icon" />
            <span>{t.sales}</span>
          </Link>
          <Link to="/admin/employees" className={navClass('/admin/employees')}>
            <FaUsers className="nav-icon" />
            <span>{t.employees}</span>
          </Link>
          <Link to="/admin/transactions" className={navClass('/admin/transactions')}>
            <FaCalendarAlt className="nav-icon" />
            <span>{t.transactions}</span>
          </Link>
          <Link to="/admin/loans" className={navClass('/admin/loans')}>
            <FaMoneyBillWave className="nav-icon" />
            <span>{t.loans}</span>
          </Link>
          <Link to="/admin/expenses" className={navClass('/admin/expenses')}>
            <FaWallet className="nav-icon" />
            <span>{t.expenses || 'Expenses'}</span>
          </Link>
          <Link to="/admin/reports" className={navClass('/admin/reports')}>
            <FaChartBar className="nav-icon" />
            <span>{t.reports}</span>
          </Link>
          <Link to="/admin/settings" className={navClass('/admin/settings')}>
            <FaCog className="nav-icon" />
            <span>{t.settings}</span>
          </Link>
        </nav>
      </aside>

      <div className="main-content">
        <header className="finance-header">
          <div className="header-left">
            <button type="button" className="menu-toggle" onClick={toggleSidebar}>
              <FaBars />
            </button>
            <h1 className="page-title">{t.expenses || 'Expenses'}</h1>
          </div>
          <div className="header-right">
            <div style={{ marginRight: '15px' }}>
              <LanguageSelector />
            </div>
            <div
              className="date-time-display"
              style={{
                marginRight: '20px',
                fontSize: '14px',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <FaCalendarAlt style={{ fontSize: '16px' }} />
              <span>{currentDateTime}</span>
            </div>
            <ThemeToggle />
            <div className="user-menu">
              <FaUser className="user-icon" />
              <span className="user-name">{user?.username || user?.name || 'Admin'}</span>
              <button type="button" className="logout-btn" onClick={handleLogout} title={t.logout || 'Logout'}>
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </header>

        <div className="payments-content manager-expenses-page" style={{ padding: '20px' }}>
          <div className="manager-expenses-action-bar action-bar admin-expenses-action-bar">
            <div className="action-bar-search-group" ref={filtersRef}>
              <div className="search-box">
                <FaSearch className="search-icon" aria-hidden />
                <input
                  type="text"
                  className="search-input"
                  placeholder={t.searchExpenses || 'Search expenses...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {renderFilterDropdown({
                id: 'admin-expenses-branch-filter',
                keyName: 'branch',
                activeOption: activeBranchOption,
                options: branchFilterOptions,
                isActive: branchFilter !== 'All',
                onSelect: setBranchFilter,
                icon: <FaMapMarkerAlt className="expense-filter-option-icon" aria-hidden="true" />,
              })}
              {renderFilterDropdown({
                id: 'admin-expenses-status-filter',
                keyName: 'status',
                activeOption: activeStatusOption,
                options: statusFilterOptions,
                isActive: statusFilter !== 'All',
                onSelect: setStatusFilter,
                icon: <FaCheckCircle className="expense-filter-option-icon" aria-hidden="true" />,
              })}
            </div>
            <button type="button" className="action-btn add" onClick={openAddModal}>
              <FaPlus aria-hidden /> {t.addExpense || 'Add Expense'}
            </button>
          </div>

          <div className="stats-row manager-stats-row">
            <div className="stat-card">
              <div className="stat-info">
                <h3>{t.totalExpenses || 'Total Expenses'}</h3>
                <p className="stat-value">TZS {formatPrice(totalAmount)}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>{t.paidExpenses || 'Paid'}</h3>
                <p className="stat-value">{paidCount}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>{t.pendingExpenses || 'Pending'}</h3>
                <p className="stat-value">{pendingCount}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>{t.records || 'Records'}</h3>
                <p className="stat-value">{filteredExpenses.length}</p>
              </div>
            </div>
          </div>

          <section className="manager-expenses-section">
            <h3 className="manager-section-title">
              <FaMoneyBillWave aria-hidden /> {t.expenses || 'Expenses'}
            </h3>
            <div className="table-container">
              <table className="payments-table manager-expenses-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>{t.expenseDate || 'Date'}</th>
                    <th>{t.branch || 'Branch'}</th>
                    <th>{t.expenseDescription || 'Description'}</th>
                    <th>{t.expenseCategory || 'Category'}</th>
                    <th>{t.expenseAmount || 'Amount'} (TZS)</th>
                    <th>{t.status || 'Status'}</th>
                    <th className="manager-col-actions">{t.actions || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {dataLoading ? (
                    <tr>
                      <td colSpan="8" className="no-data loading-cell">
                        <InlineLoader message={t.loadingExpenses || 'Loading expenses...'} size="md" />
                      </td>
                    </tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-data">
                        {t.noExpensesFound || 'No expenses found'}
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((expense, index) => {
                      const isPaid = String(expense.status) === 'Paid';
                      return (
                        <tr key={expense.id}>
                          <td>{index + 1}</td>
                          <td>{formatDate(expense.date)}</td>
                          <td>{expense.location || '—'}</td>
                          <td>
                            {expense.description
                              ? String(expense.description).charAt(0).toUpperCase() +
                                String(expense.description).slice(1)
                              : '—'}
                          </td>
                          <td>{expense.category || '—'}</td>
                          <td>{formatPrice(expense.amount)}</td>
                          <td>
                            <span className={`status-badge ${isPaid ? 'paid' : 'pending'}`}>
                              {isPaid ? <FaCheckCircle aria-hidden /> : <FaClock aria-hidden />}
                              {isPaid ? t.paidExpenses || 'Paid' : t.pendingExpenses || 'Pending'}
                            </span>
                          </td>
                          <td className="manager-col-actions">
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="action-btn edit"
                                title={t.edit || 'Edit'}
                                onClick={() => openEditModal(expense)}
                              >
                                <FaEdit />
                              </button>
                              <button
                                type="button"
                                className="action-btn delete"
                                title={t.delete || 'Delete'}
                                onClick={() => handleDelete(expense)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {showModal && (
        <div className="manager-modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div
            className="manager-modal-content manager-expense-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-expense-modal-title"
          >
            <div className="manager-expense-modal-header">
              <div className="manager-expense-modal-title">
                <span className="manager-expense-modal-icon" aria-hidden="true">
                  {editingExpense ? <FaEdit /> : <FaMoneyBillWave />}
                </span>
                <div>
                  <h3 id="admin-expense-modal-title">
                    {editingExpense
                      ? t.editExpense || 'Edit Expense'
                      : t.addExpense || 'Add Expense'}
                  </h3>
                  <p className="manager-expense-modal-subtitle">
                    {editingExpense
                      ? 'Update expense details for any branch'
                      : 'Record a new expense · date is today only'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="manager-modal-close"
                onClick={() => !saving && setShowModal(false)}
                disabled={saving}
                aria-label={t.close || 'Close'}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="manager-expense-form">
              <div className="manager-expense-form-body">
                <div className="manager-expense-form-row">
                  <div className="manager-expense-field">
                    <label htmlFor="admin-expense-date">
                      <FaCalendarAlt aria-hidden /> {t.expenseDate || 'Expense Date'} *
                    </label>
                    <div className={`manager-expense-date-wrap${!editingExpense ? ' is-locked' : ''}`}>
                      <input
                        id="admin-expense-date"
                        type="date"
                        required
                        className="manager-expense-input"
                        value={editingExpense ? formData.date : todayIso()}
                        min={!editingExpense ? todayIso() : undefined}
                        max={!editingExpense ? todayIso() : undefined}
                        readOnly={!editingExpense}
                        onChange={(e) => {
                          if (editingExpense) {
                            setFormData({ ...formData, date: e.target.value });
                          }
                        }}
                      />
                      {!editingExpense && (
                        <span className="manager-expense-date-hint">Today only</span>
                      )}
                    </div>
                  </div>

                  <div className="manager-expense-field">
                    <label htmlFor="admin-expense-location">
                      <FaMapMarkerAlt aria-hidden /> {t.branch || 'Branch'} *
                    </label>
                    <select
                      id="admin-expense-location"
                      required
                      className="manager-expense-input"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    >
                      {BRANCH_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="manager-expense-form-row">
                  <div className="manager-expense-field">
                    <label htmlFor="admin-expense-category">
                      <FaTag aria-hidden /> {t.expenseCategory || 'Category'} *
                    </label>
                    <select
                      id="admin-expense-category"
                      required
                      className="manager-expense-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="manager-expense-field">
                    <label htmlFor="admin-expense-amount">
                      <FaCoins aria-hidden /> {t.expenseAmount || 'Amount'} *
                    </label>
                    <div className="manager-expense-amount-wrap">
                      <span className="manager-expense-currency">TZS</span>
                      <input
                        id="admin-expense-amount"
                        type="text"
                        inputMode="numeric"
                        required
                        className="manager-expense-input manager-expense-amount-input"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            amount: formatAmountWithCommas(e.target.value),
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="manager-expense-field">
                  <label htmlFor="admin-expense-description">
                    <FaAlignLeft aria-hidden /> {t.expenseDescription || 'Description'} *
                  </label>
                  <textarea
                    id="admin-expense-description"
                    required
                    className="manager-expense-input manager-expense-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Office supplies, fuel for delivery..."
                    rows={3}
                  />
                </div>

                <div className="manager-expense-field">
                  <label htmlFor="admin-expense-status">
                    <FaCheckCircle aria-hidden /> {t.status || 'Status'}
                  </label>
                  <div className="manager-expense-status-options" role="group">
                    <button
                      type="button"
                      className={`manager-expense-status-chip pending${
                        formData.status !== 'Paid' ? ' is-active' : ''
                      }`}
                      onClick={() => setFormData({ ...formData, status: 'Pending' })}
                    >
                      <FaClock aria-hidden /> {t.pendingExpenses || 'Pending'}
                    </button>
                    <button
                      type="button"
                      className={`manager-expense-status-chip paid${
                        formData.status === 'Paid' ? ' is-active' : ''
                      }`}
                      onClick={() => setFormData({ ...formData, status: 'Paid' })}
                    >
                      <FaCheckCircle aria-hidden /> {t.paidExpenses || 'Paid'}
                    </button>
                  </div>
                  <select
                    id="admin-expense-status"
                    className="sr-only"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <option value="Pending">{t.pendingExpenses || 'Pending'}</option>
                    <option value="Paid">{t.paidExpenses || 'Paid'}</option>
                  </select>
                </div>
              </div>

              <div className="manager-expense-modal-footer">
                <button
                  type="button"
                  className="manager-expense-btn secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button type="submit" className="manager-expense-btn primary" disabled={saving}>
                  {saving
                    ? t.saving || 'Saving...'
                    : editingExpense
                      ? t.save || 'Save'
                      : t.addExpense || 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminExpenses;
