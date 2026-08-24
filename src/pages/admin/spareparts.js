import { colors } from '../../utils/colors';
import React, { useState, useEffect, useRef } from 'react';
import { useResponsiveSidebar } from '../../utils/useResponsiveSidebar';
import SidebarBackdrop from '../../components/SidebarBackdrop';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
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
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaTag,
  FaTags,
  FaWarehouse,
  FaBarcode,
  FaLayerGroup,
  FaIndustry,
  FaCalendarAlt,
  FaBell,
  FaPrint,
  FaFilter,
  FaChevronDown,
  FaMapMarkerAlt
} from 'react-icons/fa';
import './spareparts.css';
import logo from '../../images/logo1.png';
import { getCategories, getBrands, addSparePart, getSpareParts, updateSparePart, deleteSparePart } from '../../services/api';
import { getCurrentDateTime, formatDateTime } from '../../utils/dateTime';
import { useTranslation } from '../../utils/useTranslation';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageSelector from '../../components/LanguageSelector';
import { getUnviewedOperationsCount } from '../../utils/notifications';
import { PageLoader } from '../../components/LoadingSpinner';
import { BRAND_NAME, DEFAULT_SUPPLIER } from '../../utils/brand';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function SpareParts() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const { sidebarOpen, isMobile, toggleSidebar, closeSidebar } = useResponsiveSidebar();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [locationFilterOpen, setLocationFilterOpen] = useState(false);
  const locationFilterRef = useRef(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [editingPart, setEditingPart] = useState(null);
  /** Current stock when opening edit; form quantity is the amount to add. */
  const [editAvailableQuantity, setEditAvailableQuantity] = useState(null);
  const [addingPart, setAddingPart] = useState(false);
  const [spareParts, setSpareParts] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [formData, setFormData] = useState({
    partName: '',
    partNumber: '',
    category: '',
    brand: '',
    quantity: '',
    retailPrice: '',
    status: 'In Stock',
    location: '',
    supplier: DEFAULT_SUPPLIER
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Function to fetch categories from database
  const fetchCategories = async () => {
    try {
      console.log('📥 Fetching categories from database...');
      const response = await getCategories();
      
      if (response && response.success && response.categories) {
        // Store categories with both id and name, sorted alphabetically (A–Z)
        const sortedCategories = [...response.categories].sort((a, b) =>
          String(a.name || '').toLowerCase().localeCompare(String(b.name || '').toLowerCase())
        );
        setCategories(sortedCategories);
        console.log(`✅ Loaded ${response.categories.length} categories from database`);
      } else {
        setCategories([]);
        console.warn('⚠️ No categories found or invalid response');
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load categories from database.',
        confirmButtonColor: colors.primary
      });
      setCategories([]);
    }
  };

  // Function to fetch brands from database
  const fetchBrands = async () => {
    try {
      console.log('📥 Fetching brands from database...');
      const response = await getBrands();
      
      if (response && response.success && response.brands) {
        // Store brands with both id and name, sorted alphabetically (A–Z)
        const sortedBrands = [...response.brands].sort((a, b) =>
          String(a.name || '').toLowerCase().localeCompare(String(b.name || '').toLowerCase())
        );
        setBrands(sortedBrands);
        console.log(`✅ Loaded ${response.brands.length} brands from database`);
      } else {
        setBrands([]);
        console.warn('⚠️ No brands found or invalid response');
      }
    } catch (error) {
      console.error('❌ Error fetching brands:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load brands from database.',
        confirmButtonColor: colors.primary
  });
      setBrands([]);
    }
  };

  // Function to fetch spare parts from database
  const fetchSpareParts = async () => {
    try {
      console.log('📥 Fetching spare parts from database...');
      const response = await getSpareParts();
      
      if (response && response.success && response.spareParts) {
        // Map database data to component format
        const mappedParts = response.spareParts.map(part => ({
          id: part.id,
          partName: part.part_name,
          partNumber: part.part_number,
          category: part.category_name || 'Unknown',
          categoryId: part.category_id,
          brand: part.brand_name || 'Unknown',
          brandId: part.brand_id,
          quantityAdded: Number(part.quantity_added) || 0,
          soldoutQuantity: Number(part.soldout_quantity) || 0,
          quantity: part.quantity,
          wholesale_price: (part.wholesale_price ?? part.wholesalePrice) != null ? Number(part.wholesale_price ?? part.wholesalePrice) : null,
          retail_price: (part.retail_price ?? part.retailPrice) != null ? Number(part.retail_price ?? part.retailPrice) : null,
          status: part.status,
          location: part.location,
          supplier: part.supplier,
          dateAdded: part.date_added,
          createdAt: part.created_at,
          updatedAt: part.updated_at
        }));
        setSpareParts(mappedParts);
        console.log(`Loaded ${mappedParts.length} spare parts from database`);
      } else {
        setSpareParts([]);
        console.warn('No spare parts found or invalid response');
      }
    } catch (error) {
      console.error('Error fetching spare parts:', error);
      console.error('Error details:', error.message);
      // Show error only if it's not a table doesn't exist error
      if (error.message && !error.message.includes('doesn\'t exist')) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to load spare parts from database.',
          confirmButtonColor: colors.primary
        });
      }
      setSpareParts([]);
    }
  };

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
    // Fetch categories, brands, and spare parts from database
    fetchCategories();
    fetchBrands();
    fetchSpareParts();

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationFilterRef.current && !locationFilterRef.current.contains(event.target)) {
        setLocationFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return <PageLoader message={t.loading || 'Loading...'} />;
  }

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  // Function to capitalize first letter of each word in a name
  const capitalizeName = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const highlightSearchText = (value) => {
    const text = String(value ?? '');
    const term = String(searchTerm || '').trim();
    if (!term) return text;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'ig');
    const termLower = term.toLowerCase();
    return text.split(regex).map((part, idx) =>
      part.toLowerCase() === termLower ? (
        <span key={`sp-hl-${idx}`} style={{ color: colors.error, fontWeight: 700 }}>
          {part}
        </span>
      ) : (
        <React.Fragment key={`sp-hl-${idx}`}>{part}</React.Fragment>
      )
    );
  };

  // Format number with commas
  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    // Remove all non-digit characters
    const numericValue = value.toString().replace(/\D/g, '');
    if (!numericValue) return '';
    // Add commas every three digits from right
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Parse formatted number back to numeric value
  const parseFormattedNumber = (value) => {
    if (!value) return '';
    // Remove commas and return numeric string
    return value.toString().replace(/,/g, '');
  };

  const handleRetailPriceChange = (e) => {
    setFormData({ ...formData, retailPrice: formatNumberWithCommas(e.target.value) });
  };

  // Quantity: text input that stores numbers only
  const handleQuantityChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, quantity: value });
  };

  // Handle part name change with capitalization
  const handlePartNameChange = (e) => {
    const value = e.target.value;
    const capitalized = capitalizeName(value);
    setFormData({ ...formData, partName: capitalized });
  };

  const emptyFormState = () => ({
    partName: '',
    partNumber: '',
    category: '',
    brand: '',
    quantity: '',
    retailPrice: '',
    status: 'In Stock',
    location: '',
    supplier: DEFAULT_SUPPLIER,
  });

  const openAddSpareModal = () => {
    setEditingPart(null);
    setEditAvailableQuantity(null);
    setFormData(emptyFormState());
    setShowAddModal(true);
  };

  const closeAddSpareModal = () => {
    setShowAddModal(false);
    setEditingPart(null);
    setEditAvailableQuantity(null);
  };

  const handleAddPart = async (e) => {
    e.preventDefault();
    setAddingPart(true);
    
    try {
      const needsQuantity = !editingPart;
      // Validation
      if (
        !formData.partName ||
        !formData.partNumber ||
        !formData.category ||
        !formData.brand ||
        (needsQuantity && !formData.quantity) ||
        !formData.retailPrice ||
        !formData.location
      ) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please fill in all required fields (including retail price).',
          confirmButtonColor: colors.primary
        });
        setAddingPart(false);
        return;
      }

      const retailVal = parseFloat(parseFormattedNumber(formData.retailPrice)) || 0;
      if (retailVal < 0) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Retail price must be 0 or greater.',
          confirmButtonColor: colors.primary
        });
        setAddingPart(false);
        return;
      }

      const normalizedPartNumber = formData.partNumber.trim().toLowerCase();
      const normalizedLocation = formData.location.trim().toLowerCase();
      const duplicateAtLocation = spareParts.find(
        (p) =>
          String(p.partNumber || '').trim().toLowerCase() === normalizedPartNumber &&
          String(p.location || '').trim().toLowerCase() === normalizedLocation &&
          (!editingPart || p.id !== editingPart.id)
      );
      if (duplicateAtLocation) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'A spare part with this part number already exists at the selected location. Choose a different location or part number.',
          confirmButtonColor: colors.primary
        });
        setAddingPart(false);
        return;
      }
      
      // Find category and brand IDs by name
      const selectedCategory = categories.find(cat => cat.name === formData.category);
      const selectedBrand = brands.find(brand => brand.name === formData.brand);
      
      if (!selectedCategory || !selectedBrand) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please select valid category and brand.',
          confirmButtonColor: colors.primary
        });
        setAddingPart(false);
        return;
      }
      
      const baseStock = editingPart ? Number(editAvailableQuantity) || 0 : 0;
      const qtyRaw = String(formData.quantity ?? '').trim();
      let qty;
      let quantityToAdd = 0;
      if (editingPart) {
        quantityToAdd = qtyRaw === '' ? 0 : parseInt(qtyRaw, 10);
        if (qtyRaw !== '' && (Number.isNaN(quantityToAdd) || quantityToAdd < 0)) {
          Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Quantity to add must be a valid number (≥ 0), or leave blank to keep stock unchanged.',
            confirmButtonColor: colors.primary,
          });
          setAddingPart(false);
          return;
        }
        qty = baseStock + quantityToAdd;
      } else {
        qty = parseInt(formData.quantity, 10);
        if (Number.isNaN(qty) || qty < 0) {
          Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Quantity must be a valid number (≥ 0).',
            confirmButtonColor: colors.primary,
          });
          setAddingPart(false);
          return;
        }
      }
      const sparePartData = {
        part_name: formData.partName.trim(),
        part_number: formData.partNumber.trim(),
        category_id: selectedCategory.id,
        brand_id: selectedBrand.id,
        quantity: qty,
        wholesale_price: editingPart?.wholesale_price ?? null,
        retail_price: retailVal,
        status: formData.status,
        location: formData.location.trim(),
        supplier: formData.supplier || DEFAULT_SUPPLIER
      };
      if (!editingPart) {
        sparePartData.quantity_added = qty;
      } else if (quantityToAdd > 0) {
        sparePartData.quantity_to_add = quantityToAdd;
      }
      
      console.log('Sending spare part data to API:', sparePartData);
      
      // Add or update spare part
      const response = editingPart
        ? await updateSparePart(editingPart.id, sparePartData)
        : await addSparePart(sparePartData);
      
      console.log('API Response:', response);
      
      if (response && response.success) {
      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: editingPart ? 'Spare part updated successfully.' : 'Spare part added successfully.',
        confirmButtonColor: colors.primary,
        timer: 2000,
        showConfirmButton: false
      });
      
      // Reset form
      setFormData(emptyFormState());
      closeAddSpareModal();
        
        // Refresh spare parts list from database
        fetchSpareParts();
      } else {
        throw new Error(response.message || 'Failed to add spare part');
      }
    } catch (error) {
      console.error('Error adding spare part:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to add spare part. Please try again.',
        confirmButtonColor: colors.primary
      });
    } finally {
      setAddingPart(false);
    }
  };

  const handleView = (part) => {
    setSelectedPart(part);
    setShowViewModal(true);
  };

  const handleEdit = (part) => {
    setEditingPart(part);
    setEditAvailableQuantity(Number(part.quantity) || 0);
    setFormData({
      partName: part.partName || '',
      partNumber: part.partNumber || '',
      category: part.category || '',
      brand: part.brand || '',
      quantity: '',
      retailPrice: formatNumberWithCommas(part.retail_price ?? ''),
      status: part.status || 'In Stock',
      location: part.location || '',
      supplier: part.supplier || DEFAULT_SUPPLIER
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    const part = spareParts.find(p => p.id === id);
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${part?.partName || 'this spare part'}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: colors.error,
      cancelButtonColor: colors.textMuted,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        // Call API to delete spare part from database
        const response = await deleteSparePart(id);
        
        if (response && response.success) {
          // Refresh spare parts list from database
          await fetchSpareParts();
          
          Swal.fire({
            title: 'Deleted!',
            text: 'Spare part has been deleted successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            confirmButtonColor: colors.primary
          });
        } else {
          throw new Error(response?.message || 'Failed to delete spare part');
        }
      } catch (error) {
        console.error('Error deleting spare part:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to delete spare part. Please try again.',
          confirmButtonColor: colors.primary
        });
      }
    }
  };

  const filteredParts = spareParts.filter((part) => {
    const matchesSearch =
      part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLowStock = !showLowStockOnly || (Number(part.quantity) || 0) < 10;
    const matchesLocation =
      !locationFilter ||
      String(part.location || '').trim().toLowerCase() === locationFilter.toLowerCase();
    return matchesSearch && matchesLowStock && matchesLocation;
  });

  const sortedFilteredParts = [...filteredParts].sort((a, b) =>
    String(a.partName || '').toLowerCase().localeCompare(String(b.partName || '').toLowerCase())
  );

  const getStockMeta = (qtyValue) => {
    const qty = Number(qtyValue) || 0;
    if (qty < 10) return { status: 'Low Stock', className: 'qty-low' };
    if (qty <= 100) return { status: 'In Stock', className: 'qty-medium' };
    return { status: 'In Stock', className: 'qty-high' };
  };

  const sparePartLocations = ['Boma', 'Geita'];

  const locationFilterOptions = [
    { value: '', label: 'All Locations', hint: 'Boma & Geita' },
    { value: 'Boma', label: 'Boma', hint: 'Boma branch only' },
    { value: 'Geita', label: 'Geita', hint: 'Geita branch only' },
  ];

  const activeLocationOption =
    locationFilterOptions.find((opt) => opt.value === locationFilter) || locationFilterOptions[0];

  const handleLocationFilterSelect = (value) => {
    setLocationFilter(value);
    setLocationFilterOpen(false);
  };

  const buildManagerStyleInventoryDocument = () => {
    const safe = (v) => String(v ?? '').replace(/</g, '&lt;');
    const logoPath = typeof logo === 'string' ? logo : (logo && logo.default) ? logo.default : '';
    const logoUrl = logoPath
      ? (logoPath.startsWith('http') ? logoPath : window.location.origin + (logoPath.startsWith('/') ? logoPath : '/' + logoPath))
      : window.location.origin + logo;
    const printedAt = new Date().toLocaleString('en-GB');
    const printedBy = safe(user?.full_name || user?.username || 'Admin');
    const categoryLabel = 'All categories';
    const scopeLabel = [
      showLowStockOnly ? 'Low stock only' : null,
      locationFilter ? `${locationFilter} only` : null,
    ]
      .filter(Boolean)
      .join(', ') || 'All stock';
    const rowsHtml =
      sortedFilteredParts.length === 0
        ? `<tr><td colspan="7" class="no-data">No spare parts found</td></tr>`
        : sortedFilteredParts
            .map((part, idx) => {
              const qty = Number(part.quantity) || 0;
              const isLow = qty < 10;
              const qtyAdded = Number(part.quantityAdded) || 0;
              return `
                <tr>
                  <td class="tc">${idx + 1}</td>
                  <td class="tl">${safe(capitalizeName(part.partName || '—'))}</td>
                  <td class="tl">${safe(String(part.partNumber || '—').toUpperCase())}</td>
                  <td class="tl">${safe(capitalizeName(part.category || '—'))}</td>
                  <td class="tl">${safe(String(part.brand || '—').toUpperCase())}</td>
                  <td class="tr">${qtyAdded}</td>
                  <td class="tr ${isLow ? 'qty-low' : ''}">${qty}</td>
                </tr>
              `;
            })
            .join('');
    return `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Spare Parts Inventory - ${BRAND_NAME}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 980px; margin: 0 auto; padding: 24px; color: #222; font-size: 11px; line-height: 1.4; }
            .top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid #333; gap: 16px; }
            .left { display: flex; gap: 16px; align-items: flex-start; flex: 1; }
            .logo { max-height: 56px; max-width: 140px; object-fit: contain; }
            .company h2 { margin: 0 0 6px 0; font-size: 1.15rem; font-weight: 800; }
            .company p { margin: 0; color: #444; font-size: 10px; line-height: 1.5; }
            .meta { text-align: right; min-width: 220px; }
            .meta p { margin: 0 0 6px 0; font-size: 11px; }
            .title { text-align: center; font-size: 1.6rem; font-weight: 800; margin: 18px 0 14px; letter-spacing: 0.05em; }
            .subtitle { text-align: center; margin: 0 0 18px; color: #444; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #333; font-size: 10px; }
            th, td { border: 1px solid #333; padding: 6px 8px; vertical-align: middle; }
            th { background: #f0f0f0; font-weight: 700; text-align: center; }
            .tc { text-align: center; }
            .tr { text-align: right; }
            .tl { text-align: left; }
            .no-data { text-align: center; padding: 18px; color: #6c757d; }
            .qty-low { color: #dc3545; font-weight: 700; }
            .footer { margin-top: 20px; padding-top: 14px; border-top: 1px solid #ccc; font-size: 11px; }
            .footer-row { margin-bottom: 10px; }
            .footer-row label { display: inline-block; min-width: 220px; font-weight: 700; }
            @media print { body { padding: 16px; } .logo { max-height: 48px; } }
          </style>
        </head>
        <body>
          <div class="top">
            <div class="left">
              <img src="${safe(logoUrl)}" alt="Logo" class="logo" />
              <div class="company">
                <h2>${BRAND_NAME}</h2>
                <p>Kilimanjaro, Tanzania<br />Phone: +255 22 123 4567</p>
              </div>
            </div>
            <div class="meta">
              <p><strong>Report:</strong> Spare Parts Inventory</p>
              <p><strong>Category:</strong> ${safe(categoryLabel)}</p>
              <p><strong>Scope:</strong> ${safe(scopeLabel)}</p>
              <p><strong>Printed:</strong> ${safe(printedAt)}</p>
              <p><strong>Printed by:</strong> ${printedBy}</p>
            </div>
          </div>
          <h1 class="title">INVENTORY REPORT</h1>
          <p class="subtitle">Showing ${sortedFilteredParts.length} item(s)</p>
          <table>
            <thead>
              <tr>
                <th class="tc">S.No</th>
                <th class="tl">Part name</th>
                <th class="tl">Part number</th>
                <th class="tl">Category</th>
                <th class="tl">Brand</th>
                <th class="tr">Quantity added</th>
                <th class="tr">Quantity</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="footer">
            <div class="footer-row"><label>Total items shown:</label> ${sortedFilteredParts.length}</div>
          </div>
        </body>
      </html>`;
  };

  const handlePrintTable = () => {
    const w = window.open('', '_blank', 'width=1100,height=750');
    if (!w) return;
    w.document.write(buildManagerStyleInventoryDocument());
    w.document.close();
    w.focus();
    w.print();
  };

  // Format currency (handles values from DB: number, string, null, undefined)
  const formatCurrency = (amount) => {
    const num = amount == null || amount === '' ? 0 : Number(amount);
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(Number.isNaN(num) ? 0 : num);
  };

  // Stock quantity chart: filtered parts, highest stock first (top 12)
  const partsForChart = [...filteredParts]
    .sort((a, b) => (Number(b.quantity) || 0) - (Number(a.quantity) || 0))
    .slice(0, 12);
  const quantities = partsForChart.map((part) => Number(part.quantity) || 0);

  const getStockBarColor = (qty) => {
    if (qty <= 0) {
      return { bg: 'rgba(3, 3, 3, 0.55)', border: '#030303' };
    }
    if (qty < 10) {
      return { bg: 'rgba(255, 0, 0, 0.78)', border: '#FF0000' };
    }
    if (qty <= 100) {
      return { bg: 'rgba(86, 39, 49, 0.78)', border: '#562731' };
    }
    return { bg: 'rgba(22, 163, 74, 0.78)', border: '#16A34A' };
  };

  const chartLabel = t.stockQuantity ?? 'Stock Quantity';
  const chartTitle = t.stockQuantityByPart ?? 'Stock Quantity by Part';
  const totalChartUnits = quantities.reduce((sum, q) => sum + q, 0);
  const lowStockInChart = quantities.filter((q) => q < 10).length;

  const chartData = {
    labels: partsForChart.map((part) => {
      const name = capitalizeName(part.partName || '—');
      return name.length > 22 ? `${name.slice(0, 20)}…` : name;
    }),
    datasets: [
      {
        label: chartLabel,
        data: quantities,
        backgroundColor: quantities.map((qty) => getStockBarColor(qty).bg),
        borderColor: quantities.map((qty) => getStockBarColor(qty).border),
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 18,
        maxBarThickness: 24,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 900,
      easing: 'easeOutQuart',
    },
    layout: {
      padding: { top: 4, right: 16, bottom: 4, left: 4 },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#030303',
        titleColor: '#FEFEFE',
        bodyColor: '#FEFEFE',
        borderColor: '#FF0000',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex;
            const part = partsForChart[idx];
            return part ? capitalizeName(part.partName) : '';
          },
          label: (ctx) => {
            const qty = Number(ctx.raw) || 0;
            const meta = getStockMeta(qty);
            const loc = partsForChart[ctx.dataIndex]?.location || '—';
            return [`Quantity: ${qty}`, `Status: ${meta.status}`, `Location: ${loc}`];
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(86, 39, 49, 0.08)',
          drawBorder: false,
        },
        ticks: {
          precision: 0,
          color: '#562731',
          font: { size: 11, weight: '600' },
        },
        title: {
          display: true,
          text: chartLabel,
          color: '#562731',
          font: { size: 12, weight: '700' },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#030303',
          font: { size: 11, weight: '600' },
        },
      },
    },
  };

  return (
    <div className="spareparts-container">
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
          <Link to="/admin/spareparts" className="nav-item active">
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
            <span>Transactions</span>
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
        <header className="spareparts-header">
          <div className="header-left">
            <button 
              className="menu-toggle"
              onClick={toggleSidebar}
            >
              <FaBars />
            </button>
            <h1 className="page-title">{t.spareParts}</h1>
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

        {/* Spare Parts Content */}
        <div className="spareparts-content">
          {/* Action Bar */}
          <div className="action-bar">
            <div className="action-bar-search-group">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder={`${t.search} ${t.spareParts.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div
                className={`location-filter-dropdown${locationFilter ? ' location-filter-active' : ''}${locationFilterOpen ? ' is-open' : ''}`}
                ref={locationFilterRef}
              >
                <button
                  type="button"
                  id="spareparts-location-filter"
                  className="location-filter-btn"
                  onClick={() => setLocationFilterOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={locationFilterOpen}
                  aria-label={`${t.location} filter`}
                >
                  <FaFilter className="location-filter-icon" aria-hidden="true" />
                  <span className="location-filter-label">{activeLocationOption.label}</span>
                  <FaChevronDown className="location-filter-chevron" aria-hidden="true" />
                </button>
                {locationFilterOpen && (
                  <ul className="location-filter-menu" role="listbox" aria-label={`${t.location} options`}>
                    {locationFilterOptions.map((opt) => (
                      <li key={opt.value || 'all'} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={locationFilter === opt.value}
                          className={`location-filter-option${locationFilter === opt.value ? ' is-selected' : ''}`}
                          onClick={() => handleLocationFilterSelect(opt.value)}
                        >
                          <FaMapMarkerAlt className="location-filter-option-icon" aria-hidden="true" />
                          <span className="location-filter-option-text">
                            <span className="location-filter-option-label">{opt.label}</span>
                            <span className="location-filter-option-hint">{opt.hint}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="action-bar-actions">
            <button
              type="button"
              className="add-btn"
              onClick={() => setShowLowStockOnly((v) => !v)}
              style={{
                background: showLowStockOnly
                  ? 'linear-gradient(135deg, #dc3545, #b02a37)'
                  : 'linear-gradient(135deg, #6c757d, #495057)'
              }}
            >
              {showLowStockOnly ? 'Show All' : 'Low Stock'}
            </button>
            <button type="button" className="add-btn" onClick={handlePrintTable}>
              <FaPrint /> Print
            </button>
            <button className="add-btn" onClick={openAddSpareModal}>
              <FaPlus /> {t.addSparePart}
            </button>
            </div>
          </div>

          {/* Stock Chart */}
          {filteredParts.length > 0 && (
            <div className="chart-container stock-qty-chart">
              <div className="chart-card stock-qty-chart-card">
                <div className="stock-qty-chart-header">
                  <div>
                    <h2 className="stock-qty-chart-title">{chartTitle}</h2>
                    <p className="stock-qty-chart-subtitle">
                      Top {partsForChart.length} parts by quantity
                      {showLowStockOnly || locationFilter || searchTerm
                        ? ' · matching current filters'
                        : ''}
                    </p>
                  </div>
                  <div className="stock-qty-chart-meta">
                    <span>
                      <strong>{totalChartUnits.toLocaleString()}</strong> units shown
                    </span>
                    <span className={lowStockInChart > 0 ? 'is-alert' : ''}>
                      <strong>{lowStockInChart}</strong> low stock
                    </span>
                  </div>
                </div>
                <div className="stock-qty-chart-legend" aria-hidden>
                  <span className="legend-item">
                    <i className="swatch swatch-high" /> Healthy (&gt;100)
                  </span>
                  <span className="legend-item">
                    <i className="swatch swatch-mid" /> Medium (10–100)
                  </span>
                  <span className="legend-item">
                    <i className="swatch swatch-low" /> Low (&lt;10)
                  </span>
                  <span className="legend-item">
                    <i className="swatch swatch-empty" /> Empty (0)
                  </span>
                </div>
                <div className="stock-qty-chart-canvas">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
            </div>
          )}

          {/* Spare Parts Table */}
          <div className="table-container">
            <table className="spareparts-table">
              <thead>
                <tr>
                  <th>{t.actions}</th>
                  <th>S.No</th>
                  <th>{t.partName}</th>
                  <th>{t.partNumber}</th>
                  <th>{t.category}</th>
                  <th>{t.brand}</th>
                  <th>Quantity Added</th>
                  <th>{t.quantity}</th>
                  <th>Soldout Quantity</th>
                  <th>Price</th>
                  <th>{t.status}</th>
                  <th>{t.location}</th>
                </tr>
              </thead>
              <tbody>
                {sortedFilteredParts.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="no-data">
                      {t.noData}
                    </td>
                  </tr>
                ) : (
                  sortedFilteredParts.map((part, index) => {
                    const stockMeta = getStockMeta(part.quantity);
                    const displayStatus =
                      String(part.status || '').trim().toLowerCase() === 'discontinued'
                        ? 'Discontinued'
                        : String(part.status || '').trim().toLowerCase() === 'out of stock'
                        ? 'Out of Stock'
                        : stockMeta.status;
                    return (
                    <tr key={part.id}>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view" 
                            title={t.view}
                            onClick={() => handleView(part)}
                          >
                            <FaEye className="action-icon" />
                            <span className="action-text">{t.view}</span>
                          </button>
                          <button 
                            className="action-btn edit" 
                            title={t.edit}
                            onClick={() => handleEdit(part)}
                          >
                            <FaEdit className="action-icon" />
                            <span className="action-text">{t.edit}</span>
                          </button>
                          <button 
                            className="action-btn delete" 
                            title={t.delete} 
                            onClick={() => handleDelete(part.id)}
                          >
                            <FaTrash className="action-icon" />
                            <span className="action-text">{t.delete}</span>
                          </button>
                        </div>
                      </td>
                      <td>{index + 1}</td>
                      <td>
                        <div className="part-name">
                          <FaTag className="name-icon" />
                          {highlightSearchText(capitalizeName(part.partName))}
                        </div>
                      </td>
                      <td>
                        <div className="part-number">
                          <FaBarcode className="number-icon" />
                          {highlightSearchText((part.partNumber || '').toUpperCase())}
                        </div>
                      </td>
                      <td>
                        <span className="category-badge">
                          <FaLayerGroup className="category-icon" />
                          {highlightSearchText(capitalizeName(part.category))}
                        </span>
                      </td>
                      <td>
                        <div className="brand-name">
                          <FaIndustry className="brand-icon" />
                          {highlightSearchText(capitalizeName(part.brand))}
                        </div>
                      </td>
                      <td className="quantity-added-value">{part.quantityAdded}</td>
                      <td>
                        <span className={`quantity-badge ${stockMeta.className}`}>
                          {part.quantity}
                        </span>
                      </td>
                      <td>{part.soldoutQuantity}</td>
                      <td>{formatCurrency(part.retail_price)}</td>
                      <td>
                        <span className={`status-badge ${displayStatus.toLowerCase().replace(' ', '-')}`}>
                          {highlightSearchText(displayStatus)}
                        </span>
                      </td>
                      <td>{highlightSearchText(capitalizeName(part.location))}</td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Spare Part Modal */}
      {showAddModal && (
        <div
          className="modal-overlay sparepart-form-overlay"
          onClick={() => {
            if (!addingPart) closeAddSpareModal();
          }}
        >
          <div className="modal-content sparepart-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sparepart-form-header">
              <div className="sparepart-form-header-text">
                <div className="sparepart-form-header-icon">
                  {editingPart ? <FaEdit /> : <FaPlus />}
                </div>
                <div>
                  <h2>{editingPart ? (t.edit || 'Edit spare part') : (t.addSparePart || 'Add spare part')}</h2>
                  <p>
                    {editingPart
                      ? `${capitalizeName(editingPart.partName || '')} · ${(editingPart.partNumber || '').toUpperCase()}`
                      : (t.addSparePartHint || 'Register a new spare part in inventory')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="sparepart-form-close"
                onClick={closeAddSpareModal}
                disabled={addingPart}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddPart} className="sparepart-form-body">
              <div className="sparepart-form-grid">
                <section className="sparepart-form-panel">
                  <h3 className="sparepart-form-panel-title"><FaTag /> {t.partDetails || 'Part details'}</h3>
                  <div className="sparepart-form-field">
                    <label htmlFor="sparepart-name">{t.partName} *</label>
                    <input
                      id="sparepart-name"
                      type="text"
                      required
                      className="sparepart-form-input"
                      value={formData.partName}
                      onChange={handlePartNameChange}
                      placeholder={t.partName}
                    />
                  </div>
                  <div className="sparepart-form-field">
                    <label htmlFor="sparepart-number">{t.partNumber} *</label>
                    <input
                      id="sparepart-number"
                      type="text"
                      required
                      className="sparepart-form-input sparepart-form-input--mono"
                      value={formData.partNumber}
                      onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                      placeholder={t.partNumber}
                    />
                  </div>
                  <div className="sparepart-form-row">
                    <div className="sparepart-form-field">
                      <label htmlFor="sparepart-category">{t.category} *</label>
                      <select
                        id="sparepart-category"
                        required
                        className="sparepart-form-input"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="">{t.select || 'Select'} {t.category}</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>{capitalizeName(cat.name)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sparepart-form-field">
                      <label htmlFor="sparepart-brand">{t.brand} *</label>
                      <select
                        id="sparepart-brand"
                        required
                        className="sparepart-form-input"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      >
                        <option value="">{t.select || 'Select'} {t.brand}</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.name}>{capitalizeName(brand.name)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="sparepart-form-field">
                    <label htmlFor="sparepart-supplier">{t.supplier}</label>
                    <input
                      id="sparepart-supplier"
                      type="text"
                      className="sparepart-form-input sparepart-form-input--readonly"
                      value={formData.supplier}
                      readOnly
                      placeholder={t.supplier}
                    />
                  </div>
                </section>

                <section className="sparepart-form-panel sparepart-form-panel--stock">
                  <h3 className="sparepart-form-panel-title"><FaWarehouse /> {t.stockAndPricing || 'Stock & pricing'}</h3>
                  <div className="sparepart-form-row">
                    <div className="sparepart-form-field">
                      <label>{t.status} *</label>
                      <input
                        type="text"
                        readOnly
                        className="sparepart-form-input sparepart-form-input--readonly"
                        value={t.inStock}
                      />
                    </div>
                    {editingPart && (
                      <div className="sparepart-form-field">
                        <label>{t.availableQuantity || 'Available quantity'}</label>
                        <input
                          type="text"
                          readOnly
                          className="sparepart-form-input sparepart-form-input--readonly"
                          value={editAvailableQuantity ?? ''}
                        />
                      </div>
                    )}
                  </div>
                  <div className="sparepart-form-field">
                    <label htmlFor="sparepart-quantity">
                      {editingPart ? (t.addToStock || 'Quantity to add') : `${t.quantity} *`}
                    </label>
                    <input
                      id="sparepart-quantity"
                      type="text"
                      inputMode="numeric"
                      required={!editingPart}
                      className="sparepart-form-input"
                      value={formData.quantity}
                      onChange={handleQuantityChange}
                      placeholder={editingPart ? (t.optionalAddStock || '0 = no change') : t.quantity}
                    />
                    {editingPart && (
                      <p className="sparepart-form-hint">
                        {t.addStockHint || 'Leave empty or 0 to keep current stock. Enter an amount to add to available quantity.'}
                      </p>
                    )}
                  </div>
                  <div className="sparepart-form-field">
                    <label htmlFor="sparepart-retail">Price (TZS) *</label>
                    <input
                      id="sparepart-retail"
                      type="text"
                      required
                      className="sparepart-form-input sparepart-form-input--amount"
                      value={formData.retailPrice}
                      onChange={handleRetailPriceChange}
                      placeholder="0"
                    />
                  </div>
                  <div className="sparepart-form-field">
                    <label htmlFor="sparepart-location">{t.location} *</label>
                    <select
                      id="sparepart-location"
                      required
                      className="sparepart-form-input"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    >
                      <option value="">{t.select || 'Select'} {t.location}</option>
                      {sparePartLocations.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </section>
              </div>

              <div className="sparepart-form-footer">
                <button type="button" className="cancel-btn" onClick={closeAddSpareModal} disabled={addingPart}>
                  {t.cancel}
                </button>
                <button type="submit" className="sparepart-form-save-btn" disabled={addingPart}>
                  {addingPart
                    ? (t.loading || 'Saving...')
                    : (editingPart ? (t.edit || 'Update') : (t.addSparePart || 'Add spare part'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Spare Part Modal */}
      {showViewModal && selectedPart && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Spare Part Details</h2>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="view-content">
              <div className="view-section">
                <div className="view-item">
                  <label>Part Name:</label>
                  <div className="view-value">
                    <FaTag className="view-icon" />
                    {capitalizeName(selectedPart.partName)}
                  </div>
                </div>
                <div className="view-item">
                  <label>Part Number:</label>
                  <div className="view-value">
                    <FaBarcode className="view-icon" />
                    {(selectedPart.partNumber || '').toUpperCase()}
                  </div>
                </div>
                <div className="view-item">
                  <label>Category:</label>
                  <div className="view-value">
                    <FaLayerGroup className="view-icon" />
                    <span className="category-badge">{capitalizeName(selectedPart.category)}</span>
                  </div>
                </div>
                <div className="view-item">
                  <label>Brand:</label>
                  <div className="view-value">
                    <FaIndustry className="view-icon" />
                    {capitalizeName(selectedPart.brand)}
                  </div>
                </div>
                <div className="view-item">
                  <label>Quantity:</label>
                  <div className="view-value">{selectedPart.quantity}</div>
                </div>
                <div className="view-item">
                  <label>{t.wholesalePrice}</label>
                  <div className="view-value">{formatCurrency(selectedPart.wholesale_price)}</div>
                </div>
                <div className="view-item">
                  <label>{t.retailPrice}</label>
                  <div className="view-value">{formatCurrency(selectedPart.retail_price)}</div>
                </div>
                <div className="view-item">
                  <label>Status:</label>
                  <div className="view-value">
                    <span className={`status-badge ${selectedPart.status.toLowerCase().replace(' ', '-')}`}>
                      {selectedPart.status}
                    </span>
                  </div>
                </div>
                <div className="view-item">
                  <label>Location:</label>
                  <div className="view-value">{capitalizeName(selectedPart.location)}</div>
                </div>
                {selectedPart.supplier && (
                  <div className="view-item">
                    <label>Supplier:</label>
                    <div className="view-value">{selectedPart.supplier}</div>
                  </div>
                )}
                <div className="view-item">
                  <label>Date Added:</label>
                  <div className="view-value">{formatDateTime(selectedPart.createdAt || selectedPart.dateAdded) || '—'}</div>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpareParts;
