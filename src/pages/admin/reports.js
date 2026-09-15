import { colors } from '../../utils/colors';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  FaCog,
  FaUser,
  FaTags,
  FaCalendarAlt,
  FaBell,
  FaChartBar,
  FaPrint,
  FaDownload,
  FaSearch,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaReceipt,
  FaUndo,
  FaWallet,
  FaChevronDown,
  FaMapMarkerAlt,
  FaCheck,
  FaGlobeAfrica,
} from 'react-icons/fa';
import './dashboard.css';
import './reports.css';
import logo from '../../images/logo1.png';
import { getCurrentDateTime } from '../../utils/dateTime';
import { useTranslation } from '../../utils/useTranslation';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageSelector from '../../components/LanguageSelector';
import BrandDatePicker from '../../components/BrandDatePicker';
import { getUnviewedOperationsCount } from '../../utils/notifications';
import { getPayments, getEmployees, getExpenses, getSpareParts } from '../../services/api';
import { PageLoader } from '../../components/LoadingSpinner';
import { BRAND_NAME, DEFAULT_SUPPLIER, getPrintCompanyHtml } from '../../utils/brand';
import { BRANCH_BOMA, BRANCH_GEITA } from '../../utils/branchLocations';
import {
  ensureLogoDataUrl,
  openPrintWindowWithLogo,
  logoImgHtml,
  PRINT_LOGO_CSS,
} from '../../utils/printLogo';

/** Normalize expense/API date values to YYYY-MM-DD. */
function toExpenseDateOnly(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string') {
    const m = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function AdminReports() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [user, setUser] = useState(null);
  const { sidebarOpen, isMobile, toggleSidebar, closeSidebar } = useResponsiveSidebar();
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [payments, setPayments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const locationSelectRef = useRef(null);

  const locationOptions = useMemo(
    () => [
      { value: '', label: 'All Locations', hint: 'Boma & Geita', icon: 'all' },
      { value: BRANCH_BOMA, label: BRANCH_BOMA, hint: 'Boma branch only', icon: 'branch' },
      { value: BRANCH_GEITA, label: BRANCH_GEITA, hint: 'Geita branch only', icon: 'branch' },
    ],
    []
  );

  useEffect(() => {
    if (!locationMenuOpen) return undefined;
    const onPointerDown = (event) => {
      if (locationSelectRef.current && !locationSelectRef.current.contains(event.target)) {
        setLocationMenuOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setLocationMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [locationMenuOpen]);

  useEffect(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.userType !== 'admin') {
        navigate('/login');
        return;
      }
    } catch (error) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        const [paymentsRes, employeesRes] = await Promise.all([
          getPayments(),
          getEmployees()
        ]);
        if (paymentsRes?.success) setPayments(paymentsRes.payments || []);
        if (employeesRes?.success) setEmployees(employeesRes.employees || []);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: t.error || 'Error',
          text: error.message || 'Failed to load reports data.',
          confirmButtonColor: colors.primary
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate, t.error]);

  useEffect(() => {
    setCurrentDateTime(getCurrentDateTime());
    const interval = setInterval(() => setCurrentDateTime(getCurrentDateTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const count = await getUnviewedOperationsCount();
        setNotificationCount(count || 0);
      } catch (error) {
        setNotificationCount(0);
      }
    };
    loadNotifications();
  }, []);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: t.logout || 'Logout',
      text: t.confirmLogout || 'Are you sure you want to logout?',
      icon: 'warning',
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

  const summaryCards = useMemo(() => {
    const approvedPayments = payments.filter((p) => p.status === 'Approved');
    const totalSales = approvedPayments.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
    const loanPayments = payments.filter((p) => String(p.payment_type || '').toLowerCase() === 'loan');
    const outstandingLoans = loanPayments.filter((p) => (Number(p.amount_remain) || 0) > 0);

    return [
      { title: t.sales || 'Sales', value: `TZS ${Math.round(totalSales).toLocaleString()}`, icon: <FaShoppingCart />, tone: 'red' },
      { title: t.loans || 'Loans Outstanding', value: outstandingLoans.length, icon: <FaMoneyBillWave />, tone: 'red' }
    ];
  }, [payments, t]);

  const reportActions = [
    {
      title: t.transactions || 'Transactions Report',
      description: 'View and export transaction-level analytics.',
      route: '/admin/transactions',
      icon: <FaReceipt />
    },
    {
      title: t.sales || 'Sales Performance',
      description: 'Analyze product movement and sales trends.',
      route: '/admin/sales',
      icon: <FaShoppingCart />
    },
    {
      title: t.dashboard || 'Executive Overview',
      description: 'Back to dashboard with key metrics at a glance.',
      route: '/admin/dashboard',
      icon: <FaChartLine />
    }
  ];

  const datePeriodHint =
    dateFrom && dateTo
      ? `${dateFrom} → ${dateTo}`
      : dateFrom
        ? `From ${dateFrom}`
        : dateTo
          ? `Until ${dateTo}`
          : 'All time';

  const selectedLocationOption =
    locationOptions.find((opt) => opt.value === locationFilter) || locationOptions[0];
  const selectedLocationLabel = selectedLocationOption.label;

  const periodHint = [datePeriodHint, locationFilter || null].filter(Boolean).join(' · ');

  const selectLocationFilter = (value) => {
    setLocationFilter(value);
    setLocationMenuOpen(false);
  };

  const isInDateRange = (dateValue) => {
    if (!dateFrom && !dateTo) return true;
    if (!dateValue) return false;
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return false;
    const dayOnly = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (dateFrom && dayOnly < dateFrom) return false;
    if (dateTo && dayOnly > dateTo) return false;
    return true;
  };

  const matchesLocation = (record) => {
    if (!locationFilter) return true;
    return (
      String(record?.location || '').trim().toLowerCase() ===
      String(locationFilter).trim().toLowerCase()
    );
  };

  const matchesSearch = (p) => {
    const term = String(searchTerm || '').trim().toLowerCase();
    if (!term) return true;
    return (
      String(p.customer_name || '').toLowerCase().includes(term) ||
      String(p.customer_phone || '').toLowerCase().includes(term) ||
      String(p.payment_method || '').toLowerCase().includes(term) ||
      String(p.payment_type || '').toLowerCase().includes(term) ||
      String(p.sparepart_name || '').toLowerCase().includes(term) ||
      String(p.sparepart_number || '').toLowerCase().includes(term) ||
      String(p.status || '').toLowerCase().includes(term)
    );
  };

  const escapePrintCell = (value) => String(value ?? '').replace(/</g, '&lt;');

  /** Employee who created the sale: payment fields or lookup by employee_id */
  const getSalesEmployeeName = (p) => {
    const direct = String(p.employee_name || p.employee_username || '').trim();
    if (direct) return escapePrintCell(direct);
    const eid = p.employee_id;
    if (eid != null && employees.length) {
      const emp = employees.find((e) => String(e.id) === String(eid));
      if (emp) {
        const n = String(emp.full_name || emp.name || emp.username || '').trim();
        if (n) return escapePrintCell(n);
      }
    }
    return '—';
  };

  const reportFileStamp = () => {
    const parts = [];
    if (dateFrom && dateTo) parts.push(`${dateFrom}_to_${dateTo}`);
    else if (dateFrom) parts.push(`from_${dateFrom}`);
    else if (dateTo) parts.push(`until_${dateTo}`);
    else {
      const d = new Date();
      parts.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      );
    }
    if (locationFilter) parts.push(String(locationFilter).toLowerCase());
    return parts.join('_');
  };

  const downloadHtmlDocument = (html, filename) => {
    try {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to download document. Please try again.',
        confirmButtonColor: colors.primary
      });
    }
  };

  const buildSimpleReportHtml = (title, rowsHtml, footerHtml, disclaimer) => `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; font-size: 11px; color:#222; }
        .top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; border-bottom:2px solid #333; padding-bottom:14px; }
        .left { display:flex; gap:14px; align-items:flex-start; }
        .logo { width:56px; height:56px; object-fit:contain; }
        .company h2 { margin: 0 0 6px 0; font-size: 1.15rem; font-weight: 700; }
        .tax-inv-address { margin: 0; color: #444; font-size: 10px; line-height: 1.5; }
        .tax-inv-contact { margin-top: 8px; font-size: 10px; color: #555; }
        .tax-inv-contact span { margin-right: 16px; }
        .meta { text-align:right; min-width:160px; }
        .meta p { margin: 0 0 6px 0; font-size: 11px; }
        .location-badge {
          display:inline-block; margin-top:6px; padding:4px 10px; border-radius:999px;
          background:#562731; color:#fefefe; font-weight:700; font-size:11px; letter-spacing:0.03em;
        }
        .title { text-align:center; font-size:1.5rem; font-weight:700; margin:16px 0 8px 0; }
        .subtitle { text-align:center; font-size:0.95rem; color:#444; margin:0 0 18px 0; }
        table { width:100%; border-collapse:collapse; border:1px solid #333; margin-bottom:16px; }
        th, td { border:1px solid #333; padding:6px 8px; }
        th { background:#f0f0f0; }
        .tr { text-align:right; } .tc { text-align:center; } .tl { text-align:left; }
        .footer { border-top:1px solid #ccc; padding-top:10px; margin-top:10px; }
      </style></head><body>
      <div class="top">
        <div class="left"><img src="${logo}" class="logo" alt="logo"/>${getPrintCompanyHtml('company')}</div>
        <div class="meta">
          <p><strong>Period:</strong> ${String(datePeriodHint).replace(/</g, '&lt;')}</p>
          <p><strong>Location:</strong> ${String(selectedLocationLabel).replace(/</g, '&lt;')}</p>
          <p><strong>Printed:</strong> ${new Date().toLocaleString('en-GB')}</p>
          <div class="location-badge">${String(selectedLocationLabel).replace(/</g, '&lt;')}</div>
        </div>
      </div>
      <div class="title">${title}</div>
      <p class="subtitle">Branch / location: <strong>${String(selectedLocationLabel).replace(/</g, '&lt;')}</strong></p>
      <table>${rowsHtml}</table>
      <div class="footer">${footerHtml}</div>
      <p style="margin-top:20px;font-style:italic;color:#666;">${disclaimer}</p>
      </body></html>`;

  const emitSimpleReport = (title, rowsHtml, footerHtml, disclaimer, mode, filename) => {
    const html = buildSimpleReportHtml(title, rowsHtml, footerHtml, disclaimer);
    if (mode === 'download') {
      downloadHtmlDocument(html, filename);
      return;
    }
    const w = window.open('', '_blank', 'width=1000,height=700');
    if (!w) {
      Swal.fire({
        icon: 'warning',
        title: 'Popup Blocked',
        text: 'Please allow popups to open print reports.',
        confirmButtonColor: colors.primary
      });
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount || 0);

  const getStatusLabel = (status) => {
    if (status === 'Approved') return t.approved || 'Approved';
    if (status === 'Pending') return t.pending || 'Pending';
    if (status === 'Rejected') return t.rejected || 'Rejected';
    if (status === 'Returned') return 'Returned';
    return status || '';
  };

  const getRecordDateForReports = (payment) => {
    if (!payment) return null;
    const isLoan = String(payment?.payment_type ?? '').trim().toLowerCase() === 'loan';
    if (isLoan) return payment.updated_at || payment.created_at;
    if (payment.approved_at || payment.approvedAt || payment.confirmed_at) {
      return payment.approved_at || payment.approvedAt || payment.confirmed_at;
    }
    return payment.created_at;
  };

  const toNumPayment = (v) => (v == null || v === '' ? 0 : Number(v)) || 0;

  const getPaymentChannelsList = (p) => {
    if (!p) return [];
    return [
      { label: t.cash || 'Cash', val: toNumPayment(p.cash) },
      { label: t.bankTransfer || 'Bank Transfer', val: toNumPayment(p.bank_transfer) },
      { label: t.airtelMoney || 'Airtel Money', val: toNumPayment(p.airtel_money) },
      { label: 'M-Pesa', val: toNumPayment(p.mpesa) },
      { label: t.mixByYas || 'Mix by YAS', val: toNumPayment(p.mix_by_yas) }
    ].filter((c) => c.val > 0);
  };

  const allocateLoanChannelAmounts = (amount, paymentMethod) => {
    const amt = Number(amount) || 0;
    const empty = {
      cash: 0,
      bank_transfer: 0,
      airtel_money: 0,
      mpesa: 0,
      mix_by_yas: 0,
      credit: 0
    };
    if (amt <= 0) return empty;
    const m = String(paymentMethod || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
    if (m === 'cash') return { ...empty, cash: amt };
    if (m === 'bank transfer') return { ...empty, bank_transfer: amt };
    if (m === 'airtel money') return { ...empty, airtel_money: amt };
    if (m === 'm-pesa' || m === 'mpesa') return { ...empty, mpesa: amt };
    if (m.includes('mix') && m.includes('yas')) return { ...empty, mix_by_yas: amt };
    if (m === 'credit card' || m === 'credit') return { ...empty, credit: amt };
    return empty;
  };

  const paymentMethodForPrintRow = (p) => {
    const isLoan = String(p?.payment_type ?? '').trim().toLowerCase() === 'loan';
    const ch = getPaymentChannelsList(p);
    if (ch.length >= 2) {
      return ch.map((c) => `${c.label} ${formatCurrency(c.val)}`).join('\n');
    }
    if (ch.length === 1) {
      const amt = isLoan
        ? Number(p?.amount_received_in_range) || Number(p?.amount_received) || ch[0].val
        : ch[0].val;
      return `${ch[0].label} · ${formatCurrency(amt)}`;
    }
    const method = String(p?.payment_method || '—').trim() || '—';
    if (isLoan) {
      const inRange = Number(p?.amount_received_in_range) || Number(p?.amount_received) || 0;
      if (inRange > 0) return `${method} · ${formatCurrency(inRange)}`;
      return method;
    }
    const amt = Number(p?.amount_received) || 0;
    if (amt > 0) return `${method} · ${formatCurrency(amt)}`;
    return method;
  };

  const amountReceivedSumForPrintRow = (p) => {
    const isLoan = String(p?.payment_type ?? '').trim().toLowerCase() === 'loan';
    if (isLoan) {
      return Number(p?.amount_received_in_range) || Number(p?.amount_received) || 0;
    }
    const ch = getPaymentChannelsList(p);
    if (ch.length >= 1) {
      return ch.reduce((s, c) => s + c.val, 0);
    }
    return Number(p?.amount_received) || 0;
  };

  const getLoanAmountRemainForDisplay = (p) => {
    const dbRemain = p?.amount_remain != null ? Number(p.amount_remain) : null;
    if (dbRemain != null && !Number.isNaN(dbRemain)) return Math.max(0, dbRemain);
    const received = Number(p?.amount_received) || 0;
    const total = Number(p?.total_amount) || 0;
    const discount = Number(p?.discount_amount) || 0;
    return Math.max(0, total - discount - received);
  };

  /** Profits earned: Σ qty × (wholesale|retail sell price − buying price). */
  const computeProfitsEarnedFromPayments = (paymentRows, spareParts = []) => {
    const parseNum = (v) => {
      if (v == null || v === '') return 0;
      const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
      return Number.isFinite(n) ? n : 0;
    };

    const spareById = new Map();
    for (const part of spareParts || []) {
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

    let profit = 0;
    for (const p of paymentRows || []) {
      if (String(p.status || '').trim() !== 'Approved') continue;
      const priceType = String(p.price_type || 'retail').trim().toLowerCase();
      for (const item of getPaymentItems(p)) {
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
    return Math.round(profit * 100) / 100;
  };

  const buildPrintSummaryFromApprovedRows = (approvedRows) => {
    const toN = (v) => Number(v) || 0;
    const isLoanT = (p) => String(p?.payment_type ?? '').trim().toLowerCase() === 'loan';
    const isSalesT = (p) => String(p?.payment_type ?? '').trim().toLowerCase() === 'sales';
    const loanReceivedForPrint = (p) =>
      toN(p.amount_received_in_range) || toN(p.amount_received);

    const receiptsSales = approvedRows.filter((p) => isSalesT(p) && p.status !== 'Pending');
    const loanPaidRows = approvedRows.filter((p) => {
      if (p.status !== 'Approved') return false;
      const received = loanReceivedForPrint(p);
      if (received <= 0) return false;
      if (!isLoanT(p)) return false;
      const total = Number(p.total_amount) || 0;
      const discount = Number(p.discount_amount) || 0;
      const netDue = Math.max(0, total - discount);
      if (netDue <= 0) return false;
      const remain = getLoanAmountRemainForDisplay(p);
      if (Number.isNaN(remain)) return false;
      return remain === 0 || remain > 0;
    });

    const cashTotal = receiptsSales.reduce((s, p) => s + toN(p.cash), 0);
    const bankTotal = receiptsSales.reduce((s, p) => s + toN(p.bank_transfer), 0);
    const airtelTotal = receiptsSales.reduce((s, p) => s + toN(p.airtel_money), 0);
    const mpesaTotal = receiptsSales.reduce((s, p) => s + toN(p.mpesa), 0);
    const yasTotal = receiptsSales.reduce((s, p) => s + toN(p.mix_by_yas), 0);
    const totalDirectSales = cashTotal + bankTotal + airtelTotal + mpesaTotal + yasTotal;
    const loanPaidTotal = loanPaidRows.reduce((s, p) => s + loanReceivedForPrint(p), 0);

    const getLoanChannelsForSummary = (p) => {
      const received = loanReceivedForPrint(p);
      const base = {
        cash: toN(p.cash),
        bank_transfer: toN(p.bank_transfer),
        airtel_money: toN(p.airtel_money),
        mpesa: toN(p.mpesa),
        mix_by_yas: toN(p.mix_by_yas)
      };
      const channelSum =
        base.cash + base.bank_transfer + base.airtel_money + base.mpesa + base.mix_by_yas;
      const methodLower = String(p?.payment_method || '')
        .trim()
        .toLowerCase();
      const isMixedMethod = methodLower === 'mixed' || methodLower === 'loan';
      const channelCount = [
        base.cash,
        base.bank_transfer,
        base.airtel_money,
        base.mpesa,
        base.mix_by_yas
      ].filter((v) => v > 0).length;

      if (received > 0 && channelSum > 0 && (isMixedMethod || channelCount >= 2 || channelSum === received)) {
        if (channelSum === received) return { ...base, credit: 0 };
        const scale = received / channelSum;
        return {
          cash: base.cash * scale,
          bank_transfer: base.bank_transfer * scale,
          airtel_money: base.airtel_money * scale,
          mpesa: base.mpesa * scale,
          mix_by_yas: base.mix_by_yas * scale,
          credit: 0
        };
      }
      if (received > 0) return allocateLoanChannelAmounts(received, p.payment_method);
      return { ...base, credit: 0 };
    };

    const loanPaidChannels = loanPaidRows.map(getLoanChannelsForSummary);
    const loanPaidCashTotal = loanPaidChannels.reduce((s, c) => s + c.cash, 0);
    const loanPaidBankTotal = loanPaidChannels.reduce((s, c) => s + c.bank_transfer, 0);
    const loanPaidAirtelTotal = loanPaidChannels.reduce((s, c) => s + c.airtel_money, 0);
    const loanPaidMpesaTotal = loanPaidChannels.reduce((s, c) => s + c.mpesa, 0);
    const loanPaidYasTotal = loanPaidChannels.reduce((s, c) => s + c.mix_by_yas, 0);
    const loanPaidCreditTotal = loanPaidChannels.reduce((s, c) => s + c.credit, 0);
    const totalAmount = totalDirectSales + loanPaidTotal;

    return {
      cashTotal,
      bankTotal,
      airtelTotal,
      mpesaTotal,
      yasTotal,
      totalDirectSales,
      loanPaidCashTotal,
      loanPaidBankTotal,
      loanPaidAirtelTotal,
      loanPaidMpesaTotal,
      loanPaidYasTotal,
      loanPaidCreditTotal,
      loanPaidTotal,
      totalAmount
    };
  };

  const handleSalesReport = (mode = 'print') => {
    const rows = payments.filter((p) =>
      String(p.payment_type || '').toLowerCase() === 'sales' &&
      isInDateRange(p.created_at || p.updated_at) &&
      matchesLocation(p) &&
      matchesSearch(p)
    );
    const total = rows.reduce((s, p) => s + (Number(p.total_amount) || 0), 0);
    const body =
      '<thead><tr><th class="tc">#</th><th class="tl">Date</th><th class="tl">Customer</th><th class="tl">Employee</th><th class="tl">Method</th><th class="tr">Amount (TZS)</th><th class="tl">Status</th></tr></thead><tbody>' +
      (rows.length
        ? rows.map((p, i) => `<tr><td class="tc">${i + 1}</td><td>${String(p.created_at || '').replace('T', ' ').slice(0, 16)}</td><td>${String(p.customer_name || '—').replace(/</g, '&lt;')}</td><td>${getSalesEmployeeName(p)}</td><td>${String(p.payment_method || '—').replace(/</g, '&lt;')}</td><td class="tr">${Math.round(Number(p.total_amount) || 0).toLocaleString()}</td><td>${p.status || '—'}</td></tr>`).join('')
        : '<tr><td colspan="7" class="tc">No sales records found</td></tr>') +
      '</tbody>';
    emitSimpleReport(
      `SALES REPORT — ${selectedLocationLabel}`,
      body,
      `<strong>Total Sales (TZS):</strong> ${Math.round(total).toLocaleString()}`,
      '*This is a computer generated sales report, hence no signature is required.*',
      mode,
      `admin-sales-report-${reportFileStamp()}.html`
    );
  };

  const handlePrintSalesReport = () => handleSalesReport('print');
  const handleDownloadSalesReport = () => handleSalesReport('download');

  const handleTransactionsReport = async (mode = 'print') => {
    const periodLabel = datePeriodHint;
    const locationLabel = selectedLocationLabel;
    const printedBy = String(user?.full_name || user?.name || user?.username || 'Admin').replace(
      /</g,
      '&lt;'
    );

    let sourcePayments = payments;
    try {
      const query = {};
      if (dateFrom) query.receivedSumFrom = dateFrom;
      if (dateTo || dateFrom) query.receivedSumTo = dateTo || dateFrom;
      if (locationFilter) query.location = locationFilter;
      if (query.receivedSumFrom || query.receivedSumTo || query.location) {
        const refresh = await getPayments(query);
        if (refresh?.success && Array.isArray(refresh.payments)) {
          sourcePayments = refresh.payments;
        }
      }
    } catch (error) {
      console.error('Error refreshing payments for transaction report:', error);
    }

    const printedRows = sourcePayments.filter((p) => {
      const isVisibleStatus = p.status === 'Approved' || p.status === 'Returned';
      if (!isVisibleStatus) return false;
      if (!isInDateRange(getRecordDateForReports(p))) return false;
      if (!matchesLocation(p)) return false;
      if (!matchesSearch(p)) return false;
      const isLoanWithZeroReceived =
        String(p?.payment_type ?? '').trim().toLowerCase() === 'loan' &&
        amountReceivedSumForPrintRow(p) <= 0;
      return !isLoanWithZeroReceived;
    });

    const approvedForSummary = printedRows.filter((p) => p.status === 'Approved');
    const printSummary = buildPrintSummaryFromApprovedRows(approvedForSummary);
    const summaryScopeNote = `<div class="tax-inv-footer-row"><label>Summary scope:</label> Approved transactions for ${String(
      periodLabel
    ).replace(/</g, '&lt;')} · Location: ${String(locationLabel).replace(/</g, '&lt;')} (same as listed above).</div>`;

    let periodExpenses = [];
    try {
      const expensesResponse = await getExpenses(locationFilter || null, { status: 'Paid' });
      const allPaid = Array.isArray(expensesResponse?.expenses) ? expensesResponse.expenses : [];
      periodExpenses = allPaid.filter((e) => {
        const statusOk = String(e.status || '').trim().toLowerCase() === 'paid';
        if (!statusOk) return false;
        if (!matchesLocation(e)) return false;
        const expenseDay = toExpenseDateOnly(e.date);
        const createdDay = toExpenseDateOnly(e.created_at);
        const inRange =
          isInDateRange(expenseDay || null) || isInDateRange(createdDay || null);
        // When no date filter, include all paid expenses
        if (!dateFrom && !dateTo) return true;
        return inRange;
      });
    } catch (error) {
      console.error('Error loading expenses for print:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load expenses from database.',
        confirmButtonColor: colors.primary
      });
      return;
    }

    const totalTodayExpenses = periodExpenses.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    );
    const totalRefundedAmount = printedRows.reduce(
      (sum, p) => sum + Math.max(0, Number(p.return_amount) || 0),
      0
    );
    const totalTodayIncome =
      (Number(printSummary.totalAmount) || 0) - totalTodayExpenses - totalRefundedAmount;

    let sparePartsForProfit = [];
    try {
      const sparePartsResponse = await getSpareParts();
      if (sparePartsResponse?.success && Array.isArray(sparePartsResponse.spareParts)) {
        sparePartsForProfit = sparePartsResponse.spareParts;
      }
    } catch (error) {
      console.error('Error loading spare parts for profit summary:', error);
    }
    const profitsEarned = computeProfitsEarnedFromPayments(
      approvedForSummary,
      sparePartsForProfit
    );

    const tableHeader = `
            <thead>
              <tr>
                <th class="tc">S.No</th>
                <th class="tl">Date</th>
                <th class="tl">Customer</th>
                <th class="tl">Items</th>
                <th class="tc">Payment type</th>
                <th class="tc">Payment method</th>
                <th class="tr">Amount received (TZS)</th>
                <th class="tr">Amount remain (TZS)</th>
                <th class="tr">Amount refunded (TZS)</th>
                <th class="tl">Status</th>
              </tr>
            </thead>`;

    const rowsHtml =
      printedRows.length === 0
        ? '<tbody><tr><td colspan="10" style="text-align:center;padding:12px;">No transactions found</td></tr></tbody>'
        : '<tbody>' +
          printedRows
            .map((p, idx) => {
              const items =
                p.items && p.items.length > 0
                  ? p.items
                      .map((item) => (item.sparepart_name || 'Unknown').replace(/</g, '&lt;'))
                      .join('<br />')
                  : (p.sparepart_name || '—').replace(/</g, '&lt;');
              const paymentType = String(p.payment_type || '—').replace(/</g, '&lt;');
              const paymentMethodCell = String(paymentMethodForPrintRow(p) || '—')
                .replace(/</g, '&lt;')
                .replace(/\n/g, '<br />');
              const printableStatus =
                p.status === 'Returned' || Number(p.return_amount) > 0
                  ? 'Returned'
                  : getStatusLabel(p.status);
              const amountRemain =
                p.amount_remain != null
                  ? Math.max(0, Number(p.amount_remain) || 0)
                  : Math.max(
                      0,
                      (Number(p.total_amount) || 0) -
                        (Number(p.discount_amount) || 0) -
                        (Number(p.amount_received) || 0)
                    );
              const amountRefunded = Math.max(0, Number(p.return_amount) || 0);
              const recordDate = getRecordDateForReports(p);
              return `
                <tr>
                  <td class="tc">${idx + 1}</td>
                  <td class="tl">${recordDate ? String(recordDate).replace('T', ' ').slice(0, 16) : ''}</td>
                  <td class="tl">${(p.customer_name || '—').toUpperCase().replace(/</g, '&lt;')}</td>
                  <td class="tl">${items}</td>
                  <td class="tc">${paymentType}</td>
                  <td class="tc">${paymentMethodCell}</td>
                  <td class="tr">${formatCurrency(amountReceivedSumForPrintRow(p))}</td>
                  <td class="tr">${formatCurrency(amountRemain)}</td>
                  <td class="tr">${formatCurrency(amountRefunded)}</td>
                  <td class="tl">${printableStatus}</td>
                </tr>
              `;
            })
            .join('') +
          '</tbody>';

    const expensesTableHeader = `
            <thead>
              <tr>
                <th class="tc">S.No</th>
                <th class="tl">Date</th>
                <th class="tl">Description</th>
                <th class="tl">Category</th>
                <th class="tr">Amount (TZS)</th>
                <th class="tl">Status</th>
              </tr>
            </thead>`;

    const expensesRowsHtml =
      periodExpenses.length === 0
        ? '<tbody><tr><td colspan="6" style="text-align:center;padding:12px;">No expenses found</td></tr></tbody>'
        : '<tbody>' +
          periodExpenses
            .map((e, idx) => {
              const rawDesc = String(e.description || '').trim();
              const description = rawDesc
                ? (rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1)).replace(/</g, '&lt;')
                : '—';
              const category = String(e.category || '—').replace(/</g, '&lt;');
              const status = String(e.status || '—').replace(/</g, '&lt;');
              const dateStr = e.date ? String(e.date).slice(0, 10) : '—';
              return `
                <tr>
                  <td class="tc">${idx + 1}</td>
                  <td class="tl">${dateStr}</td>
                  <td class="tl">${description}</td>
                  <td class="tl">${category}</td>
                  <td class="tr">${formatCurrency(Number(e.amount) || 0)}</td>
                  <td class="tl">${status}</td>
                </tr>
              `;
            })
            .join('') +
          '</tbody>';

    const logoSrcForPrint = await ensureLogoDataUrl(logo, null);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Transactions Report - ${BRAND_NAME}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
              max-width: 900px;
              margin: 0 auto;
              padding: 24px;
              color: #222;
              font-size: 11px;
              line-height: 1.4;
            }
            .tax-inv-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 24px;
              padding-bottom: 20px;
              border-bottom: 2px solid #333;
            }
            .tax-inv-left {
              display: flex;
              align-items: flex-start;
              gap: 20px;
              flex: 1;
            }
            .tax-inv-logo {
              max-height: 60px;
              max-width: 140px;
              object-fit: contain;
            }
            .tax-inv-company { flex: 1; }
            .tax-inv-company h2 {
              margin: 0 0 10px 0;
              font-size: 1.15rem;
              font-weight: 700;
              color: #111;
              letter-spacing: 0.02em;
            }
            .tax-inv-address { margin: 0; color: #444; font-size: 10px; line-height: 1.5; }
            .tax-inv-contact { margin-top: 8px; font-size: 10px; color: #555; }
            .tax-inv-contact span { margin-right: 16px; }
            .tax-inv-meta { text-align: right; min-width: 180px; }
            .tax-inv-meta p { margin: 0 0 6px 0; font-size: 11px; }
            .location-badge {
              display: inline-block;
              margin-top: 8px;
              padding: 5px 12px;
              border-radius: 999px;
              background: #562731;
              color: #fefefe;
              font-weight: 700;
              font-size: 11px;
              letter-spacing: 0.03em;
            }
            .tax-inv-title {
              text-align: center;
              font-size: 1.6rem;
              font-weight: 700;
              margin: 24px 0 8px 0;
              letter-spacing: 0.05em;
            }
            .tax-inv-subtitle {
              text-align: center;
              font-size: 0.95rem;
              color: #444;
              margin: 0 0 20px 0;
            }
            .tax-inv-section-title {
              font-size: 1.05rem;
              font-weight: 700;
              margin: 28px 0 12px 0;
              letter-spacing: 0.02em;
            }
            .tax-inv-table {
              width: 100%;
              border-collapse: collapse;
              margin: 0 0 20px 0;
              font-size: 10px;
              border: 1px solid #333;
            }
            .tax-inv-table th,
            .tax-inv-table td {
              border: 1px solid #333;
              padding: 6px 8px;
              vertical-align: middle;
            }
            .tax-inv-table th {
              background: #f0f0f0;
              font-weight: 700;
              text-align: center;
              font-size: 10px;
            }
            .tax-inv-table th.tl { text-align: left; }
            .tax-inv-table .tc { text-align: center; }
            .tax-inv-table .tr { text-align: right; }
            .tax-inv-table .tl { text-align: left; }
            .tax-inv-table tbody tr { background: #fff; }
            .tax-inv-footer {
              margin-top: 28px;
              font-size: 11px;
              border-top: 1px solid #ccc;
              padding-top: 16px;
            }
            .tax-inv-footer-row { margin-bottom: 12px; }
            .tax-inv-footer-row label { display: inline-block; min-width: 200px; font-weight: 600; }
            .tax-inv-disclaimer {
              margin-top: 28px;
              font-style: italic;
              color: #666;
              font-size: 10px;
            }
            @media print { body { padding: 16px; } .tax-inv-logo { max-height: 52px; } }
            ${PRINT_LOGO_CSS}
          </style>
        </head>
        <body>
          <div class="tax-inv-top">
            <div class="tax-inv-left">
              ${logoImgHtml(logoSrcForPrint)}
              ${getPrintCompanyHtml('tax-inv-company')}
            </div>
            <div class="tax-inv-meta">
              <p><strong>Report:</strong> Transactions Report</p>
              <p><strong>Period:</strong> ${String(periodLabel).replace(/</g, '&lt;')}</p>
              <p><strong>Location:</strong> ${String(locationLabel).replace(/</g, '&lt;')}</p>
              <p><strong>Printed:</strong> ${new Date().toLocaleString('en-GB')}</p>
              <p><strong>Printed by:</strong> ${printedBy}</p>
              <div class="location-badge">${String(locationLabel).replace(/</g, '&lt;')}</div>
            </div>
          </div>

          <h1 class="tax-inv-title">TRANSACTIONS REPORT — ${String(locationLabel).replace(/</g, '&lt;').toUpperCase()}</h1>
          <p class="tax-inv-subtitle">Branch / location: <strong>${String(locationLabel).replace(/</g, '&lt;')}</strong></p>

          <table class="tax-inv-table">
            ${tableHeader}
            ${rowsHtml}
          </table>

          <h2 class="tax-inv-section-title">Today's Expenses</h2>
          <table class="tax-inv-table">
            ${expensesTableHeader}
            ${expensesRowsHtml}
          </table>

          <div class="tax-inv-footer">
            ${summaryScopeNote}
            <div class="tax-inv-footer-row"><label>Direct Sales by Cash (TZS):</label> ${formatCurrency(printSummary.cashTotal)}</div>
            <div class="tax-inv-footer-row"><label>Direct Sales by Bank transfer (TZS):</label> ${formatCurrency(printSummary.bankTotal)}</div>
            <div class="tax-inv-footer-row"><label>Direct Sales by Airtel Money (TZS):</label> ${formatCurrency(printSummary.airtelTotal)}</div>
            <div class="tax-inv-footer-row"><label>Direct Sales by M-Pesa (TZS):</label> ${formatCurrency(printSummary.mpesaTotal)}</div>
            <div class="tax-inv-footer-row"><label>Direct Sales by Mix by YAS (TZS):</label> ${formatCurrency(printSummary.yasTotal)}</div>
            <div class="tax-inv-footer-row"><label>Total Direct Sales (TZS):</label> ${formatCurrency(printSummary.totalDirectSales)}</div>
            <div class="tax-inv-footer-row"><label>Loan paid by Cash (TZS):</label> ${formatCurrency(printSummary.loanPaidCashTotal)}</div>
            <div class="tax-inv-footer-row"><label>Loan paid by Bank transfer (TZS):</label> ${formatCurrency(printSummary.loanPaidBankTotal)}</div>
            <div class="tax-inv-footer-row"><label>Loan paid by Airtel Money (TZS):</label> ${formatCurrency(printSummary.loanPaidAirtelTotal)}</div>
            <div class="tax-inv-footer-row"><label>Loan paid by M-Pesa (TZS):</label> ${formatCurrency(printSummary.loanPaidMpesaTotal)}</div>
            <div class="tax-inv-footer-row"><label>Loan paid by Mix by YAS (TZS):</label> ${formatCurrency(printSummary.loanPaidYasTotal)}</div>
            <div class="tax-inv-footer-row"><label>Loan paid by Credit (TZS):</label> ${formatCurrency(printSummary.loanPaidCreditTotal)}</div>
            <div class="tax-inv-footer-row"><label>Total Loan paid (TZS):</label> ${formatCurrency(printSummary.loanPaidTotal)}</div>
            <div class="tax-inv-footer-row"><label>Total amount received (TZS):</label> ${formatCurrency(printSummary.totalAmount)}</div>
            <div class="tax-inv-footer-row"><label>Total today expenses (TZS):</label> ${formatCurrency(totalTodayExpenses)}</div>
            <div class="tax-inv-footer-row"><label>Total refunded amount (TZS):</label> ${formatCurrency(totalRefundedAmount)}</div>
            <div class="tax-inv-footer-row"><label>Total today's income (TZS):</label> <strong>${formatCurrency(totalTodayIncome)}</strong></div>
            <div class="tax-inv-footer-row"><label>Profits earned (TZS):</label> <strong>${formatCurrency(profitsEarned)}</strong></div>
          </div>

          <p class="tax-inv-disclaimer">*This is a computer generated transactions report, hence no signature is required.*</p>
        </body>
      </html>
    `;

    if (mode === 'download') {
      downloadHtmlDocument(html, `admin-transactions-report-${reportFileStamp()}.html`);
      return;
    }

    openPrintWindowWithLogo(html, {
      onBlocked: () => {
        Swal.fire({
          icon: 'warning',
          title: 'Popup Blocked',
          text: 'Please allow popups to open print reports.',
          confirmButtonColor: colors.primary
        });
      }
    });
  };

  const handlePrintTransactionsReport = () => handleTransactionsReport('print');
  const handleDownloadTransactionsReport = () => handleTransactionsReport('download');

  const handleLoansReport = (mode = 'print') => {
    const rows = payments.filter((p) =>
      String(p.payment_type || '').toLowerCase() === 'loan' &&
      (p.status === 'Approved' || p.status === 'Pending') &&
      isInDateRange(p.updated_at || p.created_at) &&
      matchesLocation(p) &&
      matchesSearch(p)
    );
    const totalRemain = rows.reduce((s, p) => s + Math.max(0, Number(p.amount_remain) || 0), 0);
    const body =
      '<thead><tr><th class="tc">#</th><th class="tl">Date</th><th class="tl">Customer</th><th class="tl">Status</th><th class="tr">Received (TZS)</th><th class="tr">Remain (TZS)</th></tr></thead><tbody>' +
      (rows.length
        ? rows.map((p, i) => `<tr><td class="tc">${i + 1}</td><td>${String(p.updated_at || p.created_at || '').replace('T', ' ').slice(0, 16)}</td><td>${String(p.customer_name || '—').replace(/</g, '&lt;')}</td><td>${p.status || '—'}</td><td class="tr">${Math.round(Number(p.amount_received) || 0).toLocaleString()}</td><td class="tr">${Math.round(Math.max(0, Number(p.amount_remain) || 0)).toLocaleString()}</td></tr>`).join('')
        : '<tr><td colspan="6" class="tc">No loan records found</td></tr>') +
      '</tbody>';
    emitSimpleReport(
      `LOANS REPORT — ${selectedLocationLabel}`,
      body,
      `<strong>Total Amount Remain (TZS):</strong> ${Math.round(totalRemain).toLocaleString()}`,
      '*This is a computer generated loans report, hence no signature is required.*',
      mode,
      `admin-loans-report-${reportFileStamp()}.html`
    );
  };

  const handlePrintLoansReport = () => handleLoansReport('print');
  const handleDownloadLoansReport = () => handleLoansReport('download');

  if (loading) {
    return <PageLoader message={t.loading || 'Loading...'} />;
  }

  return (
    <div className="dashboard-container">
      {isMobile && sidebarOpen ? <SidebarBackdrop onClose={closeSidebar} /> : null}
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
            className={'nav-item' + (location.pathname === '/admin/transactions' ? ' active' : '')}
          >
            <FaCalendarAlt className="nav-icon" />
            <span>{t.transactions}</span>
          </Link>
          <Link
            to="/admin/loans"
            className={'nav-item' + (location.pathname === '/admin/loans' ? ' active' : '')}
          >
            <FaMoneyBillWave className="nav-icon" />
            <span>{t.loans}</span>
          </Link>
          <Link
            to="/admin/expenses"
            className={'nav-item' + (location.pathname === '/admin/expenses' ? ' active' : '')}
          >
            <FaWallet className="nav-icon" />
            <span>{t.expenses || 'Expenses'}</span>
          </Link>
          <Link to="/admin/reports" className="nav-item active">
            <FaChartBar className="nav-icon" />
            <span>{t.reports || 'Reports'}</span>
          </Link>
          <Link to="/admin/settings" className="nav-item">
            <FaCog className="nav-icon" />
            <span>{t.settings}</span>
          </Link>
        </nav>
      </aside>

      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={toggleSidebar}>
              <FaBars />
            </button>
            <h1 className="page-title">{t.reports || 'Reports'}</h1>
          </div>

          <div className="header-right">
            <LanguageSelector />
            <div className="date-time-display" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666' }}>
              <FaCalendarAlt />
              <span>{currentDateTime}</span>
            </div>
            <button className="notification-btn" disabled title="New operations count">
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
            <ThemeToggle />
            <div className="user-info">
              <FaUser className="user-icon" />
              <span className="user-name">{user?.username || 'Admin'}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt /> {t.logout}
            </button>
          </div>
        </header>

        <div className="dashboard-content admin-reports-page">
          <section className="admin-reports-hero">
            <div className="admin-reports-hero-copy">
              <p className="admin-reports-kicker">{BRAND_NAME}</p>
              <h2 className="admin-reports-heading">{t.reports || 'Reports'}</h2>
              <p className="admin-reports-sub">
                Filter by period, review live totals, and print sales, transactions, or loans reports.
              </p>
            </div>
            <div className="admin-reports-period">
              <FaCalendarAlt aria-hidden />
              <div>
                <span className="admin-reports-period-label">Active period</span>
                <strong>{periodHint}</strong>
              </div>
            </div>
          </section>

          <section className="admin-reports-filters" aria-label="Report filters">
            <div className="reports-filter-group reports-filter-search">
              <label className="reports-filter-label" htmlFor="admin-reports-search">
                <FaSearch aria-hidden /> Search
              </label>
              <input
                id="admin-reports-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Customer, phone, method..."
                className="admin-reports-search-input"
              />
            </div>
            <div className="reports-filter-group">
              <BrandDatePicker
                id="admin-reports-date-from"
                label="From"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={setDateFrom}
                placeholder="From date"
              />
            </div>
            <div className="reports-filter-group">
              <BrandDatePicker
                id="admin-reports-date-to"
                label="To"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={setDateTo}
                placeholder="To date"
              />
            </div>
            <div className="reports-filter-group">
              <label className="reports-filter-label" id="admin-reports-location-label">
                Location
              </label>
              <div
                className={`admin-reports-location-select${locationMenuOpen ? ' is-open' : ''}${
                  locationFilter ? ' has-value' : ''
                }`}
                ref={locationSelectRef}
              >
                <button
                  type="button"
                  id="admin-reports-location-filter"
                  className="admin-reports-location-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={locationMenuOpen}
                  aria-labelledby="admin-reports-location-label"
                  onClick={() => setLocationMenuOpen((open) => !open)}
                >
                  <FaMapMarkerAlt className="admin-reports-location-trigger-icon" aria-hidden />
                  <span className="admin-reports-location-trigger-value">
                    {selectedLocationLabel}
                  </span>
                  <FaChevronDown className="admin-reports-location-chevron" aria-hidden />
                </button>
                {locationMenuOpen ? (
                  <ul
                    className="admin-reports-location-menu"
                    role="listbox"
                    aria-labelledby="admin-reports-location-label"
                  >
                    {locationOptions.map((opt) => {
                      const selected = opt.value === locationFilter;
                      return (
                        <li key={opt.value || 'all'} role="presentation">
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            className={`admin-reports-location-option${
                              selected ? ' is-selected' : ''
                            }`}
                            onClick={() => selectLocationFilter(opt.value)}
                          >
                            <span className="admin-reports-location-option-icon" aria-hidden>
                              {opt.icon === 'all' ? <FaGlobeAfrica /> : <FaMapMarkerAlt />}
                            </span>
                            <span className="admin-reports-location-option-text">
                              <span className="admin-reports-location-option-label">
                                {opt.label}
                              </span>
                              <span className="admin-reports-location-option-hint">{opt.hint}</span>
                            </span>
                            {selected ? (
                              <FaCheck
                                className="admin-reports-location-option-check"
                                aria-hidden
                              />
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              className="admin-reports-clear-btn"
              onClick={() => {
                setSearchTerm('');
                setDateFrom('');
                setDateTo('');
                setLocationFilter('');
                setLocationMenuOpen(false);
              }}
            >
              <FaUndo aria-hidden />
              <span>Clear filters</span>
            </button>
          </section>

          <section className="admin-reports-stats" aria-label="Summary">
            {summaryCards.map((card) => (
              <article key={card.title} className={`admin-reports-stat tone-${card.tone}`}>
                <div className="admin-reports-stat-icon">{card.icon}</div>
                <div className="admin-reports-stat-body">
                  <h3>{card.title}</h3>
                  <p>{card.value}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-reports-print-section">
            <div className="admin-reports-section-head">
              <h2>
                <FaFileInvoiceDollar aria-hidden /> Print reports
              </h2>
              <p>Generate printable documents using the current search and date filters.</p>
            </div>
            <div className="admin-reports-print-grid">
              <button type="button" className="admin-reports-print-card sales" onClick={handlePrintSalesReport}>
                <span className="admin-reports-print-icon">
                  <FaPrint />
                </span>
                <span className="admin-reports-print-title">Sales Report</span>
                <span className="admin-reports-print-desc">Approved and pending sales for the selected period.</span>
              </button>
              <button
                type="button"
                className="admin-reports-print-card transactions"
                onClick={handlePrintTransactionsReport}
              >
                <span className="admin-reports-print-icon">
                  <FaPrint />
                </span>
                <span className="admin-reports-print-title">Transactions Report</span>
                <span className="admin-reports-print-desc">
                  Same layout as Boma/Geita: items, remain, refunds, expenses, and income summary.
                </span>
              </button>
              <button type="button" className="admin-reports-print-card loans" onClick={handlePrintLoansReport}>
                <span className="admin-reports-print-icon">
                  <FaPrint />
                </span>
                <span className="admin-reports-print-title">Loans Report</span>
                <span className="admin-reports-print-desc">Outstanding and active loan balances.</span>
              </button>
            </div>
          </section>

          <section className="admin-reports-print-section admin-reports-download-section">
            <div className="admin-reports-section-head">
              <h2>
                <FaDownload aria-hidden /> Download reports
              </h2>
              <p>Download the same documents as HTML files using the current search and date filters.</p>
            </div>
            <div className="admin-reports-print-grid">
              <button
                type="button"
                className="admin-reports-print-card admin-reports-download-card sales"
                onClick={handleDownloadSalesReport}
              >
                <span className="admin-reports-print-icon">
                  <FaDownload />
                </span>
                <span className="admin-reports-print-title">Sales Report</span>
                <span className="admin-reports-print-desc">Download sales for the selected period.</span>
              </button>
              <button
                type="button"
                className="admin-reports-print-card admin-reports-download-card transactions"
                onClick={handleDownloadTransactionsReport}
              >
                <span className="admin-reports-print-icon">
                  <FaDownload />
                </span>
                <span className="admin-reports-print-title">Transactions Report</span>
                <span className="admin-reports-print-desc">
                  Download the full transactions document with refunds and income summary.
                </span>
              </button>
              <button
                type="button"
                className="admin-reports-print-card admin-reports-download-card loans"
                onClick={handleDownloadLoansReport}
              >
                <span className="admin-reports-print-icon">
                  <FaDownload />
                </span>
                <span className="admin-reports-print-title">Loans Report</span>
                <span className="admin-reports-print-desc">Download outstanding and active loan balances.</span>
              </button>
            </div>
          </section>

          <section className="admin-reports-links-section">
            <div className="admin-reports-section-head">
              <h2>
                <FaChartBar aria-hidden /> Quick links
              </h2>
              <p>Jump to related admin pages for deeper analysis.</p>
            </div>
            <div className="admin-reports-links">
              {reportActions.map((action) => (
                <button
                  key={action.route}
                  type="button"
                  className="admin-reports-link"
                  onClick={() => navigate(action.route)}
                >
                  <span className="admin-reports-link-icon">{action.icon}</span>
                  <span className="admin-reports-link-copy">
                    <strong>{action.title}</strong>
                    <span>{action.description}</span>
                  </span>
                  <span className="admin-reports-link-cta">Open</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminReports;
