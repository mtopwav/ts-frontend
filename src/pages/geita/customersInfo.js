import { colors } from '../../utils/colors';
import React, { useState, useEffect } from 'react';
import { useResponsiveSidebar } from '../../utils/useResponsiveSidebar';
import SidebarBackdrop from '../../components/SidebarBackdrop';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  FaUsers,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrashAlt,
  FaPhone,
  FaIdCard,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import './manager-layout.css';
import './customersInfo.css';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '../../services/api';
import { getCurrentDateTime } from '../../utils/dateTime';
import { useTranslation } from '../../utils/useTranslation';
import { canAccessBranch } from '../../utils/branchAuth';
import { BRANCH_GEITA } from '../../utils/branchLocations';
import { geitaLabels } from './geitaLabels';
import GeitaSidebar from './components/GeitaSidebar';
import GeitaPageHeader from './components/GeitaPageHeader';
import { PageLoader } from '../../components/LoadingSpinner';

function ManagerCustomersInfo() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const { sidebarOpen, isMobile, toggleSidebar, closeSidebar } = useResponsiveSidebar();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [updatingCustomer, setUpdatingCustomer] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(getCurrentDateTime());
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

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
    const loadCustomers = async () => {
      try {
        const response = await getCustomers(BRANCH_GEITA);
        if (response.success && response.customers) {
          const formatted = response.customers.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            address: c.address,
            paymentMethod: c.payment_method,
            registeredDate: c.created_at || c.registered_date || c.registeredDate
          }));
          setCustomers(formatted);
        }
      } catch (error) {
        console.error('Error loading customers:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to load customers. Please try again.',
          confirmButtonColor: colors.primary
        });
      }
    };
    loadCustomers();
    const dateTimeInterval = setInterval(() => setCurrentDateTime(getCurrentDateTime()), 1000);
    return () => clearInterval(dateTimeInterval);
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

  const capitalizeAddress = (address) => {
    if (!address) return '';
    return address.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setAddingCustomer(true);
    try {
      if (!formData.name || !formData.phone || !formData.address) {
        Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Name, Phone, and Address are required.', confirmButtonColor: colors.primary });
        setAddingCustomer(false);
        return;
      }
      const nameParts = formData.name.trim().split(/\s+/).filter(p => p.length > 0);
      if (nameParts.length < 2 || nameParts.length > 3) {
        Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please enter full name with 2 or 3 names.', confirmButtonColor: colors.primary });
        setAddingCustomer(false);
        return;
      }
      let phoneNumber = formData.phone.trim();
      if (!phoneNumber.startsWith('+255')) {
        if (phoneNumber.startsWith('255')) phoneNumber = '+' + phoneNumber;
        else if (phoneNumber.startsWith('0')) phoneNumber = '+255' + phoneNumber.substring(1);
        else phoneNumber = '+255' + phoneNumber;
      }
      const phoneDigits = phoneNumber.substring(4);
      if (phoneDigits.length !== 9) {
        Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Phone must have exactly 9 digits after +255.', confirmButtonColor: colors.primary });
        setAddingCustomer(false);
        return;
      }
      const response = await addCustomer({
        name: formData.name.trim(),
        phone: phoneNumber,
        address: formData.address.trim(),
        location: BRANCH_GEITA,
      });
      if (response.success) {
        const newCustomer = {
          id: response.customer.id,
          name: response.customer.name,
          phone: response.customer.phone,
          address: response.customer.address,
          paymentMethod: response.customer.payment_method,
          registeredDate: response.customer.created_at || response.customer.registered_date
        };
        setCustomers([newCustomer, ...customers]);
        Swal.fire({ icon: 'success', title: 'Success!', text: 'Customer added successfully.', confirmButtonColor: colors.primary, timer: 2000, showConfirmButton: false });
        setFormData({ name: '', phone: '', address: '' });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Failed to add customer.', confirmButtonColor: colors.primary });
    } finally {
      setAddingCustomer(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    let phoneDisplay = customer.phone || '';
    if (phoneDisplay.startsWith('+255')) phoneDisplay = phoneDisplay.substring(4);
    else if (phoneDisplay.startsWith('255')) phoneDisplay = phoneDisplay.substring(3);
    else if (phoneDisplay.startsWith('0')) phoneDisplay = phoneDisplay.substring(1);
    setFormData({
      name: customer.name || '',
      phone: '+255' + phoneDisplay,
      address: customer.address || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (customer) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: t.delete || 'Delete Customer',
      text: `Are you sure you want to delete "${capitalizeName(customer.name)}"?`,
      showCancelButton: true,
      confirmButtonColor: colors.error,
      cancelButtonColor: colors.textMuted,
      confirmButtonText: t.delete || 'Yes, delete',
      cancelButtonText: t.cancel || 'Cancel'
    });
    if (!result.isConfirmed) return;

    try {
      const response = await deleteCustomer(customer.id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete customer');
      }
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      if (editingCustomer?.id === customer.id) {
        setShowEditModal(false);
        setEditingCustomer(null);
      }
      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Customer deleted successfully.',
        confirmButtonColor: colors.primary,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to delete customer.',
        confirmButtonColor: colors.primary
      });
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    setUpdatingCustomer(true);
    try {
      if (!formData.name || !formData.phone || !formData.address) {
        Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Name, Phone, and Address are required.', confirmButtonColor: colors.primary });
        setUpdatingCustomer(false);
        return;
      }
      const nameParts = formData.name.trim().split(/\s+/).filter(p => p.length > 0);
      if (nameParts.length < 2 || nameParts.length > 3) {
        Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please enter full name with 2 or 3 names.', confirmButtonColor: colors.primary });
        setUpdatingCustomer(false);
        return;
      }
      let phoneNumber = formData.phone.trim();
      if (!phoneNumber.startsWith('+255')) {
        if (phoneNumber.startsWith('255')) phoneNumber = '+' + phoneNumber;
        else if (phoneNumber.startsWith('0')) phoneNumber = '+255' + phoneNumber.substring(1);
        else phoneNumber = '+255' + phoneNumber;
      }
      const phoneDigits = phoneNumber.substring(4);
      if (phoneDigits.length !== 9) {
        Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Phone must have exactly 9 digits after +255.', confirmButtonColor: colors.primary });
        setUpdatingCustomer(false);
        return;
      }
      const response = await updateCustomer(editingCustomer.id, {
        name: formData.name.trim(),
        phone: phoneNumber,
        address: formData.address.trim()
      });
      if (response.success) {
        const updatedCustomer = {
          id: response.customer.id,
          name: response.customer.name,
          phone: response.customer.phone,
          address: response.customer.address,
          paymentMethod: response.customer.payment_method,
          registeredDate: response.customer.created_at || response.customer.registered_date || editingCustomer.registeredDate
        };
        setCustomers(customers.map(c => (c.id === editingCustomer.id ? updatedCustomer : c)));
        Swal.fire({ icon: 'success', title: 'Success!', text: 'Customer updated successfully.', confirmButtonColor: colors.primary, timer: 2000, showConfirmButton: false });
        setFormData({ name: '', phone: '', address: '' });
        setEditingCustomer(null);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Failed to update customer.', confirmButtonColor: colors.primary });
    } finally {
      setUpdatingCustomer(false);
    }
  };

  const filteredCustomers = searchTerm.trim()
    ? customers.filter(c => {
        const term = searchTerm.toLowerCase();
        return (c.name && c.name.toLowerCase().includes(term)) || (c.phone && c.phone.includes(searchTerm)) || (c.address && c.address.toLowerCase().includes(term));
      })
    : customers;

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormData({ name: '', phone: '', address: '' });
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', address: '' });
  };

  const phoneDigits = formData.phone.startsWith('+255') ? formData.phone.substring(4) : formData.phone.replace(/\D/g, '').slice(0, 9);

  const renderCustomerFormFields = () => (
    <>
      <div className="manager-form-group">
        <label htmlFor="customer-name">
          <FaIdCard className="manager-customer-field-icon" aria-hidden="true" />
          {t.fullName} <span className="manager-required">*</span>
        </label>
        <input
          id="customer-name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter customer full name"
          className="manager-form-input"
        />
      </div>
      <div className="manager-form-group">
        <label htmlFor="customer-phone">
          <FaPhone className="manager-customer-field-icon" aria-hidden="true" />
          {t.phone} <span className="manager-required">*</span>
        </label>
        <div className="manager-phone-input-group">
          <span className="manager-phone-prefix">+255</span>
          <input
            id="customer-phone"
            type="tel"
            required
            maxLength={9}
            inputMode="numeric"
            value={phoneDigits}
            onChange={(e) => setFormData({ ...formData, phone: '+255' + e.target.value.replace(/\D/g, '').slice(0, 9) })}
            placeholder="712345678"
            className="manager-phone-input"
          />
        </div>
      </div>
      <div className="manager-form-group">
        <label htmlFor="customer-address">
          <FaMapMarkerAlt className="manager-customer-field-icon" aria-hidden="true" />
          {t.address} <span className="manager-required">*</span>
        </label>
        <input
          id="customer-address"
          type="text"
          required
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder={t.address}
          className="manager-form-input"
        />
      </div>
    </>
  );

  return (
    <div className="payments-container geita-portal">
      {isMobile && sidebarOpen ? <SidebarBackdrop onClose={closeSidebar} /> : null}
      <GeitaSidebar sidebarOpen={sidebarOpen} isMobile={isMobile} onNavClick={closeSidebar} />
      <div className="main-content">
        <GeitaPageHeader
          title={geitaLabels.pageTitles.customerInfo}
          user={user}
          currentDateTime={currentDateTime}
          onToggleSidebar={toggleSidebar}
          onLogout={handleLogout}
        />

        <div className="payments-content manager-customers-page">
          <div className="action-bar manager-customers-action-bar">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="add-btn" onClick={() => setShowAddModal(true)}>
              <FaPlus /> {t.addCustomer}
            </button>
          </div>

          <div className="stats-row manager-stats-row">
            <div className="stat-card">
              <div className="stat-info">
                <h3>{t.customers}</h3>
                <p className="stat-value">{customers.length}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>{t.searchResults || 'Showing'}</h3>
                <p className="stat-value">{filteredCustomers.length}</p>
              </div>
            </div>
          </div>

          <section className="manager-customers-section">
            <h3 className="manager-section-title">{t.customerInfo}</h3>
            <p className="manager-customers-count">
              {filteredCustomers.length === customers.length
                ? `${customers.length} customer${customers.length === 1 ? '' : 's'}`
                : `Showing ${filteredCustomers.length} of ${customers.length} customers`}
            </p>
            <div className="table-container">
              <table className="payments-table manager-customers-table">
                <thead>
                  <tr>
                    <th className="manager-col-id">#</th>
                    <th>{t.name}</th>
                    <th>{t.phone}</th>
                    <th>{t.address}</th>
                    <th>{t.date}</th>
                    <th className="manager-col-actions">{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">
                        {t.noCustomersFound}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer, index) => (
                      <tr key={customer.id}>
                        <td className="manager-col-id">{index + 1}</td>
                        <td>
                          <div className="customer-info-cell">
                            <FaIdCard className="info-icon" />
                            <div>
                              <div className="info-name">{capitalizeName(customer.name)}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="customer-info-cell">
                            <FaPhone className="info-icon" />
                            <span>{customer.phone}</span>
                          </div>
                        </td>
                        <td className="address-cell">
                          <div className="customer-info-cell">
                            <FaMapMarkerAlt className="info-icon" />
                            <span>{capitalizeAddress(customer.address)}</span>
                          </div>
                        </td>
                        <td className="date-cell">{formatDateTime(customer.registeredDate || customer.created_at)}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn edit"
                              title={t.editCustomer}
                              onClick={() => handleEdit(customer)}
                            >
                              <FaEdit className="action-icon" />
                              <span className="action-text">{t.edit}</span>
                            </button>
                            <button
                              className="action-btn delete"
                              title={t.delete || 'Delete customer'}
                              onClick={() => handleDelete(customer)}
                            >
                              <FaTrashAlt className="action-icon" />
                              <span className="action-text">{t.delete || 'Delete'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {showAddModal && (
        <div className="manager-modal-overlay" onClick={closeAddModal}>
          <div className="manager-modal-content manager-customer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manager-modal-header manager-customer-modal-header">
              <div className="manager-customer-modal-title">
                <span className="manager-customer-modal-icon" aria-hidden="true">
                  <FaUsers />
                </span>
                <div>
                  <h3>{t.addCustomer}</h3>
                  <p className="manager-customer-modal-subtitle">Register a new customer for Geita Branch</p>
                </div>
              </div>
              <button type="button" className="manager-modal-close" onClick={closeAddModal} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="manager-customer-form">
              <div className="manager-form-body">{renderCustomerFormFields()}</div>
              <div className="manager-modal-footer">
                <button type="button" className="manager-modal-btn secondary" onClick={closeAddModal} disabled={addingCustomer}>
                  {t.cancel}
                </button>
                <button type="submit" className="manager-modal-btn primary" disabled={addingCustomer}>
                  {addingCustomer ? t.loading : t.addCustomer}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingCustomer && (
        <div className="manager-modal-overlay" onClick={closeEditModal}>
          <div className="manager-modal-content manager-customer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manager-modal-header manager-customer-modal-header">
              <div className="manager-customer-modal-title">
                <span className="manager-customer-modal-icon" aria-hidden="true">
                  <FaEdit />
                </span>
                <div>
                  <h3>{t.editCustomer}</h3>
                  <p className="manager-customer-modal-subtitle">{capitalizeName(editingCustomer.name)}</p>
                </div>
              </div>
              <button type="button" className="manager-modal-close" onClick={closeEditModal} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateCustomer} className="manager-customer-form">
              <div className="manager-form-body">{renderCustomerFormFields()}</div>
              <div className="manager-modal-footer">
                <button type="button" className="manager-modal-btn secondary" onClick={closeEditModal} disabled={updatingCustomer}>
                  {t.cancel}
                </button>
                <button type="submit" className="manager-modal-btn primary" disabled={updatingCustomer}>
                  {updatingCustomer ? t.loading : t.editCustomer}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerCustomersInfo;
