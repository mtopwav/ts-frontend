import { colors } from '../../utils/colors';
import React, { useState, useEffect } from 'react';
import { useResponsiveSidebar } from '../../utils/useResponsiveSidebar';
import SidebarBackdrop from '../../components/SidebarBackdrop';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  FaFileInvoice,
  FaSearch,
  FaTimes,
} from 'react-icons/fa';
import './manager-layout.css';
import './generateSeles.css';
import { getCustomers, getSpareParts, createPayment } from '../../services/api';
import { getCurrentDateTime } from '../../utils/dateTime';
import { useTranslation } from '../../utils/useTranslation';
import { canAccessBranch } from '../../utils/branchAuth';
import { BRANCH_GEITA } from '../../utils/branchLocations';
import { geitaLabels } from './geitaLabels';
import GeitaSidebar from './components/GeitaSidebar';
import GeitaPageHeader from './components/GeitaPageHeader';
import { PageLoader, InlineLoader } from '../../components/LoadingSpinner';

function ManagerGenerateSales() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const { sidebarOpen, isMobile, toggleSidebar, closeSidebar } = useResponsiveSidebar();
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedParts, setSelectedParts] = useState([]);
  const [partSearchInput, setPartSearchInput] = useState('');
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const [letters, setLetters] = useState('');
  const [paymentType, setPaymentType] = useState('retail'); // 'retail' | 'wholesale'
  const [currentDateTime, setCurrentDateTime] = useState(getCurrentDateTime());

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

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [customersRes, sparePartsRes] = await Promise.all([
          getCustomers(BRANCH_GEITA),
          getSpareParts(BRANCH_GEITA)
        ]);
        if (customersRes.success && customersRes.customers) {
          const formatted = customersRes.customers
            .map(c => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              created_at: c.created_at || c.registeredDate || c.registered_date
            }))
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
          setCustomers(formatted);
        }
        if (sparePartsRes.success && sparePartsRes.spareParts) {
          const formatted = sparePartsRes.spareParts.map(p => ({
            id: p.id,
            name: p.part_name,
            partNumber: p.part_number,
            brand: p.brand_name || 'Unknown',
            wholesale_price: p.wholesale_price != null ? Number(p.wholesale_price) : null,
            retail_price: p.retail_price != null ? Number(p.retail_price) : null,
            unitPrice: p.retail_price,
            status: p.status,
            stockQuantity: p.quantity != null ? Number(p.quantity) : 0
          }));
          setSpareParts(formatted);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to load customers or spare parts.',
          confirmButtonColor: colors.primary
        });
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
    const dateTimeInterval = setInterval(() => setCurrentDateTime(getCurrentDateTime()), 1000);
    return () => clearInterval(dateTimeInterval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.customer-search-container')) setShowCustomerDropdown(false);
      if (!event.target.closest('.part-search-container')) setShowPartDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return <PageLoader message={t.loading || 'Loading...'} />;
  }
  if (!user) return null;

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

  const capitalizeName = (name) => {
    if (!name) return '';
    return name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatPrice = (price) => {
    if (!price) return '0';
    return parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const selectedCustomer = customers.find(c => String(c.id) === String(selectedCustomerId));
  const customerPhone = selectedCustomer?.phone || '';

  const filteredCustomers = customerSearchInput.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(customerSearchInput.toLowerCase()) ||
        (c.phone && c.phone.includes(customerSearchInput))
      )
    : customers;

  const filteredParts = spareParts.filter(part => {
    const notSelected = !selectedParts.find(sp => String(sp.partId) === String(part.id));
    const searchLower = partSearchInput.toLowerCase();
    const matches = (part.name && part.name.toLowerCase().includes(searchLower)) ||
      (part.partNumber && part.partNumber.toLowerCase().includes(searchLower)) ||
      (part.brand && part.brand.toLowerCase().includes(searchLower));
    return notSelected && matches;
  });

  const handleCustomerSearchChange = (e) => {
    setCustomerSearchInput(e.target.value);
    setShowCustomerDropdown(true);
    if (!e.target.value) setSelectedCustomerId('');
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomerId(customer.id);
    setCustomerSearchInput(capitalizeName(customer.name));
    setShowCustomerDropdown(false);
  };

  const handlePartSearchChange = (e) => {
    setPartSearchInput(e.target.value);
    setShowPartDropdown(true);
  };

  const handleCustomerFieldFocus = () => {
    setShowCustomerDropdown(true);
  };

  const handlePartSelect = (part) => {
    const alreadySelected = selectedParts.find(sp => String(sp.partId) === String(part.id));
    if (alreadySelected) {
      Swal.fire({
        icon: 'info',
        title: 'Part Already Added',
        text: 'This part is already in your list.',
        confirmButtonColor: colors.primary
      });
      setPartSearchInput('');
      setShowPartDropdown(false);
      return;
    }
    if (part.status === 'Out of Stock') {
      Swal.fire({
        icon: 'warning',
        title: 'Out of Stock',
        text: 'This spare part is out of stock. Please choose another part.',
        confirmButtonColor: colors.primary
      });
      return;
    }
    setSelectedParts([...selectedParts, { partId: part.id, part, quantity: 1 }]);
    setPartSearchInput('');
    setShowPartDropdown(false);
  };

  const handleRemovePart = (partId) => {
    setSelectedParts(selectedParts.filter(sp => String(sp.partId) !== String(partId)));
  };

  const handleUpdatePartQuantity = (partId, newQuantity) => {
    const raw = String(newQuantity).replace(/\D/g, '');
    let value = raw === '' ? 0 : Math.max(1, parseInt(raw, 10) || 0);

    setSelectedParts(prev =>
      prev.map(sp => {
        if (String(sp.partId) !== String(partId)) return sp;

        const stock = sp.part && sp.part.stockQuantity != null ? Number(sp.part.stockQuantity) : null;
        if (stock != null && stock > 0 && value > stock) {
          Swal.fire({
            icon: 'warning',
            title: 'Stock limit exceeded',
            text: `Only ${stock} unit(s) of "${capitalizeName(sp.part.name)}" are available in stock.`,
            confirmButtonColor: colors.primary
          });
          value = stock;
        }

        return { ...sp, quantity: value };
      })
    );
  };

  const getUnitPrice = (part) => {
    if (!part) return 0;
    if (paymentType === 'wholesale') {
      return Number(part.wholesale_price) || Number(part.retail_price) || Number(part.unitPrice) || 0;
    }
    return Number(part.retail_price) || Number(part.unitPrice) || Number(part.wholesale_price) || 0;
  };

  const getTotalAmount = () => {
    return selectedParts.reduce((sum, sp) => {
      const unitPrice = getUnitPrice(sp.part);
      const qty = Math.max(0, parseInt(sp.quantity, 10) || 0);
      return sum + unitPrice * qty;
    }, 0);
  };

  const totalPrice = getTotalAmount();

  const handleGenerateSale = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please select a customer.', confirmButtonColor: colors.primary });
      return;
    }
    if (selectedParts.length === 0) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please add at least one spare part.', confirmButtonColor: colors.primary });
      return;
    }
    try {
      const withQty = selectedParts.map(sp => ({
        sp,
        unitPrice: getUnitPrice(sp.part),
        qty: Math.max(0, parseInt(sp.quantity, 10) || 0)
      }));

      // Validate against stock quantities
      const overStock = withQty.find(({ sp, qty }) => {
        const stock = sp.part && sp.part.stockQuantity != null ? Number(sp.part.stockQuantity) : null;
        return stock != null && stock >= 0 && qty > stock;
      });

      if (overStock) {
        const stock = overStock.sp.part.stockQuantity;
        Swal.fire({
          icon: 'warning',
          title: 'Stock limit exceeded',
          text: `Quantity for "${capitalizeName(overStock.sp.part.name)}" cannot be greater than available stock (${stock}).`,
          confirmButtonColor: colors.primary
        });
        return;
      }

      const items = withQty
        .filter(({ qty }) => qty > 0)
        .map(({ sp, unitPrice, qty }) => ({
          sparepart_id: sp.part.id,
          quantity: qty,
          unit_price: unitPrice,
          total_amount: unitPrice * qty
        }));
      if (items.length === 0) {
        Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Add at least one part with quantity > 0.', confirmButtonColor: colors.primary });
        return;
      }
      const response = await createPayment({
        customer_id: parseInt(selectedCustomerId),
        employee_id: user?.id || user?.employee_id || null,
        location: BRANCH_GEITA,
        letters,
        price_type: paymentType === 'wholesale' ? 'wholesale' : 'retail',
        items
      });
      if (!response || !response.success) throw new Error(response?.message || 'Failed to save payment');
      setSelectedCustomerId('');
      setCustomerSearchInput('');
      setSelectedParts([]);
      setPartSearchInput('');
      setLetters('');
      setPaymentType('retail');
      Swal.fire({ icon: 'success', title: 'Success', text: 'Sale created. Pending approval.', confirmButtonColor: colors.primary });
      navigate('/geita/transactions');
    } catch (error) {
      console.error('Error creating payment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to save payment. Please try again.',
        confirmButtonColor: colors.primary
      });
    }
  };

  return (
    <div className="payments-container geita-portal">
      {isMobile && sidebarOpen ? <SidebarBackdrop onClose={closeSidebar} /> : null}
      <GeitaSidebar sidebarOpen={sidebarOpen} isMobile={isMobile} onNavClick={closeSidebar} />

      <div className="main-content">
        <GeitaPageHeader
          title={geitaLabels.pageTitles.generateSales}
          user={user}
          currentDateTime={currentDateTime}
          onToggleSidebar={toggleSidebar}
          onLogout={handleLogout}
        />

        <div className="payments-content boma-generate-sales-page">
          <div className="boma-generate-sales-card">
            <div className="card-header">
              <h2>{geitaLabels.pageTitles.generateSales}</h2>
              <p className="boma-generate-sales-subtitle">
                Select a customer, add spare parts, and submit for approval.
              </p>
            </div>
            <div className="card-body">
              {loadingData ? (
                <div className="boma-generate-loading">
                  <InlineLoader message="Loading customers and spare parts..." size="md" showDots />
                </div>
              ) : (
                <form onSubmit={handleGenerateSale} className="boma-generate-form">
                  <section className="boma-generate-section form-row-full" aria-label="Sale options">
                    <h3 className="boma-generate-section-title">{t.saleDetails || 'Sale details'}</h3>
                    <div className="boma-generate-row">
                      <div className="form-field">
                        <label className="form-label" htmlFor="geita-payment-type">
                          {t.paymentType || 'Payment Type'} <span className="required">*</span>
                        </label>
                        <select
                          id="geita-payment-type"
                          className="form-input form-select"
                          value={paymentType}
                          onChange={(e) => setPaymentType(e.target.value)}
                          required
                        >
                          <option value="retail">{t.retail || 'Retail'}</option>
                          <option value="wholesale">{t.wholesale || 'Wholesale'}</option>
                        </select>
                      </div>
                      <div className="form-field">
                        <label className="form-label" htmlFor="geita-total-amount">
                          {t.totalAmount}
                        </label>
                        <input
                          id="geita-total-amount"
                          type="text"
                          className="form-input form-input-readonly form-input-total"
                          value={totalPrice ? `TZS ${formatPrice(totalPrice)}` : 'TZS 0'}
                          readOnly
                        />
                      </div>
                    </div>
                  </section>

                  <section className="boma-generate-section form-row-full" aria-label="Customer">
                    <h3 className="boma-generate-section-title">{t.customer || 'Customer'}</h3>
                    <div className="boma-generate-row">
                      <div className="form-field">
                        <label className="form-label">
                          {t.customer} <span className="required">*</span>
                        </label>
                        <div className="customer-search-container search-field">
                          <FaSearch className="search-field-icon" aria-hidden />
                          <input
                            type="text"
                            className="form-input"
                            value={customerSearchInput}
                            onChange={handleCustomerSearchChange}
                            onFocus={handleCustomerFieldFocus}
                            placeholder={t.searchCustomer}
                            required={!selectedCustomerId}
                          />
                          {showCustomerDropdown && filteredCustomers.length > 0 && (
                            <div className="dropdown-panel">
                              {filteredCustomers.map((customer) => (
                                <div
                                  key={customer.id}
                                  className="dropdown-item"
                                  onClick={() => handleCustomerSelect(customer)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCustomerSelect(customer);
                                  }}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <div className="dropdown-item-title">{capitalizeName(customer.name)}</div>
                                  <div className="dropdown-item-meta">{customer.phone}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {showCustomerDropdown && filteredCustomers.length === 0 && (
                            <div className="dropdown-panel dropdown-empty">No customers found</div>
                          )}
                        </div>
                      </div>
                      <div className="form-field">
                        <label className="form-label" htmlFor="geita-customer-phone">
                          {t.phone}
                        </label>
                        <input
                          id="geita-customer-phone"
                          type="text"
                          className="form-input form-input-readonly"
                          value={customerPhone}
                          readOnly
                          placeholder={t.customerPhonePlaceholder}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="boma-generate-section form-row-full" aria-label="Spare parts">
                    <h3 className="boma-generate-section-title">{t.spareParts || 'Spare parts'}</h3>
                    <div className="form-field">
                      <label className="form-label">{t.addSparePart}</label>
                      <div className="part-search-container search-field">
                        <FaSearch className="search-field-icon" aria-hidden />
                        <input
                          type="text"
                          className="form-input"
                          value={partSearchInput}
                          onChange={handlePartSearchChange}
                          onFocus={() => setShowPartDropdown(true)}
                          placeholder={t.searchSparePart}
                        />
                        {showPartDropdown && partSearchInput && filteredParts.length > 0 && (
                          <div className="dropdown-panel">
                            {filteredParts.map((part) => (
                              <div
                                key={part.id}
                                className="dropdown-item"
                                onClick={() => handlePartSelect(part)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handlePartSelect(part);
                                }}
                                role="button"
                                tabIndex={0}
                              >
                                <div className="dropdown-item-title">{capitalizeName(part.name)}</div>
                                <div className="dropdown-item-meta">
                                  {part.partNumber} · {part.brand} · TZS{' '}
                                  {formatPrice(getUnitPrice(part))}
                                  {' · '}
                                  {paymentType === 'wholesale'
                                    ? t.wholesale || 'Wholesale'
                                    : t.retail || 'Retail'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {showPartDropdown && partSearchInput && filteredParts.length === 0 && (
                          <div className="dropdown-panel dropdown-empty">No spare parts found</div>
                        )}
                      </div>
                    </div>

                    {selectedParts.length > 0 && (
                      <div className="boma-selected-parts">
                        <span className="boma-selected-parts-label">
                          {t.selectedParts} ({selectedParts.length})
                        </span>
                        <div className="boma-selected-parts-list">
                          {selectedParts.map((selectedPart) => {
                            const unitPrice = getUnitPrice(selectedPart.part);
                            const partTotal = unitPrice * Number(selectedPart.quantity);
                            return (
                              <div key={selectedPart.partId} className="boma-selected-part-row">
                                <div className="part-info">
                                  <div className="part-name">{capitalizeName(selectedPart.part.name)}</div>
                                  <div className="part-meta">
                                    {selectedPart.part.partNumber} · TZS {formatPrice(unitPrice)} each
                                    {' · '}
                                    {paymentType === 'wholesale'
                                      ? t.wholesale || 'Wholesale'
                                      : t.retail || 'Retail'}
                                  </div>
                                  <div className="part-qty-row">
                                    <span>{t.quantity}:</span>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      className="form-input qty-input"
                                      placeholder="Qty"
                                      value={selectedPart.quantity === 0 ? '' : selectedPart.quantity}
                                      onChange={(e) =>
                                        handleUpdatePartQuantity(selectedPart.partId, e.target.value)
                                      }
                                    />
                                    <span className="part-line-total">
                                      {t.total}: TZS {formatPrice(partTotal)}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="btn-remove"
                                  onClick={() => handleRemovePart(selectedPart.partId)}
                                >
                                  <FaTimes aria-hidden /> {t.remove}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </section>

                  <div className="boma-generate-form-actions">
                    <button type="submit" className="boma-generate-submit">
                      <FaFileInvoice aria-hidden />
                      {t.generateSale}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerGenerateSales;
