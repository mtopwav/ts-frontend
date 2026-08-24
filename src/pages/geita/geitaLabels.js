/** User-facing labels for the Geita branch portal (replaces generic "Manager" wording). */
export const geitaLabels = {
  branch: 'Geita Branch',
  sidebarTitle: 'Geita Branch',
  userFallback: 'Geita Branch',
  dashboard: 'Geita Branch Dashboard',
  sales: 'Geita Branch Sales',
  reports: 'Geita Branch Reports',
  loans: 'Geita Branch Loans',
  transactions: 'Geita Branch Transactions',
  spareParts: 'Geita Branch Spare Parts',
  searchPlaceholder: 'Search Geita Branch records...',
  transactionsReportDesc: 'Geita Branch transactions (all payment methods)',
  transactionsReportTitle: 'GEITA BRANCH TRANSACTIONS REPORT',
  salesReportDesc: 'Geita Branch sales (all statuses)',
  salesReportTitle: 'GEITA BRANCH SALES REPORT',
  sparePartsInventoryReport: 'Geita Branch Spare Parts Inventory',
  customerInfo: 'Geita Branch Customer Info',
  generateSales: 'Geita Branch Generate Sales',
  bulkSms: 'Geita Branch Bulk SMS',
  bulkSmsManagement: 'Geita Branch Bulk SMS management',
  pageTitles: {
    dashboard: 'Dashboard',
    spareParts: 'Spare Parts',
    customerInfo: 'Customer Info',
    generateSales: 'Generate Sales',
    transactions: 'Transactions',
    loans: 'Loans',
    sales: 'Sales',
    reports: 'Reports',
    bulkSms: 'Bulk SMS',
  },
  transactionReportsBanner: (period) =>
    `Geita Branch transaction reports — ${period}`,
};

export function geitaUserName(user) {
  if (!user) return geitaLabels.userFallback;
  return user.full_name || user.username || geitaLabels.userFallback;
}
