/**
 * HA MDI Off Fallback
 * v0.2.6
 */
(() => {
  "use strict";

  const VERSION = "0.2.6";
  const DEFAULT_STATES = Object.freeze({
    light: ["off"],
    switch: ["off"],
    fan: ["off"],
    climate: ["off"],
    media_player: ["off"],
    cover: ["closed"],
    humidifier: ["off"],
    water_heater: ["off"],
    siren: ["off"],
  });
  const DEFAULT_CONFIG_URL = "/local/ha-mdi-off-fallback.config.json";
  const processedRoots = new WeakSet();
  const patched = new WeakMap();
  const patchedBackgrounds = new WeakMap();

  let scanQueued = false;
  let maskSequence = 0;

  const normalizeStates = (source) => {
    const result = {};
    for (const [domain, states] of Object.entries(source ?? {})) {
      if (!Array.isArray(states)) continue;
      result[domain] = new Set(states.map((state) => String(state)));
    }
    return result;
  };

  const resolveStates = (candidate) =>
    candidate && typeof candidate === "object"
      ? normalizeStates(candidate)
      : normalizeStates(DEFAULT_STATES);

  const bootstrap = window.MDI_OFF_FALLBACK_CONFIG ?? {};
  const config = {
    states: resolveStates(bootstrap.states),
    debug: Boolean(bootstrap.debug),
    faintBackgroundWhenMissing:
      bootstrap.faint_background_when_missing !== false,
    faintBackgroundOpacity:
      Number.isFinite(Number(bootstrap.faint_background_opacity))
        ? Math.max(0, Math.min(1, Number(bootstrap.faint_background_opacity)))
        : 0.2,
    configUrl:
      typeof bootstrap.configUrl === "string"
        ? bootstrap.configUrl
        : DEFAULT_CONFIG_URL,
  };

  const log = (...args) => {
    if (config.debug) console.debug("[ha-mdi-off-fallback]", ...args);
  };

  const shouldFallback = (domain, state) =>
    config.states[domain]?.has(state) === true;

  const colorHasAlpha = (color) => {
    const value = String(color ?? "").trim().toLowerCase();
    if (!value || value === "transparent") return false;
    const rgba = value.match(
      /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*([\d.]+))?\s*\)$/
    );
    if (!rgba) return true;
    return (rgba[1] == null ? 1 : Number(rgba[1])) > 0.001;
  };

  const hasVisibleBackground = (element) => {
    const style = getComputedStyle(element);
    if (style.backgroundImage && style.backgroundImage !== "none") return true;
    if (colorHasAlpha(style.backgroundColor)) return true;

    for (const pseudo of ["::before", "::after"]) {
      const p = getComputedStyle(element, pseudo);
      const content = p.content;
      if (!content || content === "none" || content === "normal") continue;
      if (Number(p.opacity || 1) <= 0.001) continue;
      if (
        colorHasAlpha(p.backgroundColor) ||
        (p.backgroundImage && p.backgroundImage !== "none")
      ) {
        return true;
      }
    }
    return false;
  };

  const restoreFaintBackground = (tileIcon) => {
    const patch = patchedBackgrounds.get(tileIcon);
    if (!patch) return;
    patch.overlay.remove();
    if (patch.originalPosition === "") {
      patch.container.style.removeProperty("position");
    } else {
      patch.container.style.position = patch.originalPosition;
    }
    patchedBackgrounds.delete(tileIcon);
  };

  const applyFaintBackground = (tileIcon) => {
    if (!config.faintBackgroundWhenMissing) {
      restoreFaintBackground(tileIcon);
      return;
    }

    const container = tileIcon.shadowRoot?.querySelector(".container");
    if (!container) return;

    const existingPatch = patchedBackgrounds.get(tileIcon);
    if (existingPatch?.container === container) return;

    if (hasVisibleBackground(container)) {
      restoreFaintBackground(tileIcon);
      return;
    }

    const originalPosition = container.style.position;
    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    const overlay = document.createElement("span");
    overlay.setAttribute("aria-hidden", "true");
    overlay.setAttribute("data-mdi-off-fallback-background", VERSION);
    Object.assign(overlay.style, {
      position: "absolute",
      inset: "0",
      borderRadius: "9999px",
      background: "rgb(189, 189, 189)",
      opacity: String(config.faintBackgroundOpacity),
      pointerEvents: "none",
      zIndex: "0",
    });

    const slot = container.querySelector('slot[name="icon"], slot');
    if (slot) {
      slot.style.position = "relative";
      slot.style.zIndex = "1";
    }

    container.prepend(overlay);
    patchedBackgrounds.set(tileIcon, {
      container,
      overlay,
      originalPosition,
    });
  };

  const restoreIcon = (tileIcon) => {
    const patch = patched.get(tileIcon);
    if (!patch) return;
    patch.clone.remove();
    patch.originalSvg.style.display = patch.originalDisplay;
    patched.delete(tileIcon);
  };

  const getIconDetails = (tileIcon) => {
    const stateIcon =
      tileIcon.querySelector("ha-state-icon") ??
      tileIcon.shadowRoot?.querySelector("ha-state-icon");
    const haIcon = stateIcon?.shadowRoot?.querySelector("ha-icon");
    const svgIcon = haIcon?.shadowRoot?.querySelector("ha-svg-icon");
    const svgRoot = svgIcon?.shadowRoot;
    const svg = svgRoot?.querySelector("svg");
    const path = svg?.querySelector("path");
    return { svgRoot, svg, path };
  };

  const appearsAlreadyCrossed = (pathData) => {
    const normalized = String(pathData ?? "").replace(/\s+/g, " ");
    return (
      normalized.includes("1.11 3") &&
      normalized.includes("22.11 21.46")
    );
  };

  const applyIconFallback = (tileIcon) => {
    const { svgRoot, svg, path } = getIconDetails(tileIcon);
    if (!svgRoot || !svg || !path) return false;
    if (svg.getAttribute("viewBox") !== "0 0 24 24") return false;

    const iconName =
      tileIcon.querySelector("ha-state-icon")?.getAttribute("icon") ??
      tileIcon.getAttribute("icon") ??
      "";
    const pathData = path.getAttribute("d") ?? "";

    if (/(?:^|-)off(?:$|-)/i.test(iconName) || appearsAlreadyCrossed(pathData)) {
      restoreIcon(tileIcon);
      return false;
    }

    const existing = patched.get(tileIcon);
    if (existing?.originalSvg === svg && existing?.pathData === pathData) {
      return true;
    }
    restoreIcon(tileIcon);

    const NS = "http://www.w3.org/2000/svg";
    const maskId = `mdi-off-fallback-mask-${++maskSequence}`;
    const clone = document.createElementNS(NS, "svg");
    clone.setAttribute("viewBox", "0 0 24 24");
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute("data-mdi-off-fallback", VERSION);
    Object.assign(clone.style, {
      width: "100%",
      height: "100%",
      display: "block",
      position: "absolute",
      inset: "0",
      fill: "currentColor",
      color: "inherit",
      pointerEvents: "none",
    });

    const defs = document.createElementNS(NS, "defs");
    const mask = document.createElementNS(NS, "mask");
    mask.setAttribute("id", maskId);
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    mask.setAttribute("x", "0");
    mask.setAttribute("y", "0");
    mask.setAttribute("width", "24");
    mask.setAttribute("height", "24");

    const white = document.createElementNS(NS, "rect");
    white.setAttribute("width", "24");
    white.setAttribute("height", "24");
    white.setAttribute("fill", "white");

    const cut = document.createElementNS(NS, "path");
    cut.setAttribute("d", "M1.5 2.3 L22.4 22.1");
    cut.setAttribute("fill", "none");
    cut.setAttribute("stroke", "black");
    cut.setAttribute("stroke-width", "3.1");
    cut.setAttribute("stroke-linecap", "square");

    mask.append(white, cut);
    defs.append(mask);

    const body = document.createElementNS(NS, "path");
    body.setAttribute("d", pathData);
    body.setAttribute("mask", `url(#${maskId})`);

    const slash = document.createElementNS(NS, "path");
    slash.setAttribute(
      "d",
      "M1.11 3 L2.39 1.73 L22.11 21.46 L20.84 22.73 Z"
    );

    clone.append(defs, body, slash);

    const originalDisplay = svg.style.display;
    svg.style.display = "none";
    const hostStyle = getComputedStyle(svgRoot.host);
    if (hostStyle.position === "static") svgRoot.host.style.position = "relative";
    svgRoot.append(clone);

    patched.set(tileIcon, {
      clone,
      originalSvg: svg,
      originalDisplay,
      pathData,
    });
    return true;
  };

  const processTileIcon = (tileIcon) => {
    const domain = tileIcon.getAttribute("data-domain");
    const state = tileIcon.getAttribute("data-state");
    if (!domain || !state || !shouldFallback(domain, state)) {
      restoreIcon(tileIcon);
      restoreFaintBackground(tileIcon);
      return;
    }

    if (applyIconFallback(tileIcon)) {
      applyFaintBackground(tileIcon);
    } else {
      restoreFaintBackground(tileIcon);
    }
  };

  const scanRoot = (root) => {
    if (!root?.querySelectorAll) return;
    if (root instanceof ShadowRoot && !processedRoots.has(root)) {
      processedRoots.add(root);
      observeRoot(root);
    }

    if (root.matches?.("ha-tile-icon")) processTileIcon(root);
    for (const element of root.querySelectorAll("*")) {
      if (element.localName === "ha-tile-icon") processTileIcon(element);
      if (element.shadowRoot) scanRoot(element.shadowRoot);
    }
  };

  const queueScan = () => {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(() => {
      scanQueued = false;
      scanRoot(document);
    });
  };

  const observeRoot = (root) => {
    if (processedRoots.has(root)) return;
    processedRoots.add(root);
    const observer = new MutationObserver(queueScan);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state", "data-domain", "icon"],
    });
    scanRoot(root);
  };

  const serializeStates = () =>
    Object.fromEntries(
      Object.entries(config.states).map(([domain, states]) => [domain, [...states]])
    );

  const configure = (next = {}) => {
    if (next.states && typeof next.states === "object") {
      config.states = normalizeStates(next.states);
    }
    if ("debug" in next) config.debug = Boolean(next.debug);
    if ("faint_background_when_missing" in next) {
      config.faintBackgroundWhenMissing =
        Boolean(next.faint_background_when_missing);
    }
    if ("faint_background_opacity" in next) {
      const opacity = Number(next.faint_background_opacity);
      if (Number.isFinite(opacity)) {
        config.faintBackgroundOpacity = Math.max(0, Math.min(1, opacity));
      }
    }
    if (typeof next.configUrl === "string") config.configUrl = next.configUrl;
    queueScan();
    return {
      states: serializeStates(),
      debug: config.debug,
      faint_background_when_missing: config.faintBackgroundWhenMissing,
      faint_background_opacity: config.faintBackgroundOpacity,
      configUrl: config.configUrl,
    };
  };

  const loadServerConfig = async () => {
    try {
      const response = await fetch(config.configUrl, { cache: "no-store" });
      if (response.status === 404) {
        log("config file not found; using defaults", config.configUrl);
        return false;
      }
      if (!response.ok) {
        console.warn(
          `[ha-mdi-off-fallback] config load failed: HTTP ${response.status}`
        );
        return false;
      }

      const serverConfig = await response.json();
      if (serverConfig.states && typeof serverConfig.states === "object") {
        config.states = normalizeStates(serverConfig.states);
      }
      if ("debug" in serverConfig) config.debug = Boolean(serverConfig.debug);
      if ("faint_background_when_missing" in serverConfig) {
        config.faintBackgroundWhenMissing =
          Boolean(serverConfig.faint_background_when_missing);
      }
      if ("faint_background_opacity" in serverConfig) {
        const opacity = Number(serverConfig.faint_background_opacity);
        if (Number.isFinite(opacity)) {
          config.faintBackgroundOpacity = Math.max(0, Math.min(1, opacity));
        }
      }

      log("server config loaded", {
        url: config.configUrl,
        states: serializeStates(),
      });
      queueScan();
      return true;
    } catch (error) {
      console.warn(
        "[ha-mdi-off-fallback] invalid/unreadable config; using current settings",
        error
      );
      return false;
    }
  };

  window.haMdiOffFallback = {
    version: VERSION,
    configure,
    getConfig: () => ({
      states: serializeStates(),
      debug: config.debug,
      faint_background_when_missing: config.faintBackgroundWhenMissing,
      faint_background_opacity: config.faintBackgroundOpacity,
      configUrl: config.configUrl,
    }),
    rescan: queueScan,
    reloadConfig: loadServerConfig,
  };

  observeRoot(document);
  loadServerConfig().finally(queueScan);

  console.info(
    `%c HA MDI Off Fallback %c ${VERSION} `,
    "background:#41bdf5;color:#fff;font-weight:700;padding:2px 6px;border-radius:3px 0 0 3px",
    "background:#1f2937;color:#fff;font-weight:700;padding:2px 6px;border-radius:0 3px 3px 0"
  );
})();
