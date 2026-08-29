/** Shared brand name — import instead of hardcoding across pages */
export const BRAND_NAME = "TS Auto Parts";
export const BRAND_SHORT = BRAND_NAME;
export const SYSTEM_NAME = `${BRAND_NAME} Management System`;
export const DEFAULT_SUPPLIER = BRAND_NAME;
export const BRAND_LOGO_ALT = `${BRAND_NAME} Logo`;

/** Address + phones for printed / downloaded documents */
export const BRAND_ADDRESS = "Kilimanjaro, Tanzania";
export const BRAND_ADDRESS_GEITA = "Geita, Tanzania";
export const BRAND_PHONE_1 = "+255 742075838";
export const BRAND_PHONE_2 = "+255 623795889";
/** TIN for receipts / invoices (matches admin sales) */
export const BRAND_TIN_NO = "137-965-569";

/**
 * Company header HTML for print/download documents
 * (matches admin sales receipt header).
 * @param {string} [wrapperClass='tax-inv-company']
 * @param {string} [address=BRAND_ADDRESS]
 */
export function getPrintCompanyHtml(wrapperClass = "tax-inv-company", address = BRAND_ADDRESS) {
  const safeAddress = String(address || BRAND_ADDRESS).replace(/</g, "&lt;");
  return `<div class="${wrapperClass}">
        <h2>${BRAND_NAME}</h2>
        <p class="tax-inv-address">${safeAddress}</p>
        <div class="tax-inv-contact">
          <span>Tel: ${BRAND_PHONE_1}</span> <br>
          <span>Tel: ${BRAND_PHONE_2}</span>
        </div>
      </div>`;
}

/** TIN line for receipts / invoices */
export function getPrintTinHtml() {
  return `<p><strong>TIN NO:</strong> ${String(BRAND_TIN_NO).replace(/</g, "&lt;")}</p>`;
}
