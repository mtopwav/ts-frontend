const STORAGE_KEY = "unviewedOperations";

function readList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeList(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("unviewedOperationsChanged"));
}

function operationKey(id, type) {
  return `${type}_${id}`;
}

export function getUnviewedOperationsCount() {
  return readList().length;
}

export function markOperationAsViewed(id, type) {
  const key = operationKey(id, type);
  const next = readList().filter((item) => item !== key);
  writeList(next);
}

export function addUnviewedOperation(id, type) {
  const key = operationKey(id, type);
  const list = readList();
  if (!list.includes(key)) {
    writeList([...list, key]);
  }
}

export async function syncUnviewedFromPayments(payments = []) {
  const viewed = new Set(readList());
  let added = 0;

  payments.forEach((p) => {
    if (!p?.id || !p?.status) return;
    if (p.status === "Approved") {
      const key = operationKey(p.id, "payment_approved");
      if (!viewed.has(key)) {
        addUnviewedOperation(p.id, "payment_approved");
        added += 1;
      }
    } else if (p.status === "Rejected") {
      const key = operationKey(p.id, "payment_rejected");
      if (!viewed.has(key)) {
        addUnviewedOperation(p.id, "payment_rejected");
        added += 1;
      }
    }
  });

  return added;
}
