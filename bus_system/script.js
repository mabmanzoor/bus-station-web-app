/* =====================================================
   BUS STATION APP – FIXED script.js
   - Button working (Book / Refresh / Clear)
   - Tickets saved in localStorage + table render
   ===================================================== */

/* -----------------------
   STATIONS (Karachi)
----------------------- */
const stations = [
  { id: "KHI-001", name: "Saddar" },
  { id: "KHI-002", name: "Gulshan-e-Iqbal" },
  { id: "KHI-003", name: "North Nazimabad" },
  { id: "KHI-004", name: "Nazimabad" },
  { id: "KHI-005", name: "Defence (DHA)" },
  { id: "KHI-006", name: "Clifton" },
  { id: "KHI-007", name: "Korangi" },
  { id: "KHI-008", name: "Landhi" },
  { id: "KHI-009", name: "Malir" },
  { id: "KHI-010", name: "Shah Faisal Colony" },
  { id: "KHI-011", name: "PECHS" },
  { id: "KHI-012", name: "Gulistan-e-Jauhar" },
  { id: "KHI-013", name: "FB Area" },
  { id: "KHI-014", name: "Surjani Town" },
  { id: "KHI-015", name: "Orangi Town" },
  { id: "KHI-016", name: "SITE Area" },
  { id: "KHI-017", name: "Kemari" },
  { id: "KHI-018", name: "Lyari" },
  { id: "KHI-019", name: "Tariq Road" },
  { id: "KHI-020", name: "Airport" },
  { id: "KHI-021", name: "Garden" },
  { id: "KHI-022", name: "Liaquatabad" },
  { id: "KHI-023", name: "Buffer Zone" },
  { id: "KHI-024", name: "Gizri" },
  { id: "KHI-025", name: "Mehmoodabad" },
  { id: "KHI-026", name: "Model Colony" },
  { id: "KHI-027", name: "New Karachi" },
  { id: "KHI-028", name: "Baldia Town" },
  { id: "KHI-029", name: "Manghopir" },
  { id: "KHI-030", name: "Sohrab Goth" }
];

/* -----------------------
   BUSES + ROUTES
----------------------- */
const buses = [
  {
    id: "BUS-12",
    name: "Green Line",
    capacity: 40,
    routes: ["KHI-014", "KHI-013", "KHI-003", "KHI-004", "KHI-001"]
  },
  {
    id: "BUS-25",
    name: "Red Line",
    capacity: 35,
    routes: ["KHI-020", "KHI-010", "KHI-011", "KHI-002", "KHI-012"]
  },
  {
    id: "BUS-77",
    name: "Blue Line",
    capacity: 45,
    routes: ["KHI-001", "KHI-011", "KHI-005", "KHI-006"]
  },
  {
    id: "BUS-33",
    name: "Yellow Line",
    capacity: 38,
    routes: ["KHI-007", "KHI-008", "KHI-009", "KHI-010", "KHI-001"]
  }
];

/* -----------------------
   PRICING RULES
----------------------- */
function baseFareByHops(hops) {
  if (hops <= 1) return 70;
  if (hops === 2) return 90;
  if (hops === 3) return 110;
  return 130;
}

const DISCOUNT = {
  standard: 1,
  student: 0.7,
  senior: 0.85
};

const PEAK_HOURS = [
  { start: 7, end: 11 },
  { start: 17, end: 21 }
];

function isPeakNow() {
  const h = new Date().getHours();
  return PEAK_HOURS.some(p => h >= p.start && h < p.end);
}

function isSunday() {
  return new Date().getDay() === 0;
}

function calcFare(type, hops) {
  // Free Senior Day (Sunday)
  if (type === "senior" && isSunday()) return 0;

  let fare = baseFareByHops(hops) * DISCOUNT[type];
  if (isPeakNow()) fare *= 1.2;

  return Math.round(fare);
}

/* -----------------------
   HELPERS
----------------------- */
const $ = id => document.getElementById(id);
const liveState = {};
const keyOf = (from, bus) => `${from}_${bus}`;

function ensureLiveState(fromId, busId) {
  const k = keyOf(fromId, busId);
  if (!liveState[k]) {
    liveState[k] = {
      eta: Math.floor(Math.random() * 15) + 5,
      delay: 0,
      occupied: Math.floor(Math.random() * 20) + 5
    };
  }
  return liveState[k];
}

function toast(type, title, msg) {
  // aap ke UI me #toasts div hai, simple toast yahan
  const wrap = $("toasts");
  if (!wrap) {
    alert(`${title}\n${msg}`);
    return;
  }
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `
    <div class="head">
      <div class="title">${title}</div>
      <button class="x" aria-label="close">×</button>
    </div>
    <div class="msg">${msg}</div>
  `;
  t.querySelector(".x").onclick = () => t.remove();
  wrap.appendChild(t);
  setTimeout(() => { if (t.isConnected) t.remove(); }, 4500);
}

function money(n) {
  return `PKR ${n}`;
}

function uuid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

/* -----------------------
   DROPDOWNS
----------------------- */
function initDropdowns() {
  $("stationSelect").innerHTML = stations
    .map(s => `<option value="${s.id}">${s.id} — ${s.name}</option>`)
    .join("");

  // default selection
  $("stationSelect").value = stations[0].id;

  updateDestination();
  updateBus();
}

function updateDestination() {
  const from = $("stationSelect").value;
  $("destinationSelect").innerHTML = stations
    .filter(s => s.id !== from)
    .map(s => `<option value="${s.id}">${s.id} — ${s.name}</option>`)
    .join("");

  // default destination = first option
  $("destinationSelect").value = $("destinationSelect").options[0]?.value || "";
}

function updateBus() {
  const from = $("stationSelect").value;
  const to = $("destinationSelect").value;

  const valid = buses.filter(
    b => b.routes.includes(from) && b.routes.includes(to)
  );

  if (valid.length === 0) {
    $("busSelect").innerHTML = `<option value="">No bus available</option>`;
    showError("No bus available for this route");
    $("bookBtn").disabled = true;
    return;
  }

  hideError();
  $("busSelect").innerHTML = valid
    .map(b => `<option value="${b.id}">${b.id} — ${b.name}</option>`)
    .join("");

  $("busSelect").value = valid[0].id;
  $("bookBtn").disabled = false;
}

/* -----------------------
   UI UPDATE
----------------------- */
function getHops(bus, from, to) {
  const a = bus.routes.indexOf(from);
  const b = bus.routes.indexOf(to);
  if (a === -1 || b === -1) return null;
  return Math.abs(a - b);
}

function updateBadges() {
  const peak = isPeakNow();

  $("peakBadge").textContent = peak ? "Peak Time" : "Off-peak";
  $("peakBadge").className = peak ? "badge peak" : "badge";

  $("seniorBadge").style.display = isSunday() ? "inline-flex" : "none";
}

function updateUI() {
  updateBadges();

  const from = $("stationSelect").value;
  const to = $("destinationSelect").value;
  const busId = $("busSelect").value;

  $("stationPill").textContent = from || "—";
  $("busPill").textContent = busId || "—";

  const bus = buses.find(b => b.id === busId);
  if (!bus) {
    $("etaMins").textContent = "--";
    $("price").value = "";
    $("seats").value = "";
    $("bookBtn").disabled = true;
    return;
  }

  const hops = getHops(bus, from, to);
  if (!hops || hops <= 0) {
    showError("Invalid route selected");
    $("bookBtn").disabled = true;
    return;
  }

  hideError();

  const state = ensureLiveState(from, busId);
  $("etaMins").textContent = state.eta;

  const type = $("ticketType").value;
  const qty = Math.max(1, parseInt($("qty").value || "1", 10));

  const unit = calcFare(type, hops);
  const total = unit * qty;

  $("price").value = `${money(total)} (Unit ${money(unit)})`;
  const available = Math.max(0, bus.capacity - state.occupied);
  $("seats").value = `${available} / ${bus.capacity}`;

  $("bookBtn").disabled = qty > available;
}

/* -----------------------
   ERROR UI
----------------------- */
function showError(msg) {
  $("errorBox").style.display = "block";
  $("errorText").textContent = msg;
}
function hideError() {
  $("errorBox").style.display = "none";
}

/* -----------------------
   TICKETS (localStorage)
----------------------- */
function loadTickets() {
  try {
    return JSON.parse(localStorage.getItem("tickets_v1") || "[]");
  } catch {
    return [];
  }
}

function saveTickets(tickets) {
  localStorage.setItem("tickets_v1", JSON.stringify(tickets));
}

function renderTickets() {
  const tbody = $("ticketRows");
  const tickets = loadTickets();

  if (!tickets.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">No tickets yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = tickets.map(t => `
    <tr>
      <td>
        <div style="font-weight:800;">${t.shortId}</div>
        <div class="muted" style="font-size:12px;">${new Date(t.createdAt).toLocaleString()}</div>
      </td>
      <td>
        <div><strong>${t.from}</strong> → <strong>${t.to}</strong></div>
        <div class="muted" style="font-size:12px;">${t.busId} • ${t.type} • x${t.qty}</div>
      </td>
      <td class="right" style="font-weight:800;">${money(t.total)}</td>
      <td class="right"><button class="danger" data-cancel="${t.id}">Cancel</button></td>
    </tr>
  `).join("");

  tbody.querySelectorAll("button[data-cancel]").forEach(btn => {
    btn.addEventListener("click", () => cancelTicket(btn.dataset.cancel));
  });
}

function bookTicket() {
  const from = $("stationSelect").value;
  const to = $("destinationSelect").value;
  const busId = $("busSelect").value;
  const bus = buses.find(b => b.id === busId);

  if (!bus) {
    toast("bad", "Booking Failed", "Please select a valid bus.");
    return;
  }

  const hops = getHops(bus, from, to);
  if (!hops || hops <= 0) {
    toast("bad", "Wrong Route", "Selected bus does not serve this route.");
    return;
  }

  const state = ensureLiveState(from, busId);
  const available = Math.max(0, bus.capacity - state.occupied);

  const qty = Math.max(1, parseInt($("qty").value || "1", 10));
  if (qty > available) {
    toast("bad", "Not enough seats", "Requested quantity exceeds available seats.");
    return;
  }

  const type = $("ticketType").value;
  const unit = calcFare(type, hops);
  const total = unit * qty;

  // occupy seats
  state.occupied += qty;

  const ticket = {
    id: uuid(),
    shortId: uuid().slice(0, 8).toUpperCase(),
    from,
    to,
    busId,
    type,
    qty,
    unit,
    total,
    createdAt: Date.now()
  };

  const tickets = loadTickets();
  tickets.unshift(ticket);
  saveTickets(tickets);

  toast("ok", "Booked ✅", `Ticket booked. Total: ${money(total)}`);
  renderTickets();
  updateUI();
}

function cancelTicket(ticketId) {
  let tickets = loadTickets();
  const t = tickets.find(x => x.id === ticketId);

  if (!t) {
    toast("bad", "Cancel Failed", "Ticket not found.");
    return;
  }

  // free seats back
  const state = ensureLiveState(t.from, t.busId);
  state.occupied = Math.max(0, state.occupied - t.qty);

  tickets = tickets.filter(x => x.id !== ticketId);
  saveTickets(tickets);

  toast("warn", "Cancelled", "Ticket cancelled successfully.");
  renderTickets();
  updateUI();
}

function clearAllTickets() {
  saveTickets([]);
  toast("warn", "Cleared", "All tickets removed.");
  renderTickets();
  updateUI();
}

function refreshETA() {
  const from = $("stationSelect").value;
  const busId = $("busSelect").value;
  const bus = buses.find(b => b.id === busId);
  if (!bus) return;

  const state = ensureLiveState(from, busId);
  state.eta = Math.max(1, state.eta + (Math.floor(Math.random() * 7) - 2));
  toast("ok", "Refreshed", "ETA refreshed.");
  updateUI();
}

/* -----------------------
   SIMULATION
----------------------- */
function tick() {
  Object.values(liveState).forEach(s => {
    s.eta = Math.max(1, s.eta - 1);
    if (Math.random() < 0.1) s.delay = Math.floor(Math.random() * 10) + 1;
  });
  updateUI();
}

/* -----------------------
   BOOT
----------------------- */
window.addEventListener("DOMContentLoaded", () => {
  // IMPORTANT: ensure required IDs exist
  const must = ["stationSelect","destinationSelect","busSelect","bookBtn","refreshBtn","clearAllBtn","ticketRows"];
  const missing = must.filter(id => !$(id));
  if (missing.length) {
    console.error("Missing IDs in HTML:", missing);
    alert("HTML IDs missing: " + missing.join(", "));
    return;
  }

  initDropdowns();
  updateUI();
  renderTickets();

  // ✅ FIX: button listeners
  $("stationSelect").addEventListener("change", () => {
    updateDestination();
    updateBus();
    updateUI();
  });

  $("destinationSelect").addEventListener("change", () => {
    updateBus();
    updateUI();
  });

  $("busSelect").addEventListener("change", updateUI);
  $("ticketType").addEventListener("change", updateUI);
  $("qty").addEventListener("input", updateUI);

  $("bookBtn").addEventListener("click", bookTicket);
  $("refreshBtn").addEventListener("click", refreshETA);
  $("clearAllBtn").addEventListener("click", clearAllTickets);

  setInterval(tick, 15000);
});
