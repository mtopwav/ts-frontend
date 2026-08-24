/** User-facing labels for the Boma branch portal (replaces generic "Manager" wording). */
export const bomaLabels = {
  branch: 'Boma Branch',
  sidebarTitle: 'Boma Branch',
  userFallback: 'Boma Branch',
  dashboard: 'Boma Branch Dashboard',
  sales: 'Boma Branch Sales',
  reports: 'Boma Branch Reports',
  loans: 'Boma Branch Loans',
  transactions: 'Boma Branch Transactions',
  spareParts: 'Boma Branch Spare Parts',
  searchPlaceholder: 'Search Boma Branch records...',
  transactionsReportDesc: 'Boma Branch transactions (all payment methods)',
  transactionsReportTitle: 'BOMA BRANCH TRANSACTIONS REPORT',
  salesReportDesc: 'Boma Branch sales (all statuses)',
  salesReportTitle: 'BOMA BRANCH SALES REPORT',
  sparePartsInventoryReport: 'Boma Branch Spare Parts Inventory',
  customerInfo: 'Boma Branch Customer Info',
  generateSales: 'Boma Branch Generate Sales',
  bulkSms: 'Boma Branch Bulk SMS',
  bulkSmsManagement: 'Boma Branch Bulk SMS management',
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
    `Boma Branch transaction reports — ${period}`,
};

export function bomaUserName(user) {
  if (!user) return bomaLabels.userFallback;
  return user.full_name || user.username || bomaLabels.userFallback;
}
