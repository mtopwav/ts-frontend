/**
 * Helpers so printed/downloaded HTML always embeds the logo as a data URL
 * (new print windows cannot reliably load webpack asset URLs before print()).
 */

export function resolveBundledAssetUrl(asset) {
  const path = typeof asset === 'string' ? asset : asset?.default ? asset.default : '';
  if (!path) return '';
  if (
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }
  if (typeof window === 'undefined') return path;
  return window.location.origin + (path.startsWith('/') ? path : '/' + path);
}

export function loadImageAsDataUrl(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve('');
      return;
    }
    if (String(src).startsWith('data:')) {
      resolve(src);
      return;
    }

    const viaCanvas = () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 1;
          canvas.height = img.naturalHeight || img.height || 1;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };

    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error('logo fetch failed');
        return r.blob();
      })
      .then(
        (blob) =>
          new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result || '');
            reader.onerror = () => rej(new Error('read failed'));
            reader.readAsDataURL(blob);
          })
      )
      .then((dataUrl) => resolve(dataUrl || src))
      .catch(() => viaCanvas());
  });
}

export async function ensureLogoDataUrl(asset, cachedDataUrl) {
  if (cachedDataUrl && String(cachedDataUrl).startsWith('data:')) {
    return cachedDataUrl;
  }
  const url = resolveBundledAssetUrl(asset);
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  return loadImageAsDataUrl(url);
}

export const PRINT_LOGO_CSS = `
  img, .tax-inv-logo {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  .tax-inv-logo {
    max-height: 60px;
    max-width: 140px;
    object-fit: contain;
    display: block;
  }
  @media print {
    .tax-inv-logo { max-height: 52px; }
  }
`;

/** Open a print window and wait for images (logo) before calling print(). */
export function openPrintWindowWithLogo(html, { onBlocked } = {}) {
  const w = window.open('', '_blank', 'width=1000,height=700');
  if (!w) {
    if (typeof onBlocked === 'function') onBlocked();
    return null;
  }

  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();

  const triggerPrint = () => {
    try {
      w.focus();
      w.print();
    } catch {
      /* ignore */
    }
  };

  const imgs = Array.from(w.document.images || []);
  if (imgs.length === 0) {
    setTimeout(triggerPrint, 50);
    return w;
  }

  let remaining = imgs.length;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    setTimeout(triggerPrint, 50);
  };
  const onOne = () => {
    remaining -= 1;
    if (remaining <= 0) finish();
  };

  imgs.forEach((img) => {
    if (img.complete && img.naturalWidth > 0) onOne();
    else {
      img.addEventListener('load', onOne, { once: true });
      img.addEventListener('error', onOne, { once: true });
    }
  });

  setTimeout(finish, 4000);
  return w;
}

export function logoImgHtml(logoSrc, className = 'tax-inv-logo') {
  if (!logoSrc) return '';
  return `<img src="${String(logoSrc).replace(/"/g, '&quot;')}" alt="Logo" class="${className}" />`;
}
