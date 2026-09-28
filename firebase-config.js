// ================================================================
//  BALAJI WOODEN SOLUTIONS — Firebase Config
//  Saves bookings ONLINE to Firestore + syncs to localStorage.
//  Works offline too (localStorage fallback).
// ================================================================
//
//  ✅ SETUP (5 minutes, one-time):
//
//  STEP 1 → Go to https://console.firebase.google.com
//  STEP 2 → Click "Add project" → name: balaji-wooden-solutions
//           → Disable Google Analytics → Create project
//  STEP 3 → Click "</>" (Web) icon → App nickname: balaji-web
//           → Click "Register app"
//  STEP 4 → Copy the firebaseConfig values shown on screen
//           → Paste them below replacing the YOUR_... placeholders
//  STEP 5 → In Firebase console sidebar → Build → Firestore Database
//           → Create database → Start in TEST MODE → Next → Done
//  STEP 6 → Save this file. Done! 🎉
//
//  After setup: bookings from ANY device go to the same database.
//  Open admin.html on your phone, laptop — same data everywhere.
// ================================================================

const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// ---- Keys ----
const LS_B = 'bws_bookings';
const LS_D = 'bws_designs';
const FB_CONFIGURED = firebaseConfig.apiKey !== 'YOUR_API_KEY';

let db       = null;
let fbOnline = false;

// ---- Init ----
function initFirebase() {
  if (!FB_CONFIGURED) { console.warn('⚠️ Firebase not configured. Using localStorage only.'); return false; }
  try {
    if (typeof firebase === 'undefined') return false;
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    fbOnline = true;
    console.log('✅ Firebase Firestore connected — bookings will save ONLINE.');
    return true;
  } catch (e) {
    console.error('Firebase init error:', e);
    return false;
  }
}

// ---- Generate local ID ----
function _genId() {
  return 'BWS-' + Date.now() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();
}

// ---- Local helpers ----
function _getLS(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function _setLS(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

// ================================================================
//  SAVE BOOKING
//  → Saves to Firestore (online) AND localStorage (offline backup)
// ================================================================
async function saveBooking(data) {
  const id   = _genId();
  const record = { id, ...data, status: 'pending', createdAt: Date.now(), source: 'website' };

  // Always save locally first
  const local = _getLS(LS_B);
  local.unshift(record);
  _setLS(LS_B, local);

  // Try Firestore
  if (fbOnline && db) {
    try {
      const ref = await db.collection('bookings').add({
        ...data,
        localId:   id,
        status:    'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        source:    'website'
      });
      // Update local record with Firestore ID
      const updated = _getLS(LS_B).map(b => b.id === id ? { ...b, firestoreId: ref.id } : b);
      _setLS(LS_B, updated);
      console.log('✅ Booking saved to Firestore:', ref.id);
      return ref.id;
    } catch (e) {
      console.warn('Firestore save failed, kept locally:', e.message);
    }
  }
  return id;
}

// ================================================================
//  SAVE DESIGN REQUEST
// ================================================================
async function saveDesignRequest(data) {
  const id     = _genId();
  const record = { id, ...data, status: 'new', createdAt: Date.now(), source: 'website' };

  const local = _getLS(LS_D);
  local.unshift(record);
  _setLS(LS_D, local);

  if (fbOnline && db) {
    try {
      const ref = await db.collection('design_requests').add({
        ...data,
        localId:   id,
        status:    'new',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        source:    'website'
      });
      const updated = _getLS(LS_D).map(d => d.id === id ? { ...d, firestoreId: ref.id } : d);
      _setLS(LS_D, updated);
      console.log('✅ Design request saved to Firestore:', ref.id);
      return ref.id;
    } catch (e) {
      console.warn('Firestore save failed, kept locally:', e.message);
    }
  }
  return id;
}

// ================================================================
//  REAL-TIME LISTENER — Firestore → localStorage sync
//  Called by admin portal. Merges Firestore data into localStorage.
// ================================================================
function listenBookings(onUpdate) {
  if (!fbOnline || !db) { onUpdate(_getLS(LS_B)); return null; }
  return db.collection('bookings')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      const items = [];
      snap.forEach(doc => {
        const d = doc.data();
        items.push({
          id:        d.localId || doc.id,
          firestoreId: doc.id,
          name:      d.name     || '',
          phone:     d.phone    || '',
          email:     d.email    || '',
          service:   d.service  || '',
          date:      d.date     || '',
          time:      d.time     || '',
          address:   d.address  || '',
          notes:     d.notes    || '',
          status:    d.status   || 'pending',
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().getTime() : (d.createdAt || Date.now()),
          source:    d.source   || 'website'
        });
      });
      // Merge with any local-only records (not yet synced)
      const local = _getLS(LS_B);
      const fsIds = new Set(items.map(i => i.firestoreId));
      const localOnly = local.filter(l => !l.firestoreId || !fsIds.has(l.firestoreId));
      const merged = [...items, ...localOnly];
      merged.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
      _setLS(LS_B, merged);
      onUpdate(merged);
    }, err => {
      console.error('Firestore listen error:', err);
      onUpdate(_getLS(LS_B));
    });
}

function listenDesigns(onUpdate) {
  if (!fbOnline || !db) { onUpdate(_getLS(LS_D)); return null; }
  return db.collection('design_requests')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      const items = [];
      snap.forEach(doc => {
        const d = doc.data();
        items.push({
          id:          d.localId || doc.id,
          firestoreId: doc.id,
          name:        d.name        || '',
          phone:       d.phone       || '',
          email:       d.email       || '',
          item:        d.item        || '',
          wood:        d.wood        || '',
          budget:      d.budget      || '',
          timeline:    d.timeline    || '',
          description: d.description || '',
          notes:       d.notes       || '',
          status:      d.status      || 'new',
          createdAt:   d.createdAt?.toDate ? d.createdAt.toDate().getTime() : (d.createdAt || Date.now()),
          source:      d.source      || 'website'
        });
      });
      const local = _getLS(LS_D);
      const fsIds = new Set(items.map(i => i.firestoreId));
      const localOnly = local.filter(l => !l.firestoreId || !fsIds.has(l.firestoreId));
      const merged = [...items, ...localOnly];
      merged.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
      _setLS(LS_D, merged);
      onUpdate(merged);
    }, err => {
      console.error('Firestore listen error:', err);
      onUpdate(_getLS(LS_D));
    });
}

// ================================================================
//  UPDATE STATUS (Firestore + localStorage)
// ================================================================
async function updateBookingStatus(id, status) {
  // Update locally
  const B = _getLS(LS_B);
  const i = B.findIndex(b => b.id === id || b.firestoreId === id);
  if (i >= 0) { B[i].status = status; B[i].updatedAt = Date.now(); _setLS(LS_B, B); }

  // Update Firestore
  if (fbOnline && db) {
    const rec = B[i];
    const fsId = rec?.firestoreId || id;
    try {
      await db.collection('bookings').doc(fsId).update({
        status, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) { console.warn('Firestore status update failed:', e.message); }
  }
}

async function updateDesignStatus(id, status) {
  const D = _getLS(LS_D);
  const i = D.findIndex(d => d.id === id || d.firestoreId === id);
  if (i >= 0) { D[i].status = status; D[i].updatedAt = Date.now(); _setLS(LS_D, D); }

  if (fbOnline && db) {
    const rec = D[i];
    const fsId = rec?.firestoreId || id;
    try {
      await db.collection('design_requests').doc(fsId).update({
        status, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) { console.warn('Firestore status update failed:', e.message); }
  }
}

// ================================================================
//  DELETE (Firestore + localStorage)
// ================================================================
async function deleteRecord(collection, id) {
  const key  = collection === 'bookings' ? LS_B : LS_D;
  const data = _getLS(key);
  const rec  = data.find(r => r.id === id || r.firestoreId === id);
  _setLS(key, data.filter(r => r.id !== id && r.firestoreId !== id));

  if (fbOnline && db && rec?.firestoreId) {
    try { await db.collection(collection).doc(rec.firestoreId).delete(); } catch(e) {}
  }
}

// ---- Compat aliases (used by old inline scripts) ----
async function fetchBookings(cb)       { return listenBookings(cb); }
async function fetchDesignRequests(cb) { return listenDesigns(cb); }

function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = (ts && ts.toDate) ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

// ---- Status indicator in page ----
function showFBStatus() {
  const existing = document.getElementById('fb-status-bar');
  if (existing) existing.remove();
  const bar = document.createElement('div');
  bar.id = 'fb-status-bar';
  bar.style.cssText = `position:fixed;bottom:0;left:0;right:0;z-index:9998;padding:7px 16px;
    font-size:.78rem;font-weight:600;text-align:center;
    background:${fbOnline ? '#e8f5e9' : '#fff8e1'};
    color:${fbOnline ? '#2e7d32' : '#e65100'};
    border-top:2px solid ${fbOnline ? '#a5d6a7' : '#ffcc02'};`;
  bar.textContent = fbOnline
    ? '🌐 Online Mode — Bookings are saving to Firebase (visible from any device)'
    : '💾 Offline Mode — Bookings saving locally. Add Firebase config to go online.';
  document.body.appendChild(bar);
  setTimeout(() => { if (bar) bar.style.opacity = '0'; bar.style.transition = 'opacity 1s'; }, 6000);
  setTimeout(() => { if (bar) bar.remove(); }, 7000);
}

// ---- Auto-init ----
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initFirebase();
    if (document.querySelector('.booking-form-card, .design-form-card, #dashboard')) {
      showFBStatus();
    }
  }, 400);
});
