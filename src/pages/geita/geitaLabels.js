import { getTranslations, getCurrentLanguage } from '../../utils/translations';

/** Build Geita branch labels for the current (or given) UI language. */
export function getGeitaLabels(lang = getCurrentLanguage()) {
  const t = getTranslations(lang);
  return {
    branch: t.geitaBranch,
    sidebarTitle: t.geitaBranch,
    userFallback: t.geitaBranch,
    dashboard: `${t.geitaBranch} — ${t.dashboard}`,
    sales: `${t.geitaBranch} — ${t.sales}`,
    reports: `${t.geitaBranch} — ${t.reports}`,
    loans: `${t.geitaBranch} — ${t.loans}`,
    transactions: `${t.geitaBranch} — ${t.transactions}`,
    spareParts: `${t.geitaBranch} — ${t.spareParts}`,
    searchPlaceholder: `${t.search} ${t.geitaBranch}...`,
    transactionsReportDesc: `${t.geitaBranch} ${t.transactions} (${t.allPaymentMethods})`,
    transactionsReportTitle: `${t.geitaBranch.toUpperCase()} — ${t.transactions.toUpperCase()}`,
    salesReportDesc: `${t.geitaBranch} ${t.sales}`,
    salesReportTitle: `${t.geitaBranch.toUpperCase()} — ${t.sales.toUpperCase()}`,
    sparePartsInventoryReport: `${t.geitaBranch} — ${t.spareParts}`,
    customerInfo: `${t.geitaBranch} — ${t.customerInfo}`,
    generateSales: `${t.geitaBranch} — ${t.generateSales}`,
    bulkSms: `${t.geitaBranch} — ${t.bulkSms}`,
    bulkSmsManagement: `${t.geitaBranch} — ${t.bulkSms}`,
    pageTitles: {
      dashboard: t.dashboard,
      spareParts: t.spareParts,
      customerInfo: t.customerInfo,
      generateSales: t.generateSales,
      transactions: t.transactions,
      loans: t.loans,
      sales: t.sales,
      reports: t.reports,
      bulkSms: t.bulkSms,
    },
    transactionReportsBanner: (period) =>
      `${t.geitaBranch} ${t.transactionReports} — ${period}`,
  };
}

/** Live labels that follow the selected language on each access. */
export const geitaLabels = new Proxy(
  {},
  {
    get(_target, prop) {
      const labels = getGeitaLabels();
      const value = labels[prop];
      return typeof value === 'function' ? value.bind(labels) : value;
    },
  }
);

export function geitaUserName(user) {
  if (!user) return getGeitaLabels().userFallback;
  return user.full_name || user.username || getGeitaLabels().userFallback;
}
