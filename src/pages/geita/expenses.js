import { colors } from '../../utils/colors';
import React, { useState, useEffect, useMemo } from 'react';
import { useResponsiveSidebar } from '../../utils/useResponsiveSidebar';
import SidebarBackdrop from '../../components/SidebarBackdrop';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
} from 'react-icons/fa';
import './manager-layout.css';
import './expenses.css';
import { getExpenses, createExpense, updateExpense } from '../../services/api';
import { getCurrentDateTime } from '../../utils/dateTime';
import { useTranslation } from '../../utils/useTranslation';
import { canAccessBranch } from '../../utils/branchAuth';
import { BRANCH_GEITA } from '../../utils/branchLocations';
import { geitaLabels } from './geitaLabels';
import GeitaSidebar from './components/GeitaSidebar';
import GeitaPageHeader from './components/GeitaPageHeader';
import { PageLoader, InlineLoader } from '../../components/LoadingSpinner';

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

function emptyForm() {
  return {
    date: todayIso(),
    description: '',
    category: 'Other',
    amount: '',
    status: 'Pending',
  };
}

function ManagerExpenses() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const { sidebarOpen, isMobile, toggleSidebar, closeSidebar } = useResponsiveSidebar();
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentDateTime, setCurrentDateTime] = useState(getCurrentDateTime());
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm());

  useEffect(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        if (!canAccessBranch(parsedUser, 'geita')) {
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

  const loadExpenses = async () => {
    setDataLoading(true);
    try {
      const response = await getExpenses(BRANCH_GEITA);
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
      if (!q) return true;
      return (
        String(e.description || '').toLowerCase().includes(q) ||
        String(e.category || '').toLowerCase().includes(q) ||
        String(e.status || '').toLowerCase().includes(q)
      );
    });
  }, [expenses, searchTerm, statusFilter]);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const paidCount = expenses.filter((e) => String(e.status) === 'Paid').length;
  const pendingCount = expenses.filter((e) => String(e.status) !== 'Paid').length;

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
    setFormData({
      date: expense.date ? String(expense.date).slice(0, 10) : todayIso(),
      description: expense.description || '',
      category: expense.category || 'Other',
      amount: expense.amount != null ? String(expense.amount) : '',
      status: expense.status === 'Paid' ? 'Paid' : 'Pending',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const description = String(formData.description || '').trim();
    const category = String(formData.category || '').trim();
    const amountNum = parseFloat(String(formData.amount).replace(/,/g, ''));

    if (!description || !category) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Description and category are required.',
        confirmButtonColor: colors.primary,
      });
      return;
    }
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Amount must be a positive number.',
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
        location: BRANCH_GEITA,
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

  return (
    <div className="payments-container geita-portal">
      {isMobile && sidebarOpen ? <SidebarBackdrop onClose={closeSidebar} /> : null}
      <GeitaSidebar sidebarOpen={sidebarOpen} isMobile={isMobile} onNavClick={closeSidebar} />
      <div className="main-content">
        <GeitaPageHeader
          title={geitaLabels.pageTitles.expenses || t.expenses || 'Expenses'}
          user={user}
          currentDateTime={currentDateTime}
          onToggleSidebar={toggleSidebar}
          onLogout={handleLogout}
        />

        <div className="payments-content manager-expenses-page">
          <div className="manager-expenses-action-bar action-bar">
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
            <select
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">{t.filter || 'Filter'}: All</option>
              <option value="Pending">{t.pendingExpenses || 'Pending'}</option>
              <option value="Paid">{t.paidExpenses || 'Paid'}</option>
            </select>
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
                      <td colSpan="7" className="no-data loading-cell">
                        <InlineLoader message={t.loadingExpenses || 'Loading expenses...'} size="md" />
                      </td>
                    </tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
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
                          <td>{expense.description || '—'}</td>
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
          <div className="manager-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="manager-modal-header">
              <h3>
                {editingExpense
                  ? t.editExpense || 'Edit Expense'
                  : t.addExpense || 'Add Expense'}
              </h3>
              <button
                type="button"
                className="manager-modal-close"
                onClick={() => !saving && setShowModal(false)}
                disabled={saving}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="manager-expense-form">
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="geita-expense-date">{t.expenseDate || 'Expense Date'} *</label>
                  <input
                    id="geita-expense-date"
                    type="date"
                    required
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
                </div>
                <div className="form-field">
                  <label htmlFor="geita-expense-category">{t.expenseCategory || 'Category'} *</label>
                  <select
                    id="geita-expense-category"
                    required
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
              </div>
              <div className="form-field">
                <label htmlFor="geita-expense-description">
                  {t.expenseDescription || 'Description'} *
                </label>
                <textarea
                  id="geita-expense-description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t.expenseDescription || 'Description'}
                />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="geita-expense-amount">{t.expenseAmount || 'Amount'} (TZS) *</label>
                  <input
                    id="geita-expense-amount"
                    type="text"
                    inputMode="decimal"
                    required
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: e.target.value.replace(/[^\d.]/g, ''),
                      })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="geita-expense-status">{t.status || 'Status'}</label>
                  <select
                    id="geita-expense-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Pending">{t.pendingExpenses || 'Pending'}</option>
                    <option value="Paid">{t.paidExpenses || 'Paid'}</option>
                  </select>
                </div>
              </div>
              <div className="manager-modal-actions">
                <button
                  type="button"
                  className="action-btn cancel"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button type="submit" className="action-btn save" disabled={saving}>
                  {saving ? t.saving || 'Saving...' : t.save || 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerExpenses;
