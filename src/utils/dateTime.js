function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDatePart(date, pattern) {
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MMM = months[date.getMonth()];

  switch (pattern) {
    case "DD/MM/YYYY":
      return `${d}/${m}/${y}`;
    case "MM/DD/YYYY":
      return `${m}/${d}/${y}`;
    case "YYYY-MM-DD":
      return `${y}-${m}-${d}`;
    case "DD-MMM-YYYY":
      return `${d}-${MMM}-${y}`;
    default:
      return `${d}/${m}/${y}`;
  }
}

function formatTimePart(date, pattern) {
  const h24 = date.getHours();
  const min = pad(date.getMinutes());
  const sec = pad(date.getSeconds());

  if (pattern === "12h") {
    const ampm = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 || 12;
    return `${pad(h12)}:${min}:${sec} ${ampm}`;
  }
  return `${pad(h24)}:${min}:${sec}`;
}

function parseInput(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getCurrentDateTime() {
  const now = new Date();
  const dateFormat = localStorage.getItem("systemDateFormat") || "DD/MM/YYYY";
  const timeFormat = localStorage.getItem("systemTimeFormat") || "24h";
  return `${formatDatePart(now, dateFormat)} ${formatTimePart(now, timeFormat)}`;
}

export function formatDateTime(value) {
  const date = parseInput(value);
  if (!date) return "";
  const dateFormat = localStorage.getItem("systemDateFormat") || "DD/MM/YYYY";
  const timeFormat = localStorage.getItem("systemTimeFormat") || "24h";
  return `${formatDatePart(date, dateFormat)} ${formatTimePart(date, timeFormat)}`;
}

export function formatDate(value) {
  const date = parseInput(value);
  if (!date) return "";
  const dateFormat = localStorage.getItem("systemDateFormat") || "DD/MM/YYYY";
  return formatDatePart(date, dateFormat);
}
