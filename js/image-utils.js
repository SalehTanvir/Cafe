const DEFAULT_MENU_IMAGE = new URL("../assets/images/coffee.jpg", import.meta.url).href;

function sanitizeImageValue(value) {
  return String(value || "").trim().replace(/\\/g, "/");
}

export function getFallbackImageSrc() {
  return DEFAULT_MENU_IMAGE;
}

export function normalizeImageInput(value) {
  const normalized = sanitizeImageValue(value);

  if (!normalized) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(normalized) || /^(data|blob):/i.test(normalized)) {
    return normalized;
  }

  const assetsMatch = normalized.match(/(?:^|\/)(assets\/[^?#]+)/i);
  if (assetsMatch) {
    return assetsMatch[1];
  }

  if (/^[a-z]:\//i.test(normalized)) {
    const fileName = normalized.split("/").pop();
    return fileName ? `assets/images/${fileName}` : "";
  }

  if (/^\/+assets\//i.test(normalized)) {
    return normalized.replace(/^\/+/, "");
  }

  if (/^[^/]+\.(avif|gif|jpe?g|png|svg|webp)$/i.test(normalized)) {
    return `assets/images/${normalized}`;
  }

  return normalized;
}

export function resolveImageSrc(value) {
  const normalized = normalizeImageInput(value);

  if (!normalized) {
    return getFallbackImageSrc();
  }

  if (/^(https?:)?\/\//i.test(normalized) || /^(data|blob):/i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith("/")) {
    return new URL(normalized, window.location.origin).href;
  }

  return new URL(`../${normalized}`, import.meta.url).href;
}

export function attachImageFallback(img) {
  if (!img || img.dataset.imageFallbackBound === "true") {
    return;
  }

  img.dataset.imageFallbackBound = "true";
  img.addEventListener("error", () => {
    if (img.src !== DEFAULT_MENU_IMAGE) {
      img.src = DEFAULT_MENU_IMAGE;
    }
  });
}