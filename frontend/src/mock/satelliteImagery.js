// satelliteImagery.js
// Genuine Remote-Sensing Synthetic Visualization Engine for SatQuery AI.
// Combines authentic top-down Earth Observation satellite imagery (800x500 JPGs)
// with professional remote-sensing AI overlays:
// - Optical vs. SAR Radar Backscatter
// - NDVI False-Color Biophysical Products
// - Bi-Temporal T1 / T2 Comparative Splits
// - Subtle Vector Delineations & Bounding Boxes

function encodeSvg(svgString) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    svgString.replace(/\n\s*/g, " ")
  )}`;
}

// ----------------------------------------------------------------------
// 1. WATER BODY EXTRACTION & OPTICAL + SAR (Godavari Basin, Maharashtra)
// ----------------------------------------------------------------------
export function getGodavariImagery({ mode = "optical" } = {}) {
  // mode: 'optical' | 'mask' | 'sar'
  const isSar = mode === "sar";
  const showMask = mode === "mask";

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <defs>
      <!-- SAR Radar Microwave Backscatter Filter -->
      <filter id="sarBackscatter" x="0" y="0" width="100%" height="100%">
        <feColorMatrix type="matrix" values="
          0.33 0.33 0.33 0 0
          0.33 0.33 0.33 0 0
          0.33 0.33 0.33 0 0
          0 0 0 1 0" />
        <feComponentTransfer>
          <feFuncR type="linear" slope="1.4" intercept="-0.15"/>
          <feFuncG type="linear" slope="1.4" intercept="-0.15"/>
          <feFuncB type="linear" slope="1.4" intercept="-0.15"/>
        </feComponentTransfer>
      </filter>
    </defs>

    <!-- Base Photographic Satellite Image -->
    <image href="/satellite/godavari_optical.jpg" width="800" height="500" preserveAspectRatio="xMidYMid slice" ${
      isSar ? 'filter="url(#sarBackscatter)"' : ""
    } />

    ${
      showMask
        ? `
      <!-- AI Water Detection Segmentation Mask (Cyan) -->
      <path d="M 220 70 C 310 110, 420 180, 490 280 C 530 340, 580 390, 660 410 C 720 420, 760 380, 800 390 L 800 500 L 320 500 C 270 460, 210 400, 180 320 C 150 240, 160 140, 220 70 Z" fill="#06b6d4" fill-opacity="0.5" stroke="#22d3ee" stroke-width="2.5" stroke-dasharray="6,3" />
      <g transform="translate(420, 240)">
        <rect width="180" height="32" rx="4" fill="#082f49" fill-opacity="0.9" stroke="#06b6d4" stroke-width="1.2" />
        <text x="90" y="15" fill="#67e8f9" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">WATER MASK (54.8 km²)</text>
        <text x="90" y="26" fill="#ffffff" font-size="8" font-family="sans-serif" text-anchor="middle">Confidence: 88% • 6 Basins</text>
      </g>
    `
        : ""
    }

    <!-- Sensor HUD Watermark -->
    <rect x="14" y="14" width="260" height="38" rx="4" fill="#0b1120" fill-opacity="0.85" stroke="${
      isSar ? "#64748b" : "#0284c7"
    }" stroke-width="1" />
    <text x="24" y="29" fill="#f8fafc" font-size="10" font-family="monospace" font-weight="bold">${
      isSar ? "SENTINEL-1 C-SAR • VV/VH RADAR" : "CARTOSAT-3 OPTICAL • 5.0m GSD"
    }</text>
    <text x="24" y="44" fill="${isSar ? "#94a3b8" : "#38bdf8"}" font-size="8" font-family="monospace">COORD: 19°51'00\"N 79°07'12\"E • GODAVARI</text>
  </svg>
  `;
  return encodeSvg(svg);
}

// ----------------------------------------------------------------------
// 2. FLOOD RISK ASSESSMENT (Brahmaputra Basin, Assam)
// ----------------------------------------------------------------------
export function getBrahmaputraImagery({ showFlood = false } = {}) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <image href="/satellite/brahmaputra_flood.jpg" width="800" height="500" preserveAspectRatio="xMidYMid slice" />

    ${
      showFlood
        ? `
      <!-- Flood Inundation Hazard Vector Mask -->
      <path d="M 80 180 C 220 140, 420 180, 580 220 C 690 250, 750 210, 800 230 L 800 450 C 680 480, 480 440, 320 460 C 180 480, 60 410, 0 380 L 0 220 Z" fill="#e11d48" fill-opacity="0.4" stroke="#f43f5e" stroke-width="2.5" stroke-dasharray="6,4" />
      <g transform="translate(480, 80)">
        <rect width="190" height="34" rx="4" fill="#4c0519" fill-opacity="0.9" stroke="#f43f5e" stroke-width="1.2" />
        <text x="95" y="16" fill="#fda4af" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">FLOOD INUNDATION EXTENT</text>
        <text x="95" y="28" fill="#ffffff" font-size="8" font-family="sans-serif" text-anchor="middle">142.6 km² Lowland Inundated</text>
      </g>
    `
        : ""
    }

    <!-- Sensor HUD Watermark -->
    <rect x="14" y="14" width="250" height="38" rx="4" fill="#0b1120" fill-opacity="0.85" stroke="#e11d48" stroke-width="1" />
    <text x="24" y="29" fill="#f8fafc" font-size="10" font-family="monospace" font-weight="bold">SENTINEL-2 MSI • BRAHMAPUTRA</text>
    <text x="24" y="44" fill="#fb7185" font-size="8" font-family="monospace">${
      showFlood ? "MONSOON CREST INUNDATION (T2)" : "PRE-FLOOD RIVER BASELINE (T1)"
    }</text>
  </svg>
  `;
  return encodeSvg(svg);
}

// ----------------------------------------------------------------------
// 3. VEGETATION HEALTH / NDVI (Punjab Agricultural Belt)
// ----------------------------------------------------------------------
export function getPunjabNdviImagery({ isNdvi = false } = {}) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <defs>
      <!-- NDVI False-Color Biophysical Filter -->
      <filter id="ndviFalseColor">
        <feColorMatrix type="matrix" values="
          0.1 0.7 0.2 0 0
          0.8 0.5 0.1 0 0
          0.1 0.2 0.8 0 0
          0 0 0 1 0" />
      </filter>
      <linearGradient id="ndviScale" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ef4444" />
        <stop offset="30%" stop-color="#f59e0b" />
        <stop offset="60%" stop-color="#84cc16" />
        <stop offset="100%" stop-color="#15803d" />
      </linearGradient>
    </defs>

    <image href="/satellite/punjab_agriculture.jpg" width="800" height="500" preserveAspectRatio="xMidYMid slice" ${
      isNdvi ? 'filter="url(#ndviFalseColor)"' : ""
    } />

    ${
      isNdvi
        ? `
      <!-- NDVI Spectral Color Legend Bar -->
      <g transform="translate(560, 420)">
        <rect width="220" height="65" rx="6" fill="#0b1120" fill-opacity="0.92" stroke="#22c55e" stroke-width="1" />
        <text x="15" y="18" fill="#f8fafc" font-size="9" font-family="monospace" font-weight="bold">NDVI VEGETATION VIGOR</text>
        <rect x="15" y="26" width="190" height="12" rx="2" fill="url(#ndviScale)" stroke="#475569" stroke-width="0.5" />
        <text x="15" y="50" fill="#f87171" font-size="8" font-family="monospace">0.1 (Stress)</text>
        <text x="105" y="50" fill="#cbd5e1" font-size="8" font-family="monospace" text-anchor="middle">0.5</text>
        <text x="205" y="50" fill="#4ade80" font-size="8" font-family="monospace" text-anchor="end">0.9 (Healthy)</text>
      </g>
    `
        : ""
    }

    <!-- Sensor HUD Watermark -->
    <rect x="14" y="14" width="240" height="38" rx="4" fill="#0b1120" fill-opacity="0.85" stroke="#10b981" stroke-width="1" />
    <text x="24" y="29" fill="#f8fafc" font-size="10" font-family="monospace" font-weight="bold">${
      isNdvi ? "NDVI FALSE-COLOR SPECTRAL MAP" : "LANDSAT-9 OLI-2 • 10m GSD"
    }</text>
    <text x="24" y="44" fill="#34d399" font-size="8" font-family="monospace">PUNJAB AGRICULTURAL BELT</text>
  </svg>
  `;
  return encodeSvg(svg);
}

// ----------------------------------------------------------------------
// 4. LAND COVER CHANGE & BI-TEMPORAL SPLIT (Kerala Coastal Wetlands)
// ----------------------------------------------------------------------
export function getKeralaLulcImagery({ isT2 = false, showChange = false } = {}) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <image href="/satellite/kerala_wetlands.jpg" width="800" height="500" preserveAspectRatio="xMidYMid slice" />

    ${
      showChange
        ? `
      <!-- Detected Transition Polygons (Amber) -->
      <rect x="340" y="210" width="110" height="85" fill="#f59e0b" fill-opacity="0.4" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="5,3" />
      <rect x="520" y="280" width="90" height="70" fill="#f59e0b" fill-opacity="0.4" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="5,3" />

      <g transform="translate(480, 420)">
        <rect width="250" height="42" rx="4" fill="#451a03" fill-opacity="0.9" stroke="#f59e0b" stroke-width="1.2" />
        <text x="125" y="18" fill="#fcd34d" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">BI-TEMPORAL CHANGE MAP</text>
        <text x="125" y="32" fill="#ffffff" font-size="8" font-family="sans-serif" text-anchor="middle">14.2 ha Wetland → Built-up Transition</text>
      </g>
    `
        : ""
    }

    <!-- Sensor HUD Watermark -->
    <rect x="14" y="14" width="240" height="38" rx="4" fill="#0b1120" fill-opacity="0.85" stroke="#f59e0b" stroke-width="1" />
    <text x="24" y="29" fill="#f8fafc" font-size="10" font-family="monospace" font-weight="bold">SENTINEL-2 MSI • KERALA</text>
    <text x="24" y="44" fill="#fbbf24" font-size="8" font-family="monospace">${
      isT2 ? "ACQUISITION: T2 (MAY 2025)" : "ACQUISITION: T1 (MAY 2024)"
    }</text>
  </svg>
  `;
  return encodeSvg(svg);
}

// ----------------------------------------------------------------------
// 5. CYCLONE IMPACT ASSESSMENT (Odisha Coast)
// ----------------------------------------------------------------------
export function getOdishaCycloneImagery({ showImpact = false } = {}) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <image href="/satellite/odisha_coast.jpg" width="800" height="500" preserveAspectRatio="xMidYMid slice" />

    ${
      showImpact
        ? `
      <!-- Coastal Storm Surge Inundation Swathe -->
      <path d="M 280 0 C 270 140, 360 280, 340 420 C 320 480, 270 500, 250 500 L 330 500 C 370 500, 440 420, 420 280 C 410 140, 380 0, 380 0 Z" fill="#e11d48" fill-opacity="0.45" stroke="#f43f5e" stroke-width="2.5" />
      <circle cx="370" cy="240" r="8" fill="#dc2626" stroke="#ffffff" stroke-width="2" />
      <circle cx="340" cy="380" r="8" fill="#dc2626" stroke="#ffffff" stroke-width="2" />

      <g transform="translate(480, 420)">
        <rect width="250" height="42" rx="4" fill="#4c0519" fill-opacity="0.9" stroke="#f43f5e" stroke-width="1.2" />
        <text x="125" y="18" fill="#fda4af" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">SURGE INUNDATION IMPACT</text>
        <text x="125" y="32" fill="#ffffff" font-size="8" font-family="sans-serif" text-anchor="middle">62.4 km² Coastal Swathe • 2 Breaches</text>
      </g>
    `
        : ""
    }

    <!-- Sensor HUD Watermark -->
    <rect x="14" y="14" width="240" height="38" rx="4" fill="#0b1120" fill-opacity="0.85" stroke="#ef4444" stroke-width="1" />
    <text x="24" y="29" fill="#f8fafc" font-size="10" font-family="monospace" font-weight="bold">RISAT-1A SAR • 3m RADAR</text>
    <text x="24" y="44" fill="#f87171" font-size="8" font-family="monospace">ODISHA COASTLINE / BAY OF BENGAL</text>
  </svg>
  `;
  return encodeSvg(svg);
}

// ----------------------------------------------------------------------
// 6. INFRASTRUCTURE RISK ANALYSIS (Gujarat Industrial Port)
// ----------------------------------------------------------------------
export function getGujaratPortImagery({ showInSar = false } = {}) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <image href="/satellite/gujarat_port.jpg" width="800" height="500" preserveAspectRatio="xMidYMid slice" />

    ${
      showInSar
        ? `
      <!-- InSAR Persistent Scatterer Points -->
      <circle cx="480" cy="240" r="8" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
      <circle cx="505" cy="250" r="8" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
      <rect x="460" y="215" width="180" height="22" rx="3" fill="#0b1120" fill-opacity="0.85" />
      <text x="470" y="230" fill="#fde047" font-size="8" font-family="monospace" font-weight="bold">Wharf #4 Subsidence (-2.3mm/yr)</text>

      <circle cx="280" cy="180" r="6" fill="#22c55e" />
      <circle cx="310" cy="195" r="6" fill="#22c55e" />
      <circle cx="340" cy="210" r="6" fill="#22c55e" />
    `
        : ""
    }

    <!-- Sensor HUD Watermark -->
    <rect x="14" y="14" width="250" height="38" rx="4" fill="#0b1120" fill-opacity="0.85" stroke="#f59e0b" stroke-width="1" />
    <text x="24" y="29" fill="#f8fafc" font-size="10" font-family="monospace" font-weight="bold">CARTOSAT-3 PAN + SENTINEL-1</text>
    <text x="24" y="44" fill="#fbbf24" font-size="8" font-family="monospace">GUJARAT PORT CORRIDOR • 0.28m GSD</text>
  </svg>
  `;
  return encodeSvg(svg);
}

// ----------------------------------------------------------------------
// 7. URBAN GROWTH MONITORING (Bengaluru, Karnataka)
// ----------------------------------------------------------------------
export function getBengaluruUrbanImagery({ showExpansion = false } = {}) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <image href="/satellite/bengaluru_urban.jpg" width="800" height="500" preserveAspectRatio="xMidYMid slice" />

    ${
      showExpansion
        ? `
      <!-- Detected New Built-up Polygons (Purple Highlight) -->
      <rect x="440" y="160" width="140" height="95" fill="#c084fc" fill-opacity="0.45" stroke="#a855f7" stroke-width="2.5" />
      <rect x="220" y="280" width="110" height="85" fill="#c084fc" fill-opacity="0.45" stroke="#a855f7" stroke-width="2.5" />

      <g transform="translate(480, 420)">
        <rect width="250" height="42" rx="4" fill="#3b0764" fill-opacity="0.9" stroke="#a855f7" stroke-width="1.2" />
        <text x="125" y="18" fill="#e9d5ff" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">URBAN EXPANSION MASK</text>
        <text x="125" y="32" fill="#ffffff" font-size="8" font-family="sans-serif" text-anchor="middle">+18.5% Impervious Surface Growth</text>
      </g>
    `
        : ""
    }

    <!-- Sensor HUD Watermark -->
    <rect x="14" y="14" width="240" height="38" rx="4" fill="#0b1120" fill-opacity="0.85" stroke="#a855f7" stroke-width="1" />
    <text x="24" y="29" fill="#f8fafc" font-size="10" font-family="monospace" font-weight="bold">CARTOSAT-3 0.5m • BENGALURU</text>
    <text x="24" y="44" fill="#c084fc" font-size="8" font-family="monospace">OUTER RING ROAD CORRIDOR</text>
  </svg>
  `;
  return encodeSvg(svg);
}

// ----------------------------------------------------------------------
// 8. COASTAL EROSION ANALYSIS (Tamil Nadu)
// ----------------------------------------------------------------------
export function getTamilNaduCoastImagery({ showErosion = false } = {}) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <image href="/satellite/tamilnadu_coast.jpg" width="800" height="500" preserveAspectRatio="xMidYMid slice" />

    ${
      showErosion
        ? `
      <!-- DSAS Shoreline Retreat Transects & Erosion Area -->
      <path d="M 460 0 Q 440 250 490 500" stroke="#06b6d4" stroke-width="3" stroke-dasharray="6,3" fill="none" />
      <path d="M 420 0 Q 400 250 450 500" stroke="#ef4444" stroke-width="3.5" fill="none" />
      <path d="M 460 0 Q 440 250 490 500 L 450 500 Q 400 250 420 0 Z" fill="#dc2626" fill-opacity="0.45" />

      <g transform="translate(480, 240)">
        <rect width="240" height="42" rx="4" fill="#450a0a" fill-opacity="0.9" stroke="#ef4444" stroke-width="1.2" />
        <text x="120" y="18" fill="#fca5a5" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">DSAS SHORELINE RETREAT</text>
        <text x="120" y="32" fill="#ffffff" font-size="8" font-family="sans-serif" text-anchor="middle">Mean Erosion: -2.3 m/year</text>
      </g>
    `
        : ""
    }

    <!-- Sensor HUD Watermark -->
    <rect x="14" y="14" width="240" height="38" rx="4" fill="#0b1120" fill-opacity="0.85" stroke="#0284c7" stroke-width="1" />
    <text x="24" y="29" fill="#f8fafc" font-size="10" font-family="monospace" font-weight="bold">CARTOSAT-2 + SENTINEL-2</text>
    <text x="24" y="44" fill="#38bdf8" font-size="8" font-family="monospace">TAMIL NADU SHORELINE • 1.6m GSD</text>
  </svg>
  `;
  return encodeSvg(svg);
}

// ----------------------------------------------------------------------
// 9. SINGLE-IMAGE VQA (IGI Airport, New Delhi)
// ----------------------------------------------------------------------
export function getDelhiAirportImagery({ showVqa = false } = {}) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <image href="/satellite/delhi_airport.jpg" width="800" height="500" preserveAspectRatio="xMidYMid slice" />

    ${
      showVqa
        ? `
      <!-- VQA Grounding Boxes on Terminal 3 Aprons & Runway 29R -->
      <rect x="360" y="140" width="60" height="45" fill="none" stroke="#a855f7" stroke-width="2" stroke-dasharray="4,2" />
      <rect x="430" y="150" width="60" height="45" fill="none" stroke="#a855f7" stroke-width="2" stroke-dasharray="4,2" />
      <rect x="500" y="160" width="60" height="45" fill="none" stroke="#a855f7" stroke-width="2" stroke-dasharray="4,2" />

      <!-- Runway 29R Verification -->
      <line x1="120" y1="280" x2="680" y2="280" stroke="#22c55e" stroke-width="2" />

      <g transform="translate(460, 420)">
        <rect width="280" height="50" rx="4" fill="#3b0764" fill-opacity="0.9" stroke="#a855f7" stroke-width="1.2" />
        <text x="14" y="18" fill="#e9d5ff" font-size="9" font-family="monospace" font-weight="bold">VQA QUERY VERIFIED</text>
        <text x="14" y="36" fill="#ffffff" font-size="8" font-family="sans-serif">"42 Aircraft Counted • Runway 29R Clear"</text>
      </g>
    `
        : ""
    }

    <!-- Sensor HUD Watermark -->
    <rect x="14" y="14" width="240" height="38" rx="4" fill="#0b1120" fill-opacity="0.85" stroke="#a855f7" stroke-width="1" />
    <text x="24" y="29" fill="#f8fafc" font-size="10" font-family="monospace" font-weight="bold">CARTOSAT-3 PAN • 0.28m SUB-METER</text>
    <text x="24" y="44" fill="#c084fc" font-size="8" font-family="monospace">IGI AIRPORT NEW DELHI (DEL/VIDP)</text>
  </svg>
  `;
  return encodeSvg(svg);
}

// ----------------------------------------------------------------------
// 10. IMAGE CAPTIONING / SCENE DESCRIPTION (Sundarbans Delta)
// ----------------------------------------------------------------------
export function getSundarbansImagery({ showCaption = false } = {}) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <image href="/satellite/sundarbans_delta.jpg" width="800" height="500" preserveAspectRatio="xMidYMid slice" />

    ${
      showCaption
        ? `
      <g transform="translate(360, 410)">
        <rect width="400" height="60" rx="4" fill="#022c22" fill-opacity="0.9" stroke="#10b981" stroke-width="1.2" />
        <text x="15" y="18" fill="#6ee7b7" font-size="9" font-family="monospace" font-weight="bold">AI SCENE DESCRIPTION</text>
        <text x="15" y="34" fill="#ffffff" font-size="8" font-family="sans-serif">"An intricate network of tidal waterways surrounds</text>
        <text x="15" y="48" fill="#ffffff" font-size="8" font-family="sans-serif">densely vegetated mangrove islands with active mudflats."</text>
      </g>
    `
        : ""
    }

    <!-- Sensor HUD Watermark -->
    <rect x="14" y="14" width="240" height="38" rx="4" fill="#0b1120" fill-opacity="0.85" stroke="#10b981" stroke-width="1" />
    <text x="24" y="29" fill="#f8fafc" font-size="10" font-family="monospace" font-weight="bold">SENTINEL-2 MSI • SUNDARBANS</text>
    <text x="24" y="44" fill="#34d399" font-size="8" font-family="monospace">MANGROVE TIDAL DELTA • 10m GSD</text>
  </svg>
  `;
  return encodeSvg(svg);
}

// ----------------------------------------------------------------------
// 11. REGION GROUNDING (Jamnagar Petrochemical Complex, Gujarat)
// ----------------------------------------------------------------------
export function getJamnagarImagery({ showGrounding = false } = {}) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <image href="/satellite/jamnagar_refinery.jpg" width="800" height="500" preserveAspectRatio="xMidYMid slice" />

    ${
      showGrounding
        ? `
      <!-- Text-Guided Bounding Box Around Storage Tanks -->
      <rect x="260" y="150" width="260" height="210" fill="none" stroke="#d946ef" stroke-width="3" filter="drop-shadow(0 0 6px #d946ef)" />
      <g transform="translate(260, 115)">
        <rect width="260" height="28" rx="4" fill="#701a75" fill-opacity="0.9" stroke="#d946ef" stroke-width="1.2" />
        <text x="10" y="18" fill="#f5d0fe" font-size="9" font-family="monospace" font-weight="bold">[GROUNDED: SECTOR 7 CRUDE TANKS]</text>
      </g>
    `
        : ""
    }

    <!-- Sensor HUD Watermark -->
    <rect x="14" y="14" width="260" height="38" rx="4" fill="#0b1120" fill-opacity="0.85" stroke="#d946ef" stroke-width="1" />
    <text x="24" y="29" fill="#f8fafc" font-size="10" font-family="monospace" font-weight="bold">CARTOSAT-3 0.5m • INDUSTRIAL</text>
    <text x="24" y="44" fill="#f0abfc" font-size="8" font-family="monospace">JAMNAGAR PETROCHEMICAL COMPLEX</text>
  </svg>
  `;
  return encodeSvg(svg);
}

// ----------------------------------------------------------------------
// 12. DROUGHT & RESERVOIR MONITORING (Marathwada Jaikwadi Reservoir)
// ----------------------------------------------------------------------
export function getMarathwadaDroughtImagery({ showDeficit = false } = {}) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <image href="/satellite/marathwada_reservoir.jpg" width="800" height="500" preserveAspectRatio="xMidYMid slice" />

    ${
      showDeficit
        ? `
      <!-- Historical High-Water Perimeter & Exposed Dry Bed -->
      <path d="M 210 140 C 320 100, 520 130, 640 220 C 720 310, 680 410, 540 440 C 380 470, 240 430, 180 300 Z" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="6,4" />

      <g transform="translate(480, 420)">
        <rect width="250" height="42" rx="4" fill="#450a0a" fill-opacity="0.9" stroke="#ef4444" stroke-width="1.2" />
        <text x="125" y="18" fill="#fca5a5" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">RESERVOIR STORAGE DEFICIT</text>
        <text x="125" y="32" fill="#ffffff" font-size="8" font-family="sans-serif" text-anchor="middle">-41% Surface Water Shrinkage</text>
      </g>
    `
        : ""
    }

    <!-- Sensor HUD Watermark -->
    <rect x="14" y="14" width="240" height="38" rx="4" fill="#0b1120" fill-opacity="0.85" stroke="#0284c7" stroke-width="1" />
    <text x="24" y="29" fill="#f8fafc" font-size="10" font-family="monospace" font-weight="bold">SENTINEL-1 + LANDSAT-9</text>
    <text x="24" y="44" fill="#38bdf8" font-size="8" font-family="monospace">MARATHWADA RESERVOIR • 10m GSD</text>
  </svg>
  `;
  return encodeSvg(svg);
}

// ----------------------------------------------------------------------
// BI-TEMPORAL SPLIT SCREEN GENERATOR (Real Satellite Images)
// ----------------------------------------------------------------------
export function getSplitSatelliteComparison({ leftImg, rightImg, leftLabel, rightLabel }) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <defs>
      <clipPath id="leftHalf">
        <rect x="0" y="0" width="400" height="500" />
      </clipPath>
      <clipPath id="rightHalf">
        <rect x="400" y="0" width="400" height="500" />
      </clipPath>
    </defs>

    <g clip-path="url(#leftHalf)">
      <image href="${leftImg}" width="800" height="500" preserveAspectRatio="xMidYMid slice" />
    </g>

    <g clip-path="url(#rightHalf)">
      <image href="${rightImg}" width="800" height="500" preserveAspectRatio="xMidYMid slice" />
    </g>

    <!-- Center Split Line -->
    <line x1="400" y1="0" x2="400" y2="500" stroke="#ffffff" stroke-width="3" />

    <g transform="translate(15, 455)">
      <rect width="130" height="26" rx="4" fill="#0b1120" fill-opacity="0.85" stroke="#ffffff" stroke-width="0.75" />
      <text x="65" y="17" fill="#ffffff" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">${leftLabel}</text>
    </g>

    <g transform="translate(655, 455)">
      <rect width="130" height="26" rx="4" fill="#0b1120" fill-opacity="0.85" stroke="#38bdf8" stroke-width="0.75" />
      <text x="65" y="17" fill="#38bdf8" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">${rightLabel}</text>
    </g>
  </svg>
  `;
  return encodeSvg(svg);
}
