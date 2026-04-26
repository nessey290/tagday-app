import { useState, useRef } from "react";

/* ── COLORS ── */
const C = {
  green:   '#1E5C3A', greenL: '#2A7A4E',
  purple:  '#964B8C', purpleL: '#D4A8D0', purpleBg: '#F7EFF6',
  gold:    '#C9912A', goldBg: '#FDF5E6',  goldL: '#F0D5A0',
  bg:      '#F2F7F4', card: '#ffffff',
  text:    '#0D2B1C', muted: '#4A7A5E',   border: '#C2DDD0',
  red:     '#dc3545', redBg: '#fff5f5',   white: '#ffffff',
};
const font     = "'DM Sans', system-ui, sans-serif";
const fontHead = "'Barlow Condensed', system-ui, sans-serif";

function injectFonts() {
  if (document.getElementById('rp-fonts')) return;
  const l = document.createElement('link');
  l.id = 'rp-fonts'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap';
  document.head.appendChild(l);
}
injectFonts();

/* ── CONSTANTS ── */
const JRHS       = { lat: 37.5185, lng: -77.6255 }; // James River High School
const SHIFT_MINS = 150;  // 2.5 hour target per route (allows time for breaks)
const STUDENTS   = 4;    // students per car (2 pairs)
const TRAVEL_MINS = 5;   // travel + parking per street

const DENSITY = {
  dense:   { label: 'Dense (townhomes)',  minsPerHouse: 2.0, color: C.purple },
  typical: { label: 'Typical suburban',   minsPerHouse: 3.0, color: C.green  },
  large:   { label: 'Large lots / rural', minsPerHouse: 5.0, color: C.gold   },
};

/* ── STREET NAME NORMALIZER ── */
const ABBR_MAP = {
  ' ALY': ' Alley',   ' AVE': ' Avenue',    ' BLVD': ' Boulevard',
  ' CIR': ' Circle',  ' CT': ' Court',       ' CV': ' Cove',
  ' DR': ' Drive',    ' EXPY': ' Expressway',' HWY': ' Highway',
  ' LN': ' Lane',     ' LOOP': ' Loop',      ' PASS': ' Pass',
  ' PATH': ' Path',   ' PKWY': ' Parkway',   ' PL': ' Place',
  ' PLZ': ' Plaza',   ' PT': ' Point',       ' RD': ' Road',
  ' RUN': ' Run',     ' SQ': ' Square',      ' ST': ' Street',
  ' TER': ' Terrace', ' TERR': ' Terrace',   ' TRL': ' Trail',
  ' TPKE': ' Turnpike',' WAY': ' Way',       ' XING': ' Crossing',
};

function normalizeName(raw) {
  let s = raw.toUpperCase().trim();
  s = s.replace(/^(N|S|E|W|NE|NW|SE|SW)\s+/, '').replace(/\s+(N|S|E|W|NE|NW|SE|SW)$/, '');
  for (const [abbr, full] of Object.entries(ABBR_MAP)) {
    if (s.endsWith(abbr)) { s = s.slice(0, -abbr.length) + full; break; }
  }
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim();
}

/* ── GEOMETRY ── */
function dist(a, b) {
  const dlat = a.lat - b.lat, dlng = a.lng - b.lng;
  return Math.sqrt(dlat * dlat + dlng * dlng);
}

function fmtTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
}

/* ── TIME ESTIMATE (2 pairs working simultaneously) ── */
function streetMins(houses, density, minsPerHouse) {
  const rate = minsPerHouse[density] ?? DENSITY[density].minsPerHouse;
  return Math.round((houses / 2) * rate) + TRAVEL_MINS;
}

/* ══════════════════════════════════════════════════
   MASTER ROUTE GENERATION
   1. Parse addresses → group by subdivision → compute street centroids
   2. Sort subdivisions by distance from JRHS
   3. Greedy geographic clustering into 3-hour routes
   4. Sort routes by distance from JRHS (Route 1 = nearest)
══════════════════════════════════════════════════ */
function buildMasterRoutes(streets, minsPerHouse) {
  const timed = streets.map(s => ({
    ...s,
    mins: streetMins(s.houses, s.density, minsPerHouse),
  }));

  // Group by SuperSubdivision. Streets with no valid subdivision get their own entry.
  const GENERIC = new Set(['', 'other', 'none', 'n/a', 'unknown']);
  const subdivMap = {};
  for (const s of timed) {
    const raw = (s.subdivision || '').trim();
    // Use street name as its own key if subdivision is blank/generic
    const key = GENERIC.has(raw.toLowerCase()) ? `__street__${s.name}` : raw;
    if (!subdivMap[key]) subdivMap[key] = { name: raw || s.name, streets: [], lat: 0, lng: 0, count: 0 };
    subdivMap[key].streets.push(s);
    subdivMap[key].lat   += s.lat;
    subdivMap[key].lng   += s.lng;
    subdivMap[key].count += 1;
  }

  const rawSubdivs = Object.values(subdivMap).map(sd => ({
    ...sd,
    lat:         sd.lat / sd.count,
    lng:         sd.lng / sd.count,
    totalMins:   sd.streets.reduce((sum, s) => sum + s.mins, 0),
    // Use average driving distance from JRHS across streets in this subdivision
    distFromJRHS: sd.streets.reduce((sum, s) => sum + (s.drivingMinsFromJRHS ?? dist(s, JRHS) * 1000), 0) / sd.streets.length,
  }));

  // Pre-split any subdivision that alone exceeds SHIFT_MINS
  const splitSubdivs = [];
  for (const sd of rawSubdivs) {
    if (sd.totalMins <= SHIFT_MINS) { splitSubdivs.push(sd); continue; }
    const sorted = [...sd.streets].sort((a, b) => dist(a, sd) - dist(b, sd));
    let chunk = [], chunkMins = 0, partNum = 1;
    for (const st of sorted) {
      if (chunkMins + st.mins > SHIFT_MINS && chunk.length > 0) {
        const cLat = chunk.reduce((s, x) => s + x.lat, 0) / chunk.length;
        const cLng = chunk.reduce((s, x) => s + x.lng, 0) / chunk.length;
        splitSubdivs.push({ name: `${sd.name} (${partNum})`, streets: chunk, lat: cLat, lng: cLng, count: chunk.length, totalMins: chunkMins, distFromJRHS: dist({ lat: cLat, lng: cLng }, JRHS) });
        chunk = []; chunkMins = 0; partNum++;
      }
      chunk.push(st); chunkMins += st.mins;
    }
    if (chunk.length > 0) {
      const cLat = chunk.reduce((s, x) => s + x.lat, 0) / chunk.length;
      const cLng = chunk.reduce((s, x) => s + x.lng, 0) / chunk.length;
      splitSubdivs.push({ name: `${sd.name} (${partNum})`, streets: chunk, lat: cLat, lng: cLng, count: chunk.length, totalMins: chunkMins, distFromJRHS: dist({ lat: cLat, lng: cLng }, JRHS) });
    }
  }

  splitSubdivs.sort((a, b) => a.distFromJRHS - b.distFromJRHS);

  // Greedy geographic clustering — STRICT 3-hour limit
  // Rule: always prefer same-subdivision family chunks before mixing with other subdivisions
  const unassigned = [...splitSubdivs];
  const routes = [];

  while (unassigned.length > 0) {
    const seed = unassigned.shift();
    const route = {
      subdivisions: [seed],
      totalMins:    seed.totalMins,
      centLat:      seed.lat,
      centLng:      seed.lng,
      families:     new Set([seed.name.replace(/ \(\d+\)$/, '')]), // track subdivision families in route
    };

    let keepAdding = true;
    while (keepAdding && unassigned.length > 0) {
      keepAdding = false;

      // First pass: look for same-family chunks that fit
      let bestIdx = -1, bestDist = Infinity;
      for (let i = 0; i < unassigned.length; i++) {
        const c = unassigned[i];
        if (route.totalMins + c.totalMins > SHIFT_MINS) continue;
        const family = c.name.replace(/ \(\d+\)$/, '');
        if (!route.families.has(family)) continue; // only same family in first pass
        const d = dist({ lat: route.centLat, lng: route.centLng }, c);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }

      // Second pass: if no same-family chunks fit, look for nearest other subdivision
      if (bestIdx === -1) {
        for (let i = 0; i < unassigned.length; i++) {
          const c = unassigned[i];
          if (route.totalMins + c.totalMins > SHIFT_MINS) continue;
          const d = dist({ lat: route.centLat, lng: route.centLng }, c);
          if (d < bestDist) { bestDist = d; bestIdx = i; }
        }
      }

      if (bestIdx !== -1) {
        const fit = unassigned.splice(bestIdx, 1)[0];
        route.subdivisions.push(fit);
        route.totalMins += fit.totalMins;
        route.families.add(fit.name.replace(/ \(\d+\)$/, ''));
        const n = route.subdivisions.length;
        route.centLat = route.subdivisions.reduce((s, x) => s + x.lat, 0) / n;
        route.centLng = route.subdivisions.reduce((s, x) => s + x.lng, 0) / n;
        keepAdding = true;
      }
    }
    routes.push(route);
  }

  routes.sort((a, b) => dist({ lat: a.centLat, lng: a.centLng }, JRHS) - dist({ lat: b.centLat, lng: b.centLng }, JRHS));

  return routes.map((r, i) => {
    const allStreets = r.subdivisions.flatMap(sd => sd.streets);
    return {
      id:           `master-route-${i+1}`,
      number:       i + 1,
      name:         `Route ${i+1}`,
      streets:      allStreets,
      subdivisions: r.subdivisions.map(sd => sd.name),
      totalMins:    r.totalMins,
      totalHouses:  allStreets.reduce((s, x) => s + x.houses, 0),
      distFromJRHS: dist({ lat: r.centLat, lng: r.centLng }, JRHS),
    };
  });
}

/* ── OSRM DRIVING DISTANCE FROM JRHS ── */
async function fetchDrivingDists(streets, onProgress) {
  // OSRM table API: batch up to 100 destination points per request
  // Source is always JRHS, destinations are street centroids
  const BATCH = 100;
  const result = new Array(streets.length).fill(null);
  const jrhsCoord = `${JRHS.lng},${JRHS.lat}`;

  for (let i = 0; i < streets.length; i += BATCH) {
    const batch = streets.slice(i, i + BATCH);
    const coords = [jrhsCoord, ...batch.map(s => `${s.lng},${s.lat}`)].join(';');
    const sources = '0';
    const dests   = batch.map((_, j) => j + 1).join(';');
    const url = `https://router.project-osrm.org/table/v1/driving/${coords}?sources=${sources}&destinations=${dests}&annotations=duration`;
    try {
      const res  = await fetch(url);
      const data = await res.json();
      if (data.durations?.[0]) {
        data.durations[0].forEach((dur, j) => {
          result[i + j] = dur !== null ? dur / 60 : null; // convert seconds to minutes
        });
      }
    } catch {}
    onProgress(Math.min(100, Math.round(((i + BATCH) / streets.length) * 100)));
    await new Promise(r => setTimeout(r, 200)); // be polite to free API
  }

  // Fall back to straight-line distance (in arbitrary units) for any nulls
  return streets.map((s, i) => ({
    ...s,
    drivingMinsFromJRHS: result[i] ?? dist(s, JRHS) * 1000,
  }));
}
const Card = ({ children, style = {} }) => (
  <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 20, ...style }}>{children}</div>
);

const Btn = ({ onClick, children, variant = 'primary', disabled = false, style = {} }) => {
  const vs = {
    primary: { background: C.green,  color: C.white },
    purple:  { background: C.purple, color: C.white },
    outline: { background: 'transparent', color: C.green, border: `2px solid ${C.green}` },
    ghost:   { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` },
    gold:    { background: C.gold,   color: C.white },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '10px 20px', borderRadius: 8, fontSize: 15, fontFamily: font, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      border: 'none', transition: 'opacity 0.15s', ...vs[variant], ...style,
    }}>{children}</button>
  );
};

const Input = ({ value, onChange, type = 'text', min, max, step, placeholder, style = {} }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} min={min} max={max} step={step}
    placeholder={placeholder} style={{
      width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`,
      fontSize: 14, fontFamily: font, color: C.text, background: C.white, boxSizing: 'border-box', outline: 'none', ...style,
    }} />
);

const Label = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' }}>{children}</div>
);

const StepBar = ({ step, total }) => (
  <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < step ? C.green : i === step ? C.purple : C.border, transition: 'background 0.3s' }} />
    ))}
  </div>
);

/* ══════════════════════════════════════════════════
   STEP 1 — IMPORT
══════════════════════════════════════════════════ */
function StepImport({ onComplete }) {
  const [status,   setStatus]   = useState(null);
  const [result,   setResult]   = useState(null);
  const [progress, setProgress] = useState(0);
  const [phase,    setPhase]    = useState('');
  const [error,    setError]    = useState('');
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setStatus('loading'); setError(''); setResult(null); setProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setPhase('Parsing addresses…');
        const geojson  = JSON.parse(e.target.result);
        const features = geojson.features || [];
        const streetMap = {};
        let totalParsed = 0, totalJR = 0;

        for (const feat of features) {
          const p = feat?.properties;
          if (!p) continue;
          totalParsed++;
          if (!(p.HighSchoolName || '').toUpperCase().includes('JAMES RIVER')) continue;
          totalJR++;

          const prefix = (p.StreetNamePrefix  || '').trim();
          const name   = (p.StreetName         || '').trim();
          const type   = (p.StreetType         || '').trim();
          const suffix = (p.StreetNameSuffix   || '').trim();
          const raw    = [prefix, name, type, suffix].filter(Boolean).join(' ');
          const norm   = normalizeName(raw);
          if (!norm) continue;

          const superSub   = (p.SuperSubdivisionName || '').trim();
          const subSub     = (p.SubdivisionName || '').trim();
          const subdivision = superSub || subSub || '';
          const lat = feat.geometry?.coordinates?.[1];
          const lng = feat.geometry?.coordinates?.[0];
          if (!lat || !lng) continue;

          if (!streetMap[norm]) {
            streetMap[norm] = {
              id: Math.random().toString(36).substr(2, 8),
              name: norm, subdivision, houses: 0,
              latSum: 0, lngSum: 0, density: 'typical',
              // Track all address points to find street endpoints
              points: [],
            };
          }
          streetMap[norm].houses++;
          streetMap[norm].latSum += lat;
          streetMap[norm].lngSum += lng;
          streetMap[norm].points.push({ lat, lng });
          if (!streetMap[norm].subdivision && subdivision) streetMap[norm].subdivision = subdivision;
        }

        let streets = Object.values(streetMap).map(s => {
          // Find the two most geographically distant address points — these are the street endpoints
          let startCoord = null, endCoord = null;
          if (s.points.length >= 2) {
            let maxDist = 0;
            for (let a = 0; a < s.points.length; a++) {
              for (let b = a + 1; b < s.points.length; b++) {
                const d = Math.hypot(s.points[a].lat - s.points[b].lat, s.points[a].lng - s.points[b].lng);
                if (d > maxDist) {
                  maxDist = d;
                  startCoord = s.points[a];
                  endCoord   = s.points[b];
                }
              }
            }
          } else if (s.points.length === 1) {
            startCoord = s.points[0];
          }
          return {
            ...s,
            lat:        s.latSum / s.houses,
            lng:        s.lngSum / s.houses,
            density:    s.houses > 25 ? 'dense' : s.houses < 10 ? 'large' : 'typical',
            startCoord,
            endCoord,
            points:     undefined, // don't carry the full array forward
          };
        });

        if (streets.length === 0) {
          setStatus('error'); setError('No James River streets found. Check the file.');
          return;
        }

        // Fetch driving distances from JRHS via OSRM
        setPhase(`Getting driving distances from JRHS for ${streets.length} streets…`);
        setProgress(0);
        streets = await fetchDrivingDists(streets, (pct) => {
          setProgress(pct);
          setPhase(`Getting driving distances… ${pct}%`);
        });

        setResult({ totalParsed, totalJR, streetCount: streets.length });
        setStatus('done');
        onComplete(streets);
      } catch (err) {
        setStatus('error'); setError('Could not parse file: ' + err.message);
      }
    };
    reader.onerror = () => { setStatus('error'); setError('Could not read file.'); };
    reader.readAsText(file);
  };

  return (
    <div>
      <div style={{ fontFamily: fontHead, fontSize: 28, fontWeight: 700, color: C.green, marginBottom: 4 }}>Import Address Data</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
        Upload the Chesterfield County Address Points GeoJSON. The planner will automatically identify all James River district streets, group them by subdivision, and build geographically coherent routes.
      </div>

      <div style={{ background: C.goldBg, border: `1px solid ${C.goldL}`, borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>Download the file</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
          Go to{' '}
          <a href="https://opengisdata.chesterfield.gov/datasets/87f6b89225004b9ab7dad0e444177387_0" target="_blank" rel="noopener noreferrer" style={{ color: C.green }}>opengisdata.chesterfield.gov</a>
          {' '}→ Download → GeoJSON
        </div>
      </div>

      <div style={{ background: C.purpleBg, border: `1px solid ${C.purpleL}`, borderRadius: 10, padding: '14px 16px', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 6 }}>How routes are built</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
          • 4 students per route (2 pairs working simultaneously → 2× speed)<br/>
          • Streets grouped by subdivision to keep routes geographically tight<br/>
          • Each route targets a 3-hour shift window<br/>
          • Routes numbered 1–N from nearest to furthest from James River HS<br/>
          • Saved as a master list — select how many to deploy each year
        </div>
      </div>

      {status === 'loading' && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: C.purple, fontWeight: 600, marginBottom: 8 }}>⏳ {phase}</div>
          <div style={{ background: C.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 4, background: C.purple, width: `${progress}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
            Driving distances from OSRM ensure streets close by road stay together. This takes 30–60 seconds.
          </div>
        </div>
      )}
      {status === 'done' && result && (
        <div style={{ background: '#f0fff4', border: '1px solid #198754', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>
          <div style={{ fontWeight: 700, color: '#198754', marginBottom: 4 }}>✓ {result.streetCount} streets found in the James River district</div>
          <div style={{ color: C.muted }}>{result.totalJR.toLocaleString()} James River addresses · {result.totalParsed.toLocaleString()} total parsed</div>
        </div>
      )}
      {status !== 'done' && (
        <button onClick={() => fileRef.current?.click()} style={{
          padding: '12px 24px', borderRadius: 8, border: `2px solid ${C.green}`,
          background: C.white, color: C.green, fontFamily: font, fontWeight: 600, fontSize: 15, cursor: 'pointer',
        }}>📂 Upload Address GeoJSON</button>
      )}
      <input ref={fileRef} type="file" accept=".geojson,.json" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      {error && (
        <div style={{ background: C.redBg, border: '1px solid #f5c6cb', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: C.red, marginTop: 12 }}>⚠ {error}</div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   STEP 2 — GENERATE MASTER ROUTES
══════════════════════════════════════════════════ */
function StepGenerate({ streets, onGenerated, onBack }) {
  const [minsPerHouse, setMinsPerHouse] = useState({ dense: 2.0, typical: 3.0, large: 5.0 });

  const totalHouses  = streets.reduce((s, x) => s + x.houses, 0);
  const estRoutes    = Math.ceil(streets.reduce((s, x) => s + streetMins(x.houses, x.density, minsPerHouse), 0) / SHIFT_MINS);
  const subdivisions = [...new Set(streets.map(s => s.subdivision))].length;

  const generate = () => {
    const routes = buildMasterRoutes(streets, minsPerHouse);
    onGenerated(routes);
  };

  return (
    <div>
      <div style={{ fontFamily: fontHead, fontSize: 28, fontWeight: 700, color: C.green, marginBottom: 4 }}>Configure & Generate</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>
        Adjust timing assumptions, then generate your master route list.
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Streets',       val: streets.length },
          { label: 'Subdivisions',  val: subdivisions },
          { label: 'Total Houses',  val: totalHouses.toLocaleString() },
        ].map(s => (
          <div key={s.label} style={{ background: C.bg, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: fontHead, fontSize: 28, fontWeight: 700, color: C.green }}>{s.val}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Card style={{ background: C.goldBg, border: `1px solid ${C.goldL}`, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>⏱ Minutes per House (one pair)</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, lineHeight: 1.6 }}>
          Time for <strong>one student pair</strong> to visit a single house — including walking to the door, knocking, waiting, and a brief interaction. Assumes ~40% of homes answer (~2 min each) and ~60% don't answer (~30 sec each), plus walking time between doors.
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
          Because 2 pairs work simultaneously, the effective rate for the route is halved. A route with 20 typical houses takes <strong>{Math.round((20 / 2) * minsPerHouse.typical + TRAVEL_MINS)} minutes</strong> with current settings.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(DENSITY).map(([k, v]) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '1fr 140px', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: v.color, flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 13, color: C.text }}>{v.label}</span>
                  <div style={{ fontSize: 11, color: C.muted }}>Effective: {fmtTime(Math.round(minsPerHouse[k] / 2))} per house for route</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" value={minsPerHouse[k]} min="0.5" max="15" step="0.5"
                  onChange={e => setMinsPerHouse(prev => ({ ...prev, [k]: Number(e.target.value) }))}
                  style={{ width: 65, padding: '5px 8px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: font, color: C.text, textAlign: 'right' }} />
                <span style={{ fontSize: 12, color: C.muted }}>min/house</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ background: C.bg, borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: C.muted }}>
        Estimated master routes: <strong style={{ color: C.green }}>{estRoutes}</strong> routes × 2.5 hours each × 4 students
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Btn onClick={onBack} variant="ghost">← Back</Btn>
        <Btn onClick={generate}>Generate Master Routes →</Btn>
      </div>
    </div>
  );
}

function StepReview({ routes, setRoutes, onNext, onBack }) {
  const [expanded,  setExpanded]  = useState({});
  const [showCSV,   setShowCSV]   = useState(false);
  const [csvCopied, setCsvCopied] = useState(false);
  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const routeDisplayName = (r) =>
    `Route ${r.number} — ${r.subdivisions.slice(0, 3).join(' · ')}${r.subdivisions.length > 3 ? '…' : ''}`;

  const totalHouses = routes.reduce((s, r) => s + r.totalHouses, 0);
  const totalMins   = routes.reduce((s, r) => s + r.totalMins, 0);

  const buildCSV = () => {
    const rows = [['Route Number', 'Route Name', 'Neighborhood', 'Street', 'Houses', 'Density', 'Est. Time']];
    for (const route of routes) {
      const displayName = `Route ${route.number} — ${route.subdivisions.slice(0,3).join(' · ')}${route.subdivisions.length > 3 ? '…' : ''}`;
      for (const street of route.streets) {
        rows.push([
          route.number,
          displayName,
          street.subdivision || '',
          street.name,
          street.houses,
          DENSITY[street.density]?.label || street.density,
          fmtTime(street.mins),
        ]);
      }
    }
    return rows.map(r => r.join(',')).join('\n');
  };

  const csvText = showCSV ? buildCSV() : '';

  const copyCSV = () => {
    navigator.clipboard.writeText(buildCSV()).then(() => {
      setCsvCopied(true);
      setTimeout(() => setCsvCopied(false), 2000);
    });
  };

  const moveStreet = (streetId, fromRouteId, toRouteId) => {
    setRoutes(prev => {
      const next = prev.map(r => ({ ...r, streets: [...r.streets] }));
      const fromRoute = next.find(r => r.id === fromRouteId);
      const toRoute   = next.find(r => r.id === toRouteId);
      const street    = fromRoute.streets.find(s => s.id === streetId);
      fromRoute.streets   = fromRoute.streets.filter(s => s.id !== streetId);
      fromRoute.totalMins = fromRoute.streets.reduce((s, x) => s + x.mins, 0);
      fromRoute.totalHouses = fromRoute.streets.reduce((s, x) => s + x.houses, 0);
      fromRoute.subdivisions = [...new Set(fromRoute.streets.map(s => s.subdivision).filter(Boolean))];
      toRoute.streets.push(street);
      toRoute.totalMins = toRoute.streets.reduce((s, x) => s + x.mins, 0);
      toRoute.totalHouses = toRoute.streets.reduce((s, x) => s + x.houses, 0);
      toRoute.subdivisions = [...new Set(toRoute.streets.map(s => s.subdivision).filter(Boolean))];
      return next.filter(r => r.streets.length > 0);
    });
  };

  return (
    <div>
      <div style={{ fontFamily: fontHead, fontSize: 28, fontWeight: 700, color: C.green, marginBottom: 4 }}>Master Route List</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 4 }}>
        {routes.length} routes · {totalHouses.toLocaleString()} addresses · {fmtTime(totalMins)} total work · sorted nearest → furthest from JRHS
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
        Routes numbered 1 (closest to school) to {routes.length} (furthest). Click a name to rename. This is your permanent master list.
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button onClick={() => setShowCSV(v => !v)} style={{
          padding: '9px 18px', borderRadius: 8, border: `1.5px solid ${C.green}`,
          background: C.white, color: C.green, fontFamily: font, fontWeight: 600, fontSize: 13, cursor: 'pointer',
        }}>{showCSV ? '▲ Hide CSV Data' : '▼ Show CSV for Validation'}</button>
        {showCSV && (
          <button onClick={copyCSV} style={{
            padding: '9px 18px', borderRadius: 8, border: `1.5px solid ${C.purple}`,
            background: C.white, color: C.purple, fontFamily: font, fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>{csvCopied ? '✓ Copied!' : '📋 Copy to Clipboard'}</button>
        )}
      </div>

      {showCSV && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
            Copy this and paste into Excel or Google Sheets. Use Ctrl+A to select all first.
          </div>
          <textarea
            readOnly
            value={csvText}
            onClick={e => e.target.select()}
            style={{
              width: '100%', height: 200, padding: '10px 12px', borderRadius: 8,
              border: `1.5px solid ${C.border}`, fontSize: 11, fontFamily: 'monospace',
              color: C.text, background: C.bg, boxSizing: 'border-box', resize: 'vertical',
            }}
          />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto', marginBottom: 16 }}>
        {routes.map((route) => {
          const pct = Math.min(100, Math.round((route.totalMins / SHIFT_MINS) * 100));
          const isExp = expanded[route.id];
          return (
            <Card key={route.id} style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: C.green, color: C.white, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontFamily: fontHead, fontSize: 16, fontWeight: 700,
                }}>{route.number}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: C.text }}>
                    {routeDisplayName(route)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: pct > 100 ? C.red : C.text }}>{fmtTime(route.totalMins)}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{route.totalHouses} 🏠</div>
                </div>
              </div>
              <div style={{ background: C.bg, borderRadius: 4, height: 5, marginBottom: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: pct > 100 ? C.red : C.green, transition: 'width 0.3s' }} />
              </div>
              <button onClick={() => toggle(route.id)} style={{ background: 'none', border: 'none', fontSize: 12, color: C.muted, cursor: 'pointer', padding: 0, fontFamily: font }}>
                {isExp ? '▲ Hide streets' : `▼ Show ${route.streets.length} streets`}
              </button>
              {isExp && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {route.streets.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: C.bg, borderRadius: 6, fontSize: 12, borderLeft: `3px solid ${DENSITY[s.density].color}` }}>
                      <span style={{ fontWeight: 600, color: C.text, flex: 1 }}>{s.name}</span>
                      <span style={{ color: C.muted, flexShrink: 0 }}>{s.houses}🏠 · {fmtTime(s.mins)}</span>
                      <select
                        defaultValue=""
                        onChange={e => { if (e.target.value) { moveStreet(s.id, route.id, e.target.value); e.target.value = ''; } }}
                        style={{ fontSize: 10, padding: '2px 4px', borderRadius: 5, border: `1px solid ${C.border}`, fontFamily: font, color: C.muted, background: C.white, cursor: 'pointer', maxWidth: 90 }}>
                        <option value="">Move→</option>
                        {routes.filter(r => r.id !== route.id).map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Btn onClick={onBack} variant="ghost">← Regenerate</Btn>
        <Btn onClick={onNext} variant="purple">Annual Deployment →</Btn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   STEP 4 — ANNUAL DEPLOYMENT
══════════════════════════════════════════════════ */
function StepDeploy({ routes, onBack }) {
  const [morningDrivers,   setMorningDrivers]   = useState(15);
  const [afternoonDrivers, setAfternoonDrivers] = useState(15);
  const [imported,         setImported]         = useState(false);
  const [copied,           setCopied]           = useState(false);

  const morn        = Math.min(Number(morningDrivers),   routes.length);
  const aft         = Math.min(Number(afternoonDrivers), routes.length - morn);
  const total       = morn + aft;
  const unusedCount = routes.length - total;

  const morningRoutes   = routes.slice(0, morn);
  const afternoonRoutes = routes.slice(morn, morn + aft);

  const toTagDayFormat = (rts, shift) => rts.map(r => ({
    id:          `${r.id}-${shift.toLowerCase()}`,
    name:        `Route ${r.number} — ${r.subdivisions.slice(0, 3).join(' · ')}${r.subdivisions.length > 3 ? '…' : ''}`,
    shift,
    description: r.streets.map(s => s.name).join('\n'),
    doNotVisit:  '',
    // Street endpoints for accurate map routing in Tag Day app
    streetCoords: r.streets.map(s => ({
      name:       s.name,
      startCoord: s.startCoord || null,
      endCoord:   s.endCoord   || null,
    })),
  }));

  const morningTD   = toTagDayFormat(morningRoutes,   'Morning');
  const afternoonTD = toTagDayFormat(afternoonRoutes, 'Afternoon');
  const allTD       = [...morningTD, ...afternoonTD];

  const importToApp = () => {
    try {
      localStorage.setItem('td-routes', JSON.stringify(allTD));
      setImported(true);
    } catch {
      alert('Could not import. Open this tool in the same browser as your Tag Day app.');
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(allTD, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div style={{ fontFamily: fontHead, fontSize: 28, fontWeight: 700, color: C.green, marginBottom: 4 }}>Annual Deployment</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
        Enter how many drivers you have for each shift. Morning gets Routes 1–N (nearest JRHS), afternoon picks up from there. Unused routes are skipped.
      </div>

      {/* Driver counts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <Card style={{ background: '#f0fff4', border: '1px solid #198754' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#198754', marginBottom: 10 }}>☀️ MORNING DRIVERS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <input type="range" min={0} max={routes.length} value={morningDrivers}
              onChange={e => { setMorningDrivers(Number(e.target.value)); setImported(false); }}
              style={{ flex: 1, accentColor: '#198754' }} />
            <div style={{ fontFamily: fontHead, fontSize: 32, color: '#198754', fontWeight: 700, minWidth: 36, textAlign: 'right' }}>{morn}</div>
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            Routes 1–{morn || '—'} · {STUDENTS} students each
          </div>
        </Card>

        <Card style={{ background: C.purpleBg, border: `1px solid ${C.purpleL}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, marginBottom: 10 }}>🌤 AFTERNOON DRIVERS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <input type="range" min={0} max={routes.length - morn} value={afternoonDrivers}
              onChange={e => { setAfternoonDrivers(Number(e.target.value)); setImported(false); }}
              style={{ flex: 1, accentColor: C.purple }} />
            <div style={{ fontFamily: fontHead, fontSize: 32, color: C.purple, fontWeight: 700, minWidth: 36, textAlign: 'right' }}>{aft}</div>
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            Routes {morn + 1}–{morn + aft || '—'} · {STUDENTS} students each
          </div>
        </Card>
      </div>

      {/* Summary */}
      <div style={{ background: C.bg, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: C.muted }}>
        <strong style={{ color: C.text }}>{total} total routes</strong> selected this year ·{' '}
        {unusedCount > 0 && <span>{unusedCount} routes unused (Routes {total + 1}–{routes.length}, furthest from school) · </span>}
        {STUDENTS} students per car
      </div>

      {/* Route list preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 300, overflowY: 'auto', marginBottom: 20 }}>
        {routes.slice(0, total).map((r, i) => {
          const isMorn = i < morn;
          const color  = isMorn ? '#198754' : C.purple;
          const bg     = isMorn ? '#f0fff4'  : C.purpleBg;
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: bg, borderRadius: 8, fontSize: 13 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: color, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{r.number}</div>
              <div style={{ flex: 1, fontWeight: 600, color: C.text }}>{r.name}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{r.subdivisions.slice(0,2).join(' · ')}{r.subdivisions.length > 2 ? '…' : ''} · {fmtTime(r.totalMins)}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color }}>{isMorn ? 'Morning' : 'Afternoon'}</div>
            </div>
          );
        })}
        {unusedCount > 0 && (
          <div style={{ padding: '8px 12px', background: C.bg, borderRadius: 8, fontSize: 12, color: C.muted, textAlign: 'center' }}>
            + {unusedCount} routes unused this year (Routes {total+1}–{routes.length})
          </div>
        )}
      </div>

      {/* Export */}
      <Card style={{ background: C.purpleBg, border: `1px solid ${C.purpleL}`, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 8 }}>📱 Import to Tag Day App</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
          Imports {morn} morning + {aft} afternoon routes. Replaces all existing routes in your Tag Day app.
        </div>
        {imported ? (
          <div style={{ background: '#f0fff4', border: '1px solid #198754', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#198754', fontWeight: 600 }}>
            ✓ Imported! Open your Tag Day app → Admin → Routes to verify.
          </div>
        ) : (
          <Btn onClick={importToApp} variant="purple">Import {total} Routes to Tag Day App</Btn>
        )}
      </Card>

      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 8 }}>📋 Copy as JSON</div>
        <Btn onClick={copyJson} variant="outline" style={{ marginBottom: 10 }}>{copied ? '✓ Copied!' : 'Copy JSON'}</Btn>
        <pre style={{ background: C.bg, borderRadius: 8, padding: 10, fontSize: 10, color: C.text, overflowX: 'auto', maxHeight: 180, fontFamily: 'monospace' }}>
          {JSON.stringify(allTD.slice(0, 3), null, 2)}{allTD.length > 3 ? '\n  // ...' : ''}
        </pre>
      </Card>

      <div style={{ marginTop: 16 }}>
        <Btn onClick={onBack} variant="ghost">← Back to Routes</Btn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════ */
export default function App() {
  const [step,    setStep]    = useState(0);
  const [streets, setStreets] = useState([]);
  const [routes,  setRoutes]  = useState([]);

  const STEPS = ['Import Data', 'Configure', 'Review Routes', 'Deploy'];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>
      <div style={{ background: C.green, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontFamily: fontHead, fontSize: 24, fontWeight: 700, color: C.white, letterSpacing: 2 }}>🎺 TAG DAY ROUTE PLANNER</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>James River Regiment</div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 20px' }}>
        <StepBar step={step} total={STEPS.length} />
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 }}>
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </div>
        <Card>
          {step === 0 && <StepImport   onComplete={(s) => { setStreets(s); setStep(1); }} />}
          {step === 1 && <StepGenerate streets={streets} onGenerated={(r) => { setRoutes(r); setStep(2); }} onBack={() => setStep(0)} />}
          {step === 2 && <StepReview   routes={routes} setRoutes={setRoutes} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <StepDeploy   routes={routes} onBack={() => setStep(2)} />}
        </Card>
      </div>
    </div>
  );
}
