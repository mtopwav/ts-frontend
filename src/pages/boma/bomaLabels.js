import { getTranslations, getCurrentLanguage } from '../../utils/translations';

/** Build Boma branch labels for the current (or given) UI language. */
export function getBomaLabels(lang = getCurrentLanguage()) {
  const t = getTranslations(lang);
  return {
    branch: t.bomaBranch,
    sidebarTitle: t.bomaBranch,
    userFallback: t.bomaBranch,
    dashboard: `${t.bomaBranch} — ${t.dashboard}`,
    sales: `${t.bomaBranch} — ${t.sales}`,
    reports: `${t.bomaBranch} — ${t.reports}`,
    loans: `${t.bomaBranch} — ${t.loans}`,
    expenses: `${t.bomaBranch} — ${t.expenses}`,
    transactions: `${t.bomaBranch} — ${t.transactions}`,
    spareParts: `${t.bomaBranch} — ${t.spareParts}`,
    searchPlaceholder: `${t.search} ${t.bomaBranch}...`,
    transactionsReportDesc: `${t.bomaBranch} ${t.transactions} (${t.allPaymentMethods})`,
    transactionsReportTitle: `${t.bomaBranch.toUpperCase()} — ${t.transactions.toUpperCase()}`,
    salesReportDesc: `${t.bomaBranch} ${t.sales}`,
    salesReportTitle: `${t.bomaBranch.toUpperCase()} — ${t.sales.toUpperCase()}`,
    sparePartsInventoryReport: `${t.bomaBranch} — ${t.spareParts}`,
    customerInfo: `${t.bomaBranch} — ${t.customerInfo}`,
    generateSales: `${t.bomaBranch} — ${t.generateSales}`,
    bulkSms: `${t.bomaBranch} — ${t.bulkSms}`,
    bulkSmsManagement: `${t.bomaBranch} — ${t.bulkSms}`,
    pageTitles: {
      dashboard: t.dashboard,
      spareParts: t.spareParts,
      customerInfo: t.customerInfo,
      generateSales: t.generateSales,
      transactions: t.transactions,
      loans: t.loans,
      expenses: t.expenses,
      sales: t.sales,
      reports: t.reports,
      bulkSms: t.bulkSms,
    },
    transactionReportsBanner: (period) =>
      `${t.bomaBranch} ${t.transactionReports} — ${period}`,
  };
}

/** Live labels that follow the selected language on each access. */
export const bomaLabels = new Proxy(
  {},
  {
    get(_target, prop) {
      const labels = getBomaLabels();
      const value = labels[prop];
      return typeof value === 'function' ? value.bind(labels) : value;
    },
  }
);

export function bomaUserName(user) {
  if (!user) return getBomaLabels().userFallback;
  return user.full_name || user.username || getBomaLabels().userFallback;
}
