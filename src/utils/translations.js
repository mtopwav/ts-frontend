const STORAGE_KEY = 'appLanguage';

const TRANSLATIONS = {
  en: {
    loading: "Loading...",
    dashboard: "Dashboard",
    categoriesBrands: "Categories & Brands",
    spareParts: "Spare Parts",
    sales: "Sales",
    employees: "Employees",
    reports: "Reports",
    settings: "Settings",
    logout: "Logout",
    cancel: "Cancel",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    search: "Search",
    customer: "Customer",
    customers: "Customers",
    date: "Date",
    status: "Status",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    totalAmount: "Total Amount",
    totalAmountTZS: "Total Amount (TZS)",
    approvedAmountTZS: "Approved Amount (TZS)",
    todaySalesTZS: "Today's Sales (TZS)",
    totalOutstandingTZS: "Total Outstanding (TZS)",
    noData: "No data",
    allTime: "All time",
    sparePart: "Spare Part",
    transactions: "Transactions",
    loans: "Loans",
    messages: "Messages",
    generateSales: "Generate Sales",
    yesLogout: "Yes, logout",
    areYouSureLogout: "Are you sure you want to logout?",
    redirectingToLogin: "Redirecting to login...",
    totalParts: "Total Parts",
    totalOrders: "Total Orders",
    todaySales: "Today's Sales",
    totalReceived: "Total received",
    totalWholesaleValue: "Total Wholesale Value",
    totalRetailValue: "Total Retail Value",
    totalSoldOutSpareparts: "Total Sold Out Spareparts",
    soldOutQuantity: "Sold-out quantity",
    recentOperations: "Recent Operations",
    noRecentOperations: "No recent operations",
    quickActions: "Quick Actions",
    viewReports: "View Reports",
    sale: "sale",
    order: "order",
    orders: "orders",
    na: "N/A",
    justNow: "Just now",
    timeAgoMinutes: "%s min ago",
    timeAgoHours: "%s hr ago",
    timeAgoDays: "%s days ago",
    timeAgoWeeks: "%s weeks ago",
    timeAgoMonths: "%s months ago",
    paymentApproved: "Payment #%s approved",
    paymentRejected: "Payment #%s rejected",
    newSparePartAdded: "New spare part added: %s",
    newCustomerRegistered: "New customer registered: %s",
    dateFormat: "Date format",
    timeFormat: "Time format",
    language: "Language",
    theme: "Theme",
    finances: "Finances",
    timezone: "Timezone",
    noTransactionsInRange: "No transactions in the selected period.",
    name: "Name",
    phone: "Phone",
    address: "Address",
    actions: "Actions",
    quantity: "Quantity",
    price: "Price",
    wholesale: "Wholesale",
    retail: "Retail",
    category: "Category",
    brand: "Brand",
    active: "Active",
    inactive: "Inactive",
    confirm: "Confirm",
    success: "Success",
    error: "Error",
    welcome: "Welcome",
    home: "Home",
    login: "Login",
    details: "Details",
    view: "View",
    approve: "Approve",
    receiveMoney: "Receive Money",
    showing: "Showing",
    today: "Today",
  },
  sw: {
    loading: "Inapakia...",
    dashboard: "Dashibodi",
    categoriesBrands: "Jamii na Chapa",
    spareParts: "Vipuri",
    sales: "Mauzo",
    employees: "Wafanyakazi",
    reports: "Ripoti",
    settings: "Mipangilio",
    logout: "Toka",
    cancel: "Ghairi",
    add: "Ongeza",
    edit: "Hariri",
    delete: "Futa",
    save: "Hifadhi",
    search: "Tafuta",
    customer: "Mteja",
    customers: "Wateja",
    date: "Tarehe",
    status: "Hali",
    pending: "Inasubiri",
    approved: "Imekubaliwa",
    rejected: "Imekataliwa",
    totalAmount: "Jumla",
    totalAmountTZS: "Jumla (TZS)",
    approvedAmountTZS: "Kiasi Kilichokubaliwa (TZS)",
    todaySalesTZS: "Mauzo ya Leo (TZS)",
    totalOutstandingTZS: "Jumla Inayodaiwa (TZS)",
    noData: "Hakuna data",
    allTime: "Muda wote",
    sparePart: "Kipuri",
    transactions: "Miamala",
    loans: "Mikopo",
    messages: "Ujumbe",
    generateSales: "Tengeneza Mauzo",
    yesLogout: "Ndiyo, toka",
    areYouSureLogout: "Una uhakika unataka kutoka?",
    redirectingToLogin: "Inaelekeza kwenye kuingia...",
    totalParts: "Jumla ya Vipuri",
    totalOrders: "Jumla ya Maagizo",
    todaySales: "Mauzo ya Leo",
    totalReceived: "Jumla iliyopokelewa",
    totalWholesaleValue: "Jumla ya Bei ya Jumla",
    totalRetailValue: "Jumla ya Bei ya Rejareja",
    totalSoldOutSpareparts: "Vipuri Vilivyoisha",
    soldOutQuantity: "Idadi iliyoisha",
    recentOperations: "Shughuli za Hivi Karibuni",
    noRecentOperations: "Hakuna shughuli za hivi karibuni",
    quickActions: "Vitendo vya Haraka",
    viewReports: "Angalia Ripoti",
    sale: "uuzaji",
    order: "agizo",
    orders: "maagizo",
    na: "N/A",
    justNow: "Sasa hivi",
    timeAgoMinutes: "dakika %s zilizopita",
    timeAgoHours: "saa %s zilizopita",
    timeAgoDays: "siku %s zilizopita",
    timeAgoWeeks: "wiki %s zilizopita",
    timeAgoMonths: "miezi %s iliyopita",
    paymentApproved: "Malipo #%s yamekubaliwa",
    paymentRejected: "Malipo #%s yamekataliwa",
    newSparePartAdded: "Kipuri kipya kimeongezwa: %s",
    newCustomerRegistered: "Mteja mpya amesajiliwa: %s",
    dateFormat: "Muundo wa tarehe",
    timeFormat: "Muundo wa muda",
    language: "Lugha",
    theme: "Mandhari",
    finances: "Fedha",
    timezone: "Saa za eneo",
    noTransactionsInRange: "Hakuna miamala katika kipindi kilichochaguliwa.",
    name: "Jina",
    phone: "Simu",
    address: "Anwani",
    actions: "Vitendo",
    quantity: "Idadi",
    price: "Bei",
    wholesale: "Jumla",
    retail: "Rejareja",
    category: "Jamii",
    brand: "Chapa",
    active: "Hai",
    inactive: "Haifanyi kazi",
    confirm: "Thibitisha",
    success: "Imefanikiwa",
    error: "Hitilafu",
    welcome: "Karibu",
    home: "Nyumbani",
    login: "Ingia",
    details: "Maelezo",
    view: "Angalia",
    approve: "Kubali",
    receiveMoney: "Pokea Pesa",
    showing: "Inaonyesha",
    today: "Leo",
  },
};

function humanizeKey(key) {
  if (/TZS$/i.test(key)) {
    const base = key.slice(0, -3);
    const enBase = TRANSLATIONS.en[base];
    const baseLabel = enBase
      ? enBase
      : base
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase())
          .trim();
    return `${baseLabel} (TZS)`;
  }
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function getCurrentLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'sw' || stored === 'en') return stored;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function setCurrentLanguage(lang) {
  const next = lang === 'sw' ? 'sw' : 'en';
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: next } }));
  }
  return next;
}

export function getTranslations(lang = getCurrentLanguage()) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return new Proxy(dict, {
    get(target, prop) {
      if (typeof prop !== 'string') return target[prop];
      if (prop in target) return target[prop];
      const en = TRANSLATIONS.en[prop];
      if (en) return en;
      return humanizeKey(prop);
    },
  });
}

export { STORAGE_KEY as LANGUAGE_STORAGE_KEY };
