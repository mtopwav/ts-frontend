import { formatDateTime } from "./dateTime";
import { getPrintCompanyHtml, getPrintTinHtml } from "./brand";

export const RECEIPT_PRINT_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; color: #222; font-size: 11px; line-height: 1.4; }
  .tax-inv-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #333; }
  .tax-inv-left { display: flex; align-items: flex-start; gap: 20px; flex: 1; }
  .tax-inv-logo { max-height: 60px; max-width: 140px; object-fit: contain; display: block; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  @media print { .tax-inv-logo { max-height: 52px; } }
  .tax-inv-company h2 { margin: 0 0 10px 0; font-size: 1.15rem; font-weight: 700; color: #111; }
  .tax-inv-address { margin: 0; color: #444; font-size: 10px; }
  .tax-inv-contact { margin-top: 8px; font-size: 10px; color: #555; }
  .tax-inv-contact span { margin-right: 16px; }
  .tax-inv-meta { text-align: right; min-width: 180px; }
  .tax-inv-meta p { margin: 0 0 6px 0; font-size: 11px; }
  .tax-inv-title { text-align: center; font-size: 1.6rem; font-weight: 700; margin: 24px 0; }
  .tax-inv-customer { margin-bottom: 18px; padding: 8px 0; }
  .tax-inv-table { width: 100%; border-collapse: collapse; margin: 0 0 20px 0; font-size: 10px; border: 1px solid #333; }
  .tax-inv-table th, .tax-inv-table td { border: 1px solid #333; padding: 6px 8px; }
  .tax-inv-table th { background: #f0f0f0; font-weight: 700; text-align: center; }
  .tax-inv-table .tr { text-align: right; }
  .tax-inv-disclaimer { margin-top: 28px; font-style: italic; color: #666; font-size: 10px; }
`;

function formatCurrency(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function escapeHtml(str) {
  return String(str ?? "—").replace(/</g, "&lt;");
}

export function buildReceiptBodyHtml(payment, logoSrc = "", address) {
  if (!payment) return "";

  const isReceipt = payment.status === "Approved";
  const invNum = `${isReceipt ? "RCPT" : "PAY"}-${payment.id}`;
  const logoImg = logoSrc
    ? `<img src="${String(logoSrc).replace(/"/g, "&quot;")}" alt="Logo" class="tax-inv-logo" />`
    : "";

  const items =
    payment.items && payment.items.length > 0
      ? payment.items
      : [
          {
            part_name: payment.sparepart_name,
            part_number: payment.sparepart_number,
            quantity: payment.quantity || 1,
            unit_price: payment.unit_price || 0
          }
        ];

  const itemRows = items
    .map((it, i) => {
      const qty = parseInt(it.quantity, 10) || 1;
      const rate = parseFloat(it.unit_price) || 0;
      const amount = rate * qty;
      return `<tr>
        <td class="tc">${i + 1}</td>
        <td>${escapeHtml(it.part_name || it.sparepart_name)}</td>
        <td>${escapeHtml(String(it.part_number || it.sparepart_number || "—").toUpperCase())}</td>
        <td class="tr">${qty}</td>
        <td class="tr">${formatCurrency(rate)}</td>
        <td class="tr">${formatCurrency(amount)}</td>
      </tr>`;
    })
    .join("");

  const total = items.reduce((sum, it) => {
    const qty = parseInt(it.quantity, 10) || 1;
    const rate = parseFloat(it.unit_price) || 0;
    return sum + qty * rate;
  }, 0);

  const discount = parseFloat(payment.discount_amount) || 0;
  const totalFinal = Math.max(0, total - discount);
  const received = Number(payment.amount_received) || 0;
  const remain = Math.max(0, totalFinal - received);

  return `
  <div class="tax-inv-top">
    <div class="tax-inv-left">
      ${logoImg}
      ${getPrintCompanyHtml("tax-inv-company", address)}
    </div>
    <div class="tax-inv-meta">
      ${getPrintTinHtml()}
      <p><strong>${isReceipt ? "Receipt" : "Invoice"} No:</strong> ${invNum}</p>
      <p><strong>Date:</strong> ${formatDateTime(payment.created_at)}</p>
    </div>
  </div>
  <h1 class="tax-inv-title">${isReceipt ? "RECEIPT" : "INVOICE"}</h1>
  <div class="tax-inv-customer">
    <strong>Customer:</strong> ${escapeHtml(String(payment.customer_name || "—").toUpperCase())}<br />
    <strong>Phone:</strong> ${escapeHtml(payment.customer_phone)}
  </div>
  <table class="tax-inv-table">
    <thead>
      <tr>
        <th>#</th><th>Description</th><th>Part No.</th><th>Qty</th><th>Price</th><th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr><td colspan="5" class="tr"><strong>Total</strong></td><td class="tr">${formatCurrency(totalFinal)}</td></tr>
      ${isReceipt ? `<tr><td colspan="5" class="tr"><strong>Received</strong></td><td class="tr">${formatCurrency(received)}</td></tr>` : ""}
      ${isReceipt ? `<tr><td colspan="5" class="tr"><strong>Remain</strong></td><td class="tr">${formatCurrency(remain)}</td></tr>` : ""}
    </tbody>
  </table>
  <p class="tax-inv-disclaimer">*Computer generated ${isReceipt ? "receipt" : "invoice"} — no signature required.*</p>`;
}
