import { useState, useEffect, useRef } from "react";

/* ── DESIGN TOKENS ── */
const C = {
  navy:    '#1E5C3A',
  navyL:   '#2A7A4E',
  gold:    '#964B8C',
  goldL:   '#D4A8D0',
  goldbg:  '#F7EFF6',
  white:   '#ffffff',
  bg:      '#F2F7F4',
  card:    '#ffffff',
  text:    '#0D2B1C',
  muted:   '#4A7A5E',
  border:  '#C2DDD0',
  red:     '#dc3545',
  redbg:   '#fff5f5',
  green:   '#198754',
  greenbg: '#f0fff4',
  tag:     '#EAF0EC',
};
const font     = "'DM Sans', system-ui, sans-serif";
const fontHead = "'Barlow Condensed', system-ui, sans-serif";

function injectFonts() {
  if (document.getElementById('td-fonts')) return;
  const l = document.createElement('link');
  l.id   = 'td-fonts';
  l.rel  = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap';
  document.head.appendChild(l);
}

/* ── UTILITIES ── */
const fmt$ = (n) => '$' + Number(n || 0).toFixed(2);
const genId = () => Math.random().toString(36).substr(2, 9);

async function sGet(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
async function sSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); }
  catch (e) { console.error(e); }
}

/* ── SHARED UI ── */
const Btn = ({ onClick, children, variant = 'primary', style = {}, disabled = false }) => {
  const vs = {
    primary: { background: C.navy,  color: C.white, border: 'none' },
    gold:    { background: C.gold,  color: C.white, border: 'none' },
    outline: { background: 'transparent', color: C.navy, border: `2px solid ${C.navy}` },
    danger:  { background: C.red,   color: C.white, border: 'none' },
    ghost:   { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '10px 20px', borderRadius: 8, fontSize: 15, fontFamily: font,
      fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1, transition: 'opacity 0.15s',
      ...vs[variant], ...style,
    }}>{children}</button>
  );
};

const TextInput = ({ value, onChange, placeholder, type = 'text', style = {} }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{
      width: '100%', padding: '10px 14px', borderRadius: 8,
      border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: font,
      color: C.text, background: C.white, boxSizing: 'border-box', outline: 'none', ...style,
    }} />
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 20, ...style }}>
    {children}
  </div>
);

const Header = ({ title, subtitle, onBack }) => (
  <div style={{ background: C.navy, color: C.white, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
    {onBack && (
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.white, cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '0 4px' }}>←</button>
    )}
    <div>
      <div style={{ fontFamily: fontHead, fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: C.goldL, marginTop: 2 }}>{subtitle}</div>}
    </div>
  </div>
);

const Badge = ({ children, color = 'navy' }) => {
  const bg = color === 'gold' ? C.goldL : color === 'green' ? C.greenbg : C.tag;
  const fg = color === 'gold' ? C.navy  : color === 'green' ? C.green   : C.navy;
  return (
    <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: font, background: bg, color: fg }}>
      {children}
    </span>
  );
};

const Label = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' }}>{children}</div>
);

/* ══════════════════════════════════════════════════
   HOME SCREEN
══════════════════════════════════════════════════ */
function HomeScreen({ onDriver, onAdmin, onResume, savedSession, routes, settings }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const savedRoute = savedSession ? routes.find(r => r.id === savedSession.routeId) : null;
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>
      <div style={{ background: C.navy, padding: '48px 24px 36px', textAlign: 'center' }}>
        <div style={{ fontFamily: fontHead, fontSize: 36, fontWeight: 700, color: C.gold, letterSpacing: 3 }}>
          <span style={{ color: C.goldL, fontSize: 28 }}>♪</span> {settings.eventName || 'JAMES RIVER REGIMENT'} <span style={{ color: C.goldL, fontSize: 28 }}>♪</span>
        </div>
        <div style={{ color: C.goldL, fontSize: 14, marginTop: 8 }}>{today}</div>
      </div>

      <div style={{ padding: '28px 24px', maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Saved session resume card */}
        {savedSession && savedRoute && (
          <div style={{ background: C.goldbg, border: `1.5px solid ${C.goldL}`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, letterSpacing: 0.8, marginBottom: 8 }}>WELCOME BACK</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 2 }}>{savedSession.name}</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
              {savedRoute.name} · {savedSession.shift} Shift
              {savedSession.students ? ` · ${savedSession.students}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onResume} style={{
                flex: 2, padding: '12px', borderRadius: 9, border: 'none',
                background: C.navy, color: C.white, fontFamily: fontHead,
                fontSize: 17, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5,
              }}>Continue Collecting →</button>
              <button onClick={onDriver} style={{
                flex: 1, padding: '12px', borderRadius: 9, border: `1.5px solid ${C.border}`,
                background: C.white, color: C.muted, fontFamily: font,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Not me</button>
            </div>
          </div>
        )}

        <button onClick={onDriver} style={{
          background: C.gold, color: C.white, border: 'none', borderRadius: 14,
          padding: '28px 24px', fontSize: 24, fontFamily: fontHead, fontWeight: 700,
          letterSpacing: 1, cursor: 'pointer', textAlign: 'left',
          boxShadow: '0 6px 20px rgba(150,75,140,0.35)',
        }}>
          🚗  I'M A DRIVER
          <div style={{ fontSize: 14, fontFamily: font, fontWeight: 500, marginTop: 5, opacity: 0.75 }}>Log donations for your route</div>
        </button>

        <button onClick={onAdmin} style={{
          background: C.navyL, color: C.white, border: 'none', borderRadius: 14,
          padding: '28px 24px', fontSize: 24, fontFamily: fontHead, fontWeight: 700,
          letterSpacing: 1, cursor: 'pointer', textAlign: 'left',
        }}>
          📋  ADMIN
          <div style={{ fontSize: 14, fontFamily: font, fontWeight: 500, marginTop: 5, opacity: 0.65 }}>Manage routes & view totals</div>
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DRIVER SETUP
══════════════════════════════════════════════════ */
function DriverSetup({ routes, settings, onStart, onBack }) {
  const [name,     setName]     = useState('');
  const [students, setStudents] = useState('');
  const [shift,    setShift]    = useState((settings.shifts || ['Morning', 'Afternoon'])[0]);
  const [routeId,  setRoute]    = useState('');

  const shiftRoutes = routes.filter(r => r.shift === shift);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>
      <Header title="DRIVER CHECK-IN" onBack={onBack} />
      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div>
            <Label>Your Name (Driver)</Label>
            <TextInput value={name} onChange={setName} placeholder="Enter your name" />
          </div>

          <div>
            <Label>Students in Your Car</Label>
            <TextInput value={students} onChange={setStudents} placeholder="e.g. Emma, Jake, Sofia" />
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Separate names with commas</div>
          </div>

          <div>
            <Label>Shift</Label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(settings.shifts || ['Morning', 'Afternoon']).map(s => (
                <button key={s} onClick={() => { setShift(s); setRoute(''); }} style={{
                  flex: 1, padding: '11px', borderRadius: 8, cursor: 'pointer', fontFamily: font, fontWeight: 600, fontSize: 15,
                  background: shift === s ? C.navy : C.white,
                  color: shift === s ? C.white : C.muted,
                  border: `2px solid ${shift === s ? C.navy : C.border}`,
                  transition: 'all 0.15s',
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>
              Route{shiftRoutes.length === 0 && <span style={{ color: C.red, fontWeight: 400, textTransform: 'none' }}> — none added yet</span>}
            </Label>
            {shiftRoutes.length > 0 ? (
              <select value={routeId} onChange={e => setRoute(e.target.value)} style={{
                width: '100%', padding: '11px 14px', borderRadius: 8,
                border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: font, color: C.text, background: C.white,
              }}>
                <option value="">Select your route…</option>
                {shiftRoutes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            ) : (
              <div style={{ padding: '12px 14px', background: C.redbg, borderRadius: 8, color: C.red, fontSize: 14 }}>
                No routes set up for {shift} shift. Ask your admin to add them first.
              </div>
            )}
          </div>

          {routeId && (() => {
            const r = routes.find(x => x.id === routeId);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {r?.doNotVisit && (
                  <div style={{ background: C.redbg, border: `1.5px solid ${C.red}`, borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 6, letterSpacing: 0.8 }}>⛔ DO NOT VISIT</div>
                    <div style={{ fontSize: 13, color: C.red, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{r.doNotVisit}</div>
                  </div>
                )}
                {r?.description && (
                  <div style={{ background: C.goldbg, border: `1px solid ${C.goldL}`, borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.gold, marginBottom: 6, letterSpacing: 0.8 }}>YOUR STREETS</div>
                    <div style={{ fontSize: 13, color: C.text, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{r.description}</div>
                  </div>
                )}
              </div>
            );
          })()}

          <button onClick={() => onStart({ name: name.trim(), students: students.trim(), routeId, shift })}
            disabled={!name.trim() || !routeId}
            style={{
              width: '100%', padding: '16px', borderRadius: 10, border: 'none',
              background: (!name.trim() || !routeId) ? C.border : C.gold,
              color: (!name.trim() || !routeId) ? C.muted : C.white,
              fontSize: 20, fontFamily: fontHead, fontWeight: 700, letterSpacing: 1,
              cursor: (!name.trim() || !routeId) ? 'not-allowed' : 'pointer',
            }}>
            START COLLECTING →
          </button>
        </Card>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DRIVER SCREEN
══════════════════════════════════════════════════ */
function DriverScreen({ session, routes, donations, settings, progress, onAddDonation, onAddReport, onToggleStop, onBack }) {
  const [amount,       setAmount]      = useState('');
  const [type,         setType]        = useState('cash');
  const [address,      setAddress]     = useState('');
  const [suggestions,  setSuggestions] = useState([]);
  const [addrLoading,  setAddrLoading] = useState(false);
  const addrTimer = useRef(null);
  const [flash,        setFlash]       = useState(false);
  const [showReport,   setShowReport]  = useState(false);
  const [showSchedule, setShowSchedule]= useState(false);
  const [showMap,      setShowMap]     = useState(false);
  const [mapPoints,    setMapPoints]   = useState([]);
  const [mapLoading,   setMapLoading]  = useState(false);
  const [mapProgress,  setMapProgress] = useState(0);
  const mapInited = useRef(false);
  const leafletRef = useRef(null);
  const [reportType,   setReportType]  = useState('address');
  const [reportAddr,   setReportAddr]  = useState('');
  const [reportNote,   setReportNote]  = useState('');
  const [reportFlash,  setReportFlash] = useState(false);

  const route    = routes.find(r => r.id === session.routeId);
  const total    = donations.reduce((s, d) => s + Number(d.amount), 0);
  const cash     = donations.filter(d => d.type === 'cash').reduce((s, d) => s + Number(d.amount), 0);
  const check    = donations.filter(d => d.type === 'check').reduce((s, d) => s + Number(d.amount), 0);
  const canAdd   = amount && Number(amount) > 0;
  const stops    = route?.description ? route.description.split('\n').map(s => s.trim()).filter(Boolean) : [];
  const progKey  = `${session.routeId}_${session.shift}`;
  const checked  = progress[progKey] || [];
  const pctDone  = stops.length ? Math.round((checked.length / stops.length) * 100) : 0;

  const handleAdd = async () => {
    if (!canAdd) return;
    await onAddDonation({ amount: Number(amount), type, address: address.trim(), driverName: session.name, students: session.students });
    setAmount(''); setAddress(''); setSuggestions([]);
    setFlash(true); setTimeout(() => setFlash(false), 1800);
  };

  // Route-aware autocomplete: check stops first, fall back to Photon
  const handleAddressChange = (val) => {
    setAddress(val);
    setSuggestions([]);
    clearTimeout(addrTimer.current);
    if (val.trim().length < 2) return;
    const q = val.trim().toLowerCase();
    const localMatches = stops.filter(s => s.toLowerCase().includes(q));
    if (localMatches.length > 0) {
      setSuggestions(localMatches.slice(0, 5));
      return;
    }
    addrTimer.current = setTimeout(async () => {
      setAddrLoading(true);
      try {
        const city = settings.city || '';
        const qEnc = encodeURIComponent(`${val.trim()}${city ? ', ' + city : ''}`);
        const res = await fetch(`https://photon.komoot.io/api/?q=${qEnc}&limit=5`);
        const data = await res.json();
        const results = (data?.features || []).map(f => {
          const p = f.properties;
          const parts = [p.housenumber, p.street, p.city || p.town || p.village].filter(Boolean);
          return parts.join(' ');
        }).filter(Boolean);
        setSuggestions([...new Set(results)]);
      } catch {}
      setAddrLoading(false);
    }, 400);
  };

  const selectSuggestion = (s) => { setAddress(s); setSuggestions([]); };

  // Build route map — highlight streets using pre-computed endpoint coordinates
  const openRouteMap = async () => {
    // Destroy any stale Leaflet instance — the div is remounted each time the modal opens
    if (leafletRef.current) {
      try { leafletRef.current.remove(); } catch {}
      leafletRef.current = null;
    }
    setShowMap(true);
    setMapPoints([]);
    if (!stops.length) return;
    setMapLoading(true);
    setMapProgress(5);

    const city = settings.city || 'Midlothian, VA';

    // James River HS district bounding box — derived from official boundary file
    const BBOX = 'bbox=-77.696,37.477,-77.514,37.563';

    // Step 1: Geocode JRHS
    let jrhsCoords = { lat: 37.5185, lng: -77.6255 };
    try {
      const res  = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent('James River High School Midlothian VA')}&limit=1&${BBOX}`);
      const data = await res.json();
      if (data?.features?.[0]) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        jrhsCoords = { lat, lng };
      }
    } catch {}
    try {
      const res  = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent('James River High School Midlothian VA')}&limit=1&${BBOX}`);
      const data = await res.json();
      if (data?.features?.[0]) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        jrhsCoords = { lat, lng };
      }
    } catch {}

    setMapProgress(15);

    // Step 2: Get street endpoints — use pre-computed coords from route data if available,
    // otherwise fall back to Photon geocoding
    const streetCoords = [];
    const precomputed  = route?.streetCoords || [];

    for (let i = 0; i < stops.length; i++) {
      // Check if we have pre-computed endpoints from the Route Planner
      const pre = precomputed.find(s => s.name === stops[i]);
      if (pre?.startCoord && pre?.endCoord) {
        streetCoords.push({
          name:     stops[i],
          lat:      pre.startCoord.lat,
          lng:      pre.startCoord.lng,
          endLat:   pre.endCoord.lat,
          endLng:   pre.endCoord.lng,
          hasEnd:   true,
        });
        setMapProgress(15 + Math.round(((i + 1) / stops.length) * 60));
        continue;
      }
      if (pre?.startCoord) {
        streetCoords.push({ name: stops[i], lat: pre.startCoord.lat, lng: pre.startCoord.lng, hasEnd: false });
        setMapProgress(15 + Math.round(((i + 1) / stops.length) * 60));
        continue;
      }

      // Photon fallback for streets without pre-computed coords
      try {
        const q    = encodeURIComponent(`${stops[i]}, ${city}`);
        const res  = await fetch(`https://photon.komoot.io/api/?q=${q}&limit=3&${BBOX}`);
        const data = await res.json();
        const features = data?.features || [];
        let best = features[0];
        for (const f of features) {
          const p = f.properties;
          const street = (p.street || p.name || '').toLowerCase();
          const stopWords = stops[i].toLowerCase().split(' ');
          if (stopWords.some(w => w.length > 3 && street.includes(w))) { best = f; break; }
        }
        if (best) {
          const [lng, lat] = best.geometry.coordinates;
          streetCoords.push({ name: stops[i], lat, lng, hasEnd: false });
        }
      } catch {}
      setMapProgress(15 + Math.round(((i + 1) / stops.length) * 60));
      await new Promise(r => setTimeout(r, 250));
    }

    if (streetCoords.length === 0) {
      setMapLoading(false);
      return;
    }

    setMapProgress(78);

    const jrhsLat = jrhsCoords.lat, jrhsLng = jrhsCoords.lng;

    // Step 3: Fetch road geometry one street at a time via serverless proxy
    const streetGeometries = [];
    for (let i = 0; i < streetCoords.length; i++) {
      const s = streetCoords[i];
      const query = `[out:json][timeout:15];way["name"="${s.name.replace(/"/g, '')}"](around:6000,${jrhsLat},${jrhsLng});out body geom;`;
      let segments = null;
      try {
        const res  = await fetch('/api/overpass', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ query }),
        });
        const data = await res.json();
        console.log(`${s.name}: ${data.elements?.length} elements`);
        const segs = [];
        (data.elements || []).forEach(el => {
          if (!el.geometry?.length) return;
          const pts = el.geometry.map(g => [g.lat, g.lon]);
          if (pts.length >= 2) segs.push(pts);
        });
        if (segs.length > 0) segments = segs;
      } catch (e) {
        console.warn(`Failed to fetch ${s.name}:`, e);
      }
      // Fallback to straight line
      if (!segments) {
        segments = s.hasEnd
          ? [[s.lat, s.lng], [s.endLat, s.endLng]]
          : [[s.lat, s.lng]];
        segments = [segments];
      }
      streetGeometries.push({ ...s, segments });
      setMapProgress(78 + Math.round(((i + 1) / streetCoords.length) * 20));
    }

    setMapProgress(100);
    setMapPoints({ streetGeometries, jrhsCoords });
    setMapLoading(false);
  };

  // Render Leaflet map — draw each street using Overpass road geometry
  useEffect(() => {
    if (!showMap || mapLoading || !mapPoints?.streetGeometries) return;
    injectLeaflet().then(() => {
      const container = document.getElementById('driver-route-map');
      if (!container) return;
      let map = leafletRef.current;
      if (!map) {
        map = window.L.map('driver-route-map').setView([37.519, -77.625], 14);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap', maxZoom: 19,
        }).addTo(map);
        leafletRef.current = map;
      }
      map.eachLayer(l => {
        if (l instanceof window.L.Marker || l instanceof window.L.Polyline || l instanceof window.L.CircleMarker)
          map.removeLayer(l);
      });

      const { streetGeometries, jrhsCoords } = mapPoints;
      const bounds = [];

      // JRHS school marker
      const schoolIcon = window.L.divIcon({
        className: '',
        html: `<div style="width:36px;height:36px;border-radius:50%;background:#333;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.4)">🏫</div>`,
        iconSize: [36,36], iconAnchor: [18,18],
      });
      window.L.marker([jrhsCoords.lat, jrhsCoords.lng], { icon: schoolIcon })
        .addTo(map).bindPopup('<b>James River High School</b>');

      streetGeometries.forEach((s, i) => {
        const segs = s.segments || [];

        // Draw all road segments for this street
        segs.forEach(seg => {
          if (seg.length >= 2) {
            window.L.polyline(seg, { color: C.navy, weight: 6, opacity: 0.85 })
              .addTo(map)
              .bindPopup(`<div style="font-family:sans-serif;font-size:13px"><b>${s.name}</b></div>`);
            seg.forEach(p => bounds.push(p));
          }
        });

        // Numbered label at midpoint of first segment
        const firstSeg = segs[0] || [];
        const mid = firstSeg[Math.floor((firstSeg.length - 1) / 2)] || [s.lat, s.lng];
        const icon = window.L.divIcon({
          className: '',
          html: `<div style="width:26px;height:26px;border-radius:50%;background:${C.gold};border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${i+1}</div>`,
          iconSize: [26,26], iconAnchor: [13,13],
        });
        window.L.marker(mid, { icon }).addTo(map)
          .bindPopup(`<div style="font-family:sans-serif;font-size:13px"><b>${i+1}. ${s.name}</b></div>`);
      });

      if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40] });
    });
  }, [showMap, mapLoading, mapPoints]);

  const handleReport = async () => {
    if (!reportNote.trim()) return;
    await onAddReport({
      type: reportType,
      address: reportAddr.trim(),
      note: reportNote.trim(),
      driverName: session.name,
      routeId: session.routeId,
      shift: session.shift,
    });
    setReportAddr(''); setReportNote(''); setReportType('address');
    setReportFlash(true);
    setTimeout(() => { setReportFlash(false); setShowReport(false); }, 1500);
  };

  const dnv = route?.doNotVisit ? route.doNotVisit.trim() : '';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>
      {/* Issue Report Modal */}
      {showReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: C.white, borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 480, boxSizing: 'border-box' }}>
            <div style={{ fontFamily: fontHead, fontSize: 22, color: C.navy, fontWeight: 700, marginBottom: 20 }}>🚩 Report an Issue</div>
            <div style={{ marginBottom: 14 }}>
              <Label>Issue Type</Label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { k: 'address',      label: '🏠 Skip Address' },
                  { k: 'neighborhood', label: '🚧 Area Challenge' },
                  { k: 'other',        label: '📝 Other' },
                ].map(t => (
                  <button key={t.k} onClick={() => setReportType(t.k)} style={{
                    padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: font, fontWeight: 600, fontSize: 13,
                    background: reportType === t.k ? C.redbg : C.bg,
                    color:      reportType === t.k ? C.red   : C.muted,
                    border:     `2px solid ${reportType === t.k ? C.red : C.border}`,
                  }}>{t.label}</button>
                ))}
              </div>
            </div>
            {reportType === 'address' && (
              <div style={{ marginBottom: 14 }}>
                <Label>Address</Label>
                <TextInput value={reportAddr} onChange={setReportAddr} placeholder="e.g. 123 Oak Street" />
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <Label>Details</Label>
              <textarea value={reportNote} onChange={e => setReportNote(e.target.value)}
                placeholder={reportType === 'address' ? 'Why to skip — hostile, no answer, no soliciting sign…' : reportType === 'neighborhood' ? 'Describe the challenge…' : 'Describe the issue…'}
                style={{ width: '100%', height: 90, padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: font, resize: 'none', boxSizing: 'border-box', color: C.text, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn onClick={() => setShowReport(false)} variant="ghost" style={{ flex: 1 }}>Cancel</Btn>
              <button onClick={handleReport} disabled={!reportNote.trim()} style={{
                flex: 2, padding: '13px', borderRadius: 10, border: 'none',
                background: reportFlash ? C.green : (!reportNote.trim() ? C.border : C.red),
                color: C.white, fontSize: 17, fontFamily: fontHead, fontWeight: 700, letterSpacing: 0.5,
                cursor: !reportNote.trim() ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}>
                {reportFlash ? '✓ Reported!' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showSchedule && settings.schedule && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: C.white, borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, boxSizing: 'border-box' }}>
            <div style={{ fontFamily: fontHead, fontSize: 24, color: C.navy, fontWeight: 700, marginBottom: 16 }}>📅 Today's Schedule</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {settings.schedule.split('\n').map((item, i) => item.trim()).filter(Boolean).map((item, i) => {
                const parts = item.split('—');
                const time  = parts.length > 1 ? parts[0].trim() : null;
                const desc  = parts.length > 1 ? parts.slice(1).join('—').trim() : item;
                const isLunch = desc.toLowerCase().includes('lunch') || desc.toLowerCase().includes('return');
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: isLunch ? C.goldbg : C.bg, borderRadius: 8, border: isLunch ? `1.5px solid ${C.goldL}` : 'none' }}>
                    {time && <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, whiteSpace: 'nowrap', minWidth: 60 }}>{time}</div>}
                    <div style={{ fontSize: 13, color: C.text, fontWeight: isLunch ? 700 : 400 }}>{desc}{isLunch ? ' ⚠️' : ''}</div>
                  </div>
                );
              })}
            </div>
            <Btn onClick={() => setShowSchedule(false)} variant="gold" style={{ width: '100%' }}>Close</Btn>
          </div>
        </div>
      )}

      {/* Route Map Modal */}
      {showMap && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: C.navy, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: fontHead, fontSize: 20, color: C.white, fontWeight: 700 }}>🗺 Route Map</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{route?.name}</div>
            </div>
            <button onClick={() => setShowMap(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: C.white, cursor: 'pointer', fontSize: 15, fontWeight: 700, fontFamily: font, padding: '8px 14px' }}>✕ Close</button>
          </div>

          {mapLoading && (
            <div style={{ background: C.white, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, background: C.border, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: C.navy, borderRadius: 4, width: `${mapProgress}%`, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 13, color: C.muted, minWidth: 80 }}>Mapping… {mapProgress}%</div>
            </div>
          )}

          {!mapLoading && mapPoints.length > 0 && (
            <div style={{ background: C.white, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <a
                href={`https://www.google.com/maps/dir/${JRHS.lat},${JRHS.lng}/${mapPoints[0].points[0].lat},${mapPoints[0].points[0].lng}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: C.navy, color: C.white, textDecoration: 'none',
                  padding: '9px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: font,
                }}
              >
                📍 Get Directions to Start
              </a>
              <div style={{ fontSize: 12, color: C.muted }}>From James River HS → {mapPoints[0].name}</div>
            </div>
          )}

          {!mapLoading && mapPoints.length === 0 && stops.length > 0 && (
            <div style={{ background: C.white, padding: '16px', textAlign: 'center', fontSize: 14, color: C.muted }}>
              Could not geocode streets. Make sure City/Town is set in Admin → Settings.
            </div>
          )}

          <div id="driver-route-map" style={{ flex: 1 }} />
        </div>
      )}

      {/* Header */}
      <div style={{ background: C.navy, padding: '16px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.white, cursor: 'pointer', fontSize: 22 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: fontHead, fontSize: 20, color: C.white, fontWeight: 700 }}>{route?.name || 'My Route'}</div>
            <div style={{ fontSize: 13, color: C.goldL }}>{session.name}{session.students ? ` · ${session.students}` : ''} · {session.shift} Shift</div>
          </div>
          {settings.schedule && (
            <button onClick={() => setShowSchedule(true)} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, color: C.white, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: font, padding: '7px 12px' }}>
              📅 Schedule
            </button>
          )}
          {stops.length > 0 && (
            <button onClick={openRouteMap} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, color: C.white, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: font, padding: '7px 12px' }}>
              🗺 Map
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: stops.length ? 14 : 0 }}>
          {[
            { label: 'Total', val: fmt$(total), hi: true },
            { label: 'Cash',  val: fmt$(cash),  hi: false },
            { label: 'Check', val: fmt$(check), hi: false },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 3, letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontFamily: fontHead, fontSize: s.hi ? 24 : 20, color: C.white, fontWeight: 700 }}>{s.val}</div>
            </div>
          ))}
        </div>

        {stops.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>ROUTE PROGRESS</div>
              <div style={{ fontSize: 12, color: C.white, fontWeight: 700 }}>{checked.length}/{stops.length} streets · {pctDone}%</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 4, background: C.gold, width: `${pctDone}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>

        {/* Broadcast Alert */}
        {settings.broadcast && settings.broadcast.trim() && (
          <div style={{ background: '#0D3321', border: '2px solid #964B8C', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#D4A8D0', letterSpacing: 0.8, marginBottom: 5 }}>📢 ALERT FROM ADMIN</div>
            <div style={{ fontSize: 14, color: '#F7EFF6', fontWeight: 600, lineHeight: 1.5 }}>{settings.broadcast}</div>
          </div>
        )}

        {/* Do Not Visit Banner */}
        {dnv && (
          <div style={{ background: C.redbg, border: `1.5px solid ${C.red}`, borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.red, letterSpacing: 0.8, marginBottom: 6 }}>⛔ DO NOT VISIT THESE ADDRESSES</div>
            <div style={{ fontSize: 13, color: C.red, whiteSpace: 'pre-line', lineHeight: 1.7 }}>{dnv}</div>
          </div>
        )}

        {/* Route Checklist */}
        {stops.length > 0 && (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>
              🗺 Your Streets — tap each when done
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stops.map((stop, i) => {
                const done = checked.includes(i);
                return (
                  <button key={i} onClick={() => onToggleStop(progKey, i, checked)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 8, border: `1.5px solid ${done ? C.green : C.border}`,
                    background: done ? C.green : C.white, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                      background: done ? C.white : C.white,
                      border: `2px solid ${done ? C.white : C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {done && <span style={{ color: C.green, fontSize: 13, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: done ? C.white : C.text, textDecoration: done ? 'line-through' : 'none' }}>{stop}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Report Issue Button */}
        <button onClick={() => setShowReport(true)} style={{
          width: '100%', marginBottom: 14, padding: '11px', borderRadius: 9, border: `1.5px solid ${C.border}`,
          background: C.white, color: C.muted, fontFamily: font, fontWeight: 600, fontSize: 14,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          🚩 Report an Issue
        </button>

        {/* Donation Form */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 18 }}>Log Donation</div>

          <div style={{ marginBottom: 14 }}>
            <Label>Amount</Label>
            <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <span style={{ padding: '11px 14px', background: C.bg, color: C.muted, fontWeight: 700, borderRight: `1px solid ${C.border}`, fontSize: 16 }}>$</span>
              <input
                type="number" min="0" step="0.01" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                style={{ flex: 1, padding: '11px 14px', border: 'none', fontSize: 22, fontFamily: font, fontWeight: 700, color: C.text, outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <Label>Payment Type</Label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ k: 'cash', label: '💵 Cash' }, { k: 'check', label: '📝 Check' }].map(t => (
                <button key={t.k} onClick={() => setType(t.k)} style={{
                  flex: 1, padding: '11px', borderRadius: 8, cursor: 'pointer', fontFamily: font, fontWeight: 600, fontSize: 15,
                  background: type === t.k ? (t.k === 'cash' ? C.green : C.navy) : C.white,
                  color:      type === t.k ? C.white : C.muted,
                  border:     `2px solid ${type === t.k ? (t.k === 'cash' ? C.green : C.navy) : C.border}`,
                  transition: 'all 0.15s',
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18, position: 'relative' }}>
            <Label>Address <span style={{ color: C.border, fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(optional)</span></Label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={address}
                onChange={e => handleAddressChange(e.target.value)}
                onBlur={() => setTimeout(() => setSuggestions([]), 200)}
                placeholder="e.g. 123 Oak Street"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: font,
                  color: C.text, background: C.white, boxSizing: 'border-box', outline: 'none',
                }}
              />
              {addrLoading && (
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C.muted }}>
                  searching…
                </div>
              )}
            </div>
            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden', marginTop: 2,
              }}>
                {suggestions.map((s, i) => (
                  <button key={i} onMouseDown={() => selectSuggestion(s)} style={{
                    width: '100%', padding: '11px 14px', textAlign: 'left', border: 'none',
                    borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : 'none',
                    background: C.white, cursor: 'pointer', fontFamily: font, fontSize: 14, color: C.text,
                  }}
                  onMouseEnter={e => e.target.style.background = C.bg}
                  onMouseLeave={e => e.target.style.background = C.white}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleAdd} disabled={!canAdd} style={{
            width: '100%', padding: '15px', borderRadius: 10, border: 'none',
            background: flash ? C.green : (canAdd ? C.gold : C.border),
            color: C.white,
            fontSize: 20, fontFamily: fontHead, fontWeight: 700, letterSpacing: 1,
            cursor: canAdd ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s, color 0.2s',
          }}>
            {flash ? '✓ SAVED!' : 'ADD DONATION'}
          </button>
        </Card>

        {/* Donation List */}
        {settings.surveyUrl && (
          <a href={settings.surveyUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div style={{
              background: C.navy, borderRadius: 12, padding: '18px 20px', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div>
                <div style={{ fontFamily: fontHead, fontSize: 18, color: C.gold, fontWeight: 700, letterSpacing: 0.5 }}>📋  SHARE YOUR FEEDBACK</div>
                <div style={{ fontSize: 13, color: C.goldL, marginTop: 4 }}>Take our short driver survey — tap to open</div>
              </div>
              <div style={{ color: C.gold, fontSize: 22, flexShrink: 0 }}>→</div>
            </div>
          </a>
        )}

        {donations.length > 0 ? (
          <Card>
            <div style={{ fontWeight: 600, fontSize: 13, color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {donations.length} Donation{donations.length !== 1 ? 's' : ''} This Shift
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...donations].reverse().map((d, i) => (
                <div key={d.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: C.bg, borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>{d.address || 'Address not recorded'}</div>
                    <Badge color={d.type === 'cash' ? 'green' : 'navy'}>{d.type}</Badge>
                  </div>
                  <div style={{ fontFamily: fontHead, fontSize: 22, color: C.navy, fontWeight: 700 }}>{fmt$(d.amount)}</div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: C.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎺</div>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Ready to collect!</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>Your donations will appear here</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ADMIN LOGIN
══════════════════════════════════════════════════ */
function AdminLogin({ settings, onSuccess, onBack }) {
  const [pin,   setPin]   = useState('');
  const [error, setError] = useState(false);

  const press = (k) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); setError(false); return; }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      if (next === (settings.adminPin || '1234')) { onSuccess(); }
      else { setError(true); setTimeout(() => { setPin(''); setError(false); }, 700); }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font, display: 'flex', flexDirection: 'column' }}>
      <Header title="ADMIN ACCESS" onBack={onBack} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontFamily: fontHead, fontSize: 16, color: C.muted, marginBottom: 28, letterSpacing: 2 }}>ENTER PIN</div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: '50%',
              background: i < pin.length ? (error ? C.red : C.navy) : C.border,
              transition: 'background 0.15s',
            }} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: 250 }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
            <button key={i} onClick={() => k && press(k)} style={{
              padding: '18px 0', borderRadius: 10, cursor: k ? 'pointer' : 'default',
              border: `1.5px solid ${C.border}`,
              background: k === '⌫' ? C.bg : C.white,
              fontFamily: fontHead, fontSize: 24, fontWeight: 700,
              color: k ? C.navy : 'transparent',
            }}>{k}</button>
          ))}
        </div>

        <div style={{ marginTop: 24, fontSize: 13, color: C.muted }}>Default PIN: 1234 — change in Settings</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════ */
function Dashboard({ donations, routes, reports, progress, settings, onClear, onClearReports }) {
  const total = donations.reduce((s, d) => s + Number(d.amount), 0);
  const cash  = donations.filter(d => d.type === 'cash').reduce((s, d) => s + Number(d.amount), 0);
  const check = donations.filter(d => d.type === 'check').reduce((s, d) => s + Number(d.amount), 0);

  const shifts = settings.shifts || ['Morning', 'Afternoon'];
  const byShift = shifts.map(sh => ({
    sh,
    total: donations.filter(d => d.shift === sh).reduce((s, d) => s + Number(d.amount), 0),
    count: donations.filter(d => d.shift === sh).length,
  }));

  const byRoute = routes.map(r => {
    const rd = donations.filter(d => d.routeId === r.id);
    return { ...r, total: rd.reduce((s, d) => s + Number(d.amount), 0), count: rd.length };
  }).filter(r => r.count > 0).sort((a, b) => b.total - a.total);

  return (
    <div>
      {/* Grand total hero */}
      <Card style={{ background: C.navy, border: 'none', textAlign: 'center', marginBottom: 16 }}>
        <div style={{ color: C.goldL, fontSize: 12, fontWeight: 600, letterSpacing: 1.5, marginBottom: 6 }}>TOTAL RAISED</div>
        <div style={{ fontFamily: fontHead, fontSize: 58, color: C.gold, fontWeight: 700, lineHeight: 1 }}>{fmt$(total)}</div>
        <div style={{ color: C.goldL, fontSize: 14, marginTop: 8 }}>{donations.length} donations</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 16 }}>
          {[{ l: 'CASH', v: cash }, { l: 'CHECK', v: check }].map(x => (
            <div key={x.l} style={{ textAlign: 'center' }}>
              <div style={{ color: C.goldL, fontSize: 11, letterSpacing: 1 }}>{x.l}</div>
              <div style={{ fontFamily: fontHead, fontSize: 24, color: C.white, fontWeight: 700 }}>{fmt$(x.v)}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* By Shift */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {byShift.map(s => (
          <Card key={s.sh}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.8, marginBottom: 4 }}>{s.sh.toUpperCase()}</div>
            <div style={{ fontFamily: fontHead, fontSize: 30, color: C.navy, fontWeight: 700 }}>{fmt$(s.total)}</div>
            <div style={{ fontSize: 13, color: C.muted }}>{s.count} donations</div>
          </Card>
        ))}
      </div>

      {/* By Route */}
      {byRoute.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: 0.8, marginBottom: 12, textTransform: 'uppercase' }}>By Route</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {byRoute.map(r => {
              const stops   = r.description ? r.description.split('\n').filter(Boolean).length : 0;
              const pKey    = `${r.id}_${settings.shifts?.[0] || 'Morning'}`;
              const pKey2   = `${r.id}_${settings.shifts?.[1] || 'Afternoon'}`;
              const chk     = (progress[pKey] || []).length + (progress[pKey2] || []).length;
              const pct     = stops ? Math.round((Math.min(chk, stops) / stops) * 100) : null;
              return (
                <div key={r.id} style={{ padding: '10px 12px', background: C.bg, borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: pct !== null ? 8 : 0 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{r.shift} · {r.count} donations</div>
                    </div>
                    <div style={{ fontFamily: fontHead, fontSize: 22, color: C.navy, fontWeight: 700 }}>{fmt$(r.total)}</div>
                  </div>
                  {pct !== null && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ fontSize: 11, color: C.muted }}>Route progress</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? C.green : C.navy }}>{pct}% · {Math.min(chk, stops)}/{stops} streets</div>
                      </div>
                      <div style={{ background: C.border, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, background: pct === 100 ? C.green : C.gold, width: `${pct}%`, transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* All Donations */}
      {donations.length > 0 ? (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase' }}>All Donations</div>
            <button onClick={() => { if (window.confirm('Clear ALL donations? This cannot be undone.')) onClear(); }}
              style={{ background: C.redbg, color: C.red, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
              Clear All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
            {[...donations].reverse().map((d, i) => {
              const r = routes.find(x => x.id === d.routeId);
              return (
                <div key={d.id || i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '9px 11px', background: C.bg, borderRadius: 8, fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: C.text, marginBottom: 2 }}>{d.driverName}{d.students ? ` · ${d.students}` : ''} · {r?.name || '—'}</div>
                    <div style={{ color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {d.address || 'No address'} · <Badge color={d.type === 'cash' ? 'green' : 'navy'}>{d.type}</Badge> · {d.shift}
                    </div>
                  </div>
                  <div style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, fontWeight: 700, alignSelf: 'center' }}>{fmt$(d.amount)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🥁</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>No donations yet</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>They'll appear here as drivers log them</div>
        </div>
      )}

      {/* Reports */}
      <Card style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.red, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            🚩 Driver Reports {reports.length > 0 && <span style={{ background: C.redbg, borderRadius: 10, padding: '1px 8px', marginLeft: 6 }}>{reports.length}</span>}
          </div>
          {reports.length > 0 && (
            <button onClick={() => { if (window.confirm('Clear all reports?')) onClearReports(); }}
              style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
              Clear
            </button>
          )}
        </div>
        {reports.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 14, textAlign: 'center', padding: '16px 0' }}>No issues reported yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            {[...reports].reverse().map((rep, i) => {
              const r = routes.find(x => x.id === rep.routeId);
              const typeLabel = rep.type === 'address' ? '🏠 Skip Address' : rep.type === 'neighborhood' ? '🚧 Area Challenge' : '📝 Other';
              return (
                <div key={rep.id || i} style={{ padding: '10px 12px', background: C.redbg, borderRadius: 8, border: `1px solid #f5c6cb` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.red }}>{typeLabel}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{rep.driverName} · {r?.name || '—'} · {rep.shift}</div>
                  </div>
                  {rep.address && <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{rep.address}</div>}
                  <div style={{ fontSize: 13, color: C.text }}>{rep.note}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ROUTES TAB
══════════════════════════════════════════════════ */
function RoutesTab({ routes, settings, onUpdate }) {
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ name: '', shift: '', description: '' });
  const shifts = settings.shifts || ['Morning', 'Afternoon'];

  const openNew = () => {
    setForm({ name: '', shift: shifts[0], description: '', doNotVisit: '' });
    setEditing('new');
  };
  const openEdit = (r) => {
    setForm({ name: r.name, shift: r.shift, description: r.description || '', doNotVisit: r.doNotVisit || '' });
    setEditing(r);
  };
  const save = async () => {
    if (!form.name.trim()) return;
    const next = editing === 'new'
      ? [...routes, { id: genId(), ...form }]
      : routes.map(r => r.id === editing.id ? { ...r, ...form } : r);
    await onUpdate(next);
    setEditing(null);
  };
  const del = async (id) => {
    if (!window.confirm('Delete this route?')) return;
    await onUpdate(routes.filter(r => r.id !== id));
  };

  if (editing) return (
    <Card>
      <div style={{ fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 20 }}>
        {editing === 'new' ? 'Add Route' : 'Edit Route'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Label>Route Name</Label>
          <TextInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Route 12 — Oak Hill" />
        </div>
        <div>
          <Label>Shift</Label>
          <div style={{ display: 'flex', gap: 10 }}>
            {shifts.map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, shift: s }))} style={{
                flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontFamily: font, fontWeight: 600, fontSize: 15,
                background: form.shift === s ? C.navy : C.white,
                color: form.shift === s ? C.white : C.muted,
                border: `2px solid ${form.shift === s ? C.navy : C.border}`,
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <Label>Streets / Description <span style={{ color: C.border, fontWeight: 400, textTransform: 'none' }}>(drivers will see this)</span></Label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder={"Enter streets one per line:\nMaple Street\nOak Avenue\nElm Court"}
            style={{ width: '100%', height: 150, padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: font, resize: 'vertical', boxSizing: 'border-box', color: C.text, outline: 'none' }}
          />
        </div>
        <div>
          <Label style={{ color: C.red }}>⛔ Do Not Visit <span style={{ color: C.border, fontWeight: 400, textTransform: 'none' }}>(drivers will see a red warning)</span></Label>
          <textarea value={form.doNotVisit} onChange={e => setForm(f => ({ ...f, doNotVisit: e.target.value }))}
            placeholder={"Enter addresses one per line:\n123 Oak Street\n456 Elm Avenue"}
            style={{ width: '100%', height: 100, padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${C.red}`, fontSize: 14, fontFamily: font, resize: 'vertical', boxSizing: 'border-box', color: C.text, outline: 'none', background: C.redbg }}
          />
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>These will be shown prominently to drivers before and during collection</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={() => setEditing(null)} variant="ghost" style={{ flex: 1 }}>Cancel</Btn>
          <Btn onClick={save} variant="gold" disabled={!form.name.trim()} style={{ flex: 2 }}>
            {editing === 'new' ? 'Add Route' : 'Save Changes'}
          </Btn>
        </div>
      </div>
    </Card>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: C.muted }}>{routes.length} of up to 60 routes</div>
        <Btn onClick={openNew} variant="gold">+ Add Route</Btn>
      </div>

      {shifts.map(sh => {
        const sr = routes.filter(r => r.shift === sh);
        return (
          <div key={sh} style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, fontWeight: 700, marginBottom: 10, letterSpacing: 0.5 }}>
              {sh} Shift <span style={{ fontSize: 14, color: C.muted, fontFamily: font, fontWeight: 400 }}>({sr.length})</span>
            </div>
            {sr.length === 0 ? (
              <div style={{ padding: '20px', background: C.bg, borderRadius: 10, color: C.muted, textAlign: 'center', fontSize: 14 }}>
                No {sh.toLowerCase()} routes yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sr.map(r => (
                  <Card key={r.id} style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{r.name}</div>
                        {r.description && (
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                            {r.description.split('\n').slice(0, 3).join(' · ')}{r.description.split('\n').length > 3 ? '…' : ''}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
                        <button onClick={() => openEdit(r)} style={{ background: C.bg, border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: C.navy, fontWeight: 600, fontFamily: font }}>Edit</button>
                        <button onClick={() => del(r.id)} style={{ background: C.redbg, border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: C.red, fontFamily: font, fontSize: 14 }}>✕</button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SETTINGS TAB
══════════════════════════════════════════════════ */
function SettingsTab({ settings, onUpdate }) {
  const [form,  setForm]  = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await onUpdate(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20 }}>Event Settings</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <Label>Event Name</Label>
          <TextInput value={form.eventName || ''} onChange={v => setForm(f => ({ ...f, eventName: v }))} placeholder="Tag Day 2025" />
        </div>
        <div>
          <Label>Admin PIN</Label>
          <TextInput value={form.adminPin || '1234'} onChange={v => setForm(f => ({ ...f, adminPin: v }))} placeholder="1234" style={{ maxWidth: 140 }} />
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Share only with band parents managing the event</div>
        </div>
        <div>
          <Label>Shift Names</Label>
          <div style={{ display: 'flex', gap: 10 }}>
            {(form.shifts || ['Morning', 'Afternoon']).map((s, i) => (
              <TextInput key={i} value={s} onChange={v => {
                const sh = [...(form.shifts || ['Morning', 'Afternoon'])];
                sh[i] = v;
                setForm(f => ({ ...f, shifts: sh }));
              }} placeholder={`Shift ${i + 1}`} style={{ flex: 1 }} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Customize shift labels (e.g. "AM / PM" or "9am–1pm / 1pm–5pm")</div>
        </div>
        <div>
          <Label>📢 Broadcast Alert <span style={{ color: C.border, fontWeight: 400, textTransform: 'none' }}>(shown to all drivers immediately)</span></Label>
          <textarea value={form.broadcast || ''} onChange={e => setForm(f => ({ ...f, broadcast: e.target.value }))}
            placeholder="e.g. ⛈️ Weather delay — hold at current location until further notice"
            style={{ width: '100%', height: 80, padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: font, resize: 'vertical', boxSizing: 'border-box', color: C.text, outline: 'none' }}
          />
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Clear this field to dismiss the alert. Drivers see it every time they open the app.</div>
        </div>
        <div>
          <Label>📅 Day Schedule <span style={{ color: C.border, fontWeight: 400, textTransform: 'none' }}>(shown on driver screen)</span></Label>
          <textarea value={form.schedule || ''} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
            placeholder={"One item per line, e.g.:\n8:30am — Driver check-in at the school\n9:00am — Morning shift departs\n12:00pm — Return for lunch (MANDATORY)\n1:00pm — Afternoon shift departs\n5:00pm — All drivers return"}
            style={{ width: '100%', height: 130, padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: font, resize: 'vertical', boxSizing: 'border-box', color: C.text, outline: 'none' }}
          />
        </div>
        <div>
          <Label>City / Town <span style={{ color: C.border, fontWeight: 400, textTransform: 'none' }}>(for donation map)</span></Label>
          <TextInput value={form.city || ''} onChange={v => setForm(f => ({ ...f, city: v }))} placeholder="e.g. Chesterfield, VA" />
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Used to geocode donor addresses accurately on the map</div>
        </div>
        <div>
          <Label>Driver Survey URL <span style={{ color: C.border, fontWeight: 400, textTransform: 'none' }}>(optional)</span></Label>
          <TextInput value={form.surveyUrl || ''} onChange={v => setForm(f => ({ ...f, surveyUrl: v }))} placeholder="https://forms.google.com/..." />
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>When set, drivers will see a survey link at the bottom of their donation screen</div>
        </div>
        <Btn onClick={save} variant="gold" style={{ alignSelf: 'flex-start', minWidth: 140 }}>
          {saved ? '✓ Saved!' : 'Save Settings'}
        </Btn>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   MAP TAB
══════════════════════════════════════════════════ */

// Route palette — up to 12 distinct colors
const ROUTE_COLORS = [
  '#e63946','#2a9d8f','#e9c46a','#264653','#f4a261','#6a4c93',
  '#1982c4','#8ac926','#ff595e','#6a994e','#bc6c25','#457b9d'
];

function injectLeaflet() {
  return new Promise((resolve) => {
    if (window.L) { resolve(); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    js.onload = resolve;
    document.head.appendChild(js);
  });
}

async function geocode(address, city) {
  const q = encodeURIComponent(`${address}, ${city}`);
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${q}&limit=1`);
    const data = await res.json();
    if (data?.features?.[0]) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      return { lat, lng };
    }
  } catch {}
  return null;
}

function MapTab({ donations, routes, settings }) {
  const mapRef      = useState(null);
  const leafletMap  = useState(null);
  const [geocoded,  setGeocoded]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [mounted,   setMounted]   = useState(false);
  const containerId = 'td-leaflet-map';

  // Route color lookup
  const routeColor = (routeId) => {
    const idx = routes.findIndex(r => r.id === routeId);
    return ROUTE_COLORS[idx % ROUTE_COLORS.length] || '#999';
  };

  // Route leaderboard
  const routeStats = routes.map(r => {
    const rd = donations.filter(d => d.routeId === r.id);
    return { ...r, total: rd.reduce((s, d) => s + Number(d.amount), 0), count: rd.length, color: routeColor(r.id) };
  }).filter(r => r.count > 0).sort((a, b) => b.total - a.total);

  const maxTotal = routeStats[0]?.total || 1;

  // Geocode donations with addresses
  const runGeocode = async () => {
    if (!settings.city) return;
    const withAddr = donations.filter(d => d.address && d.address.trim());
    if (!withAddr.length) return;
    setLoading(true);
    setProgress(0);
    const results = [];
    for (let i = 0; i < withAddr.length; i++) {
      const d = withAddr[i];
      const coords = await geocode(d.address, settings.city);
      if (coords) results.push({ ...d, ...coords });
      setProgress(Math.round(((i + 1) / withAddr.length) * 100));
      await new Promise(r => setTimeout(r, 1100)); // Nominatim rate limit: 1 req/sec
    }
    setGeocoded(results);
    setLoading(false);
  };

  // Init map
  useEffect(() => {
    let map = null;
    injectLeaflet().then(() => {
      if (document.getElementById(containerId)?._leaflet_id) return;
      map = window.L.map(containerId, { zoomControl: true }).setView([38.5, -77.4], 12);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19
      }).addTo(map);
      leafletMap[1](map);
      setMounted(true);
    });
    return () => { if (map) { map.remove(); } };
  }, []);

  // Update markers when geocoded data changes
  useEffect(() => {
    const map = leafletMap[0];
    if (!map || !window.L || !geocoded.length) return;
    // Clear existing markers
    map.eachLayer(l => { if (l instanceof window.L.CircleMarker) map.removeLayer(l); });
    const bounds = [];
    geocoded.forEach(d => {
      const color = routeColor(d.routeId);
      const r     = routes.find(x => x.id === d.routeId);
      const size  = Math.max(8, Math.min(28, Math.sqrt(Number(d.amount)) * 3));
      const marker = window.L.circleMarker([d.lat, d.lng], {
        radius: size / 2, fillColor: color, color: '#fff',
        weight: 2, opacity: 1, fillOpacity: 0.82,
      }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:sans-serif;min-width:140px">
          <div style="font-weight:700;font-size:15px;color:${color}">$${Number(d.amount).toFixed(2)}</div>
          <div style="font-size:12px;color:#555;margin-top:2px">${d.address}</div>
          <div style="font-size:12px;color:#888;margin-top:4px">${r?.name || ''} · ${d.type} · ${d.shift}</div>
        </div>
      `);
      bounds.push([d.lat, d.lng]);
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });
  }, [geocoded, mounted]);

  const withAddr = donations.filter(d => d.address && d.address.trim()).length;

  return (
    <div>
      {/* Route Leaderboard */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: fontHead, fontSize: 18, color: C.navy, fontWeight: 700, letterSpacing: 0.5, marginBottom: 14 }}>
          Route Performance
        </div>
        {routeStats.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No donations recorded yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {routeStats.map((r, i) => (
              <div key={r.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{r.name}</span>
                    {i === 0 && <span style={{ fontSize: 11, background: C.goldL, color: C.navy, borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>🏆 TOP</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>{r.count} donations</span>
                    <span style={{ fontFamily: fontHead, fontSize: 18, fontWeight: 700, color: C.navy }}>{fmt$(r.total)}</span>
                  </div>
                </div>
                <div style={{ background: C.bg, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4, background: r.color,
                    width: `${(r.total / maxTotal) * 100}%`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Map */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontFamily: fontHead, fontSize: 18, color: C.navy, fontWeight: 700 }}>Donation Map</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {settings.city ? `Geocoding against: ${settings.city}` : 'Set your city in Settings to enable geocoding'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {loading && (
              <div style={{ fontSize: 13, color: C.muted }}>Geocoding… {progress}%</div>
            )}
            <button
              onClick={runGeocode}
              disabled={loading || !settings.city || withAddr === 0}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: (!settings.city || withAddr === 0) ? C.border : C.navy,
                color: (!settings.city || withAddr === 0) ? C.muted : C.white,
                fontSize: 13, fontWeight: 600, fontFamily: font,
                cursor: (!settings.city || withAddr === 0 || loading) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Loading…' : `Plot ${withAddr} Address${withAddr !== 1 ? 'es' : ''}`}
            </button>
          </div>
        </div>

        {!settings.city && (
          <div style={{ padding: '16px', background: C.goldbg, fontSize: 13, color: C.text }}>
            💡 Go to <strong>Settings</strong> and enter your city/town so the map can geocode donor addresses.
          </div>
        )}
        {settings.city && withAddr === 0 && (
          <div style={{ padding: '16px', background: C.bg, fontSize: 13, color: C.muted, textAlign: 'center' }}>
            No donations with addresses yet. Addresses entered by drivers will appear here.
          </div>
        )}

        <div id={containerId} style={{ height: 400, width: '100%' }} />

        {geocoded.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {routeStats.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.muted }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />
                {r.name}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ADMIN SCREEN (shell)
══════════════════════════════════════════════════ */
function AdminScreen({ routes, donations, reports, progress, settings, onUpdateRoutes, onUpdateDonations, onUpdateReports, onUpdateSettings, onBack, tab, setTab }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>
      <Header title="ADMIN PANEL" subtitle={settings.eventName} onBack={onBack} />

      <div style={{ display: 'flex', borderBottom: `2px solid ${C.border}`, background: C.white }}>
        {['dashboard', 'map', 'routes', 'settings'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '14px 4px', border: 'none', background: 'none',
            fontFamily: fontHead, fontSize: 15, fontWeight: 700, letterSpacing: 0.5,
            cursor: 'pointer', textTransform: 'uppercase',
            color: tab === t ? C.navy : C.muted,
            borderBottom: `3px solid ${tab === t ? C.gold : 'transparent'}`,
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: 16, maxWidth: 640, margin: '0 auto' }}>
        {tab === 'dashboard' && (
          <Dashboard donations={donations} routes={routes} reports={reports} progress={progress} settings={settings}
            onClear={async () => { await onUpdateDonations([]); }}
            onClearReports={async () => { await onUpdateReports([]); }} />
        )}
        {tab === 'map'       && <MapTab donations={donations} routes={routes} settings={settings} />}
        {tab === 'routes'    && <RoutesTab routes={routes} settings={settings} onUpdate={onUpdateRoutes} />}
        {tab === 'settings'  && <SettingsTab settings={settings} onUpdate={onUpdateSettings} />}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════ */
export default function App() {
  const [screen,        setScreen]  = useState('home');
  const [routes,        setRoutes]  = useState([]);
  const [donations,     setDons]    = useState([]);
  const [reports,       setReports] = useState([]);
  const [progress,      setProgress]= useState({});
  const [driverSession, setSession] = useState(null);
  const [loading,       setLoading] = useState(true);
  const [adminTab,      setAdminTab]= useState('dashboard');
  const [settings,      setSettings]= useState({ eventName: 'TAG DAY', adminPin: '1234', shifts: ['Morning', 'Afternoon'] });

  useEffect(() => {
    injectFonts();
    (async () => {
      const r  = await sGet('td-routes');
      const d  = await sGet('td-donations');
      const s  = await sGet('td-settings');
      const rp = await sGet('td-reports');
      const pr = await sGet('td-progress');
      const ds = await sGet('td-driver-session');
      if (r)  setRoutes(r);
      if (d)  setDons(d);
      if (s)  setSettings(s);
      if (rp) setReports(rp);
      if (pr) setProgress(pr);
      if (ds) setSession(ds);
      setLoading(false);
    })();
  }, []);

  const updateRoutes   = async (r)  => { setRoutes(r);   await sSet('td-routes',    r); };
  const updateDons     = async (d)  => { setDons(d);     await sSet('td-donations', d); };
  const updateReports  = async (rp) => { setReports(rp); await sSet('td-reports',   rp); };
  const updateSettings = async (s)  => { setSettings(s); await sSet('td-settings',  s); };
  const toggleStop     = async (key, idx, checked) => {
    const next = checked.includes(idx) ? checked.filter(i => i !== idx) : [...checked, idx];
    const pr   = { ...progress, [key]: next };
    setProgress(pr);
    await sSet('td-progress', pr);
  };

  const startDriver = async (session) => {
    setSession(session);
    await sSet('td-driver-session', session);
    setScreen('driver');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg }}>
      <div style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, letterSpacing: 2 }}>LOADING…</div>
    </div>
  );

  if (screen === 'home')
    return <HomeScreen
      onDriver={() => setScreen('driver-setup')}
      onAdmin={() => setScreen('admin-login')}
      onResume={() => setScreen('driver')}
      savedSession={driverSession}
      routes={routes}
      settings={settings} />;

  if (screen === 'driver-setup')
    return <DriverSetup routes={routes} settings={settings} onBack={() => setScreen('home')}
      onStart={startDriver} />;

  if (screen === 'driver')
    return <DriverScreen session={driverSession} routes={routes} settings={settings} progress={progress} onBack={() => setScreen('home')}
      donations={donations.filter(d => d.routeId === driverSession?.routeId && d.shift === driverSession?.shift)}
      onAddDonation={async (don) => {
        const next = [...donations, { ...don, id: genId(), routeId: driverSession.routeId, shift: driverSession.shift, timestamp: Date.now() }];
        await updateDons(next);
      }}
      onToggleStop={toggleStop}
      onAddReport={async (rep) => {
        const next = [...reports, { ...rep, id: genId(), timestamp: Date.now() }];
        await updateReports(next);
      }} />;

  if (screen === 'admin-login')
    return <AdminLogin settings={settings} onBack={() => setScreen('home')} onSuccess={() => setScreen('admin')} />;

  if (screen === 'admin')
    return <AdminScreen routes={routes} donations={donations} reports={reports} progress={progress} settings={settings}
      onUpdateRoutes={updateRoutes} onUpdateDonations={updateDons} onUpdateReports={updateReports} onUpdateSettings={updateSettings}
      onBack={() => setScreen('home')} tab={adminTab} setTab={setAdminTab} />;
}
