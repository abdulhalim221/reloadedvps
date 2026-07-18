/* ============================================================
   RELOADED VPS — shared data layer (localStorage-backed demo)
   All data lives in the browser. Replace with a real backend
   before taking live payments.
   ============================================================ */
const RVPS = (() => {

  /* ---------- storage helpers ---------- */
  const K = {
    users: 'rvps_users',
    orders: 'rvps_orders',
    services: 'rvps_services',
    tickets: 'rvps_tickets',
    session: 'rvps_session',
    seeded: 'rvps_seeded_v1'
  };
  const get = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8).toUpperCase();

  /* ---------- plans & pricing ---------- */
  const PLANS = [
    {
      id: 'ignite', name: 'Ignite', tag: 'Starter',
      cpu: '2 vCPU Cores', ram: '4 GB DDR5 RAM', disk: '60 GB NVMe SSD',
      bw: '2 TB Bandwidth', port: '1 Gbps Port', extra: '1 Dedicated IPv4',
      prices: { 1: 15, 3: 40, 6: 70, 12: 120 }
    },
    {
      id: 'velocity', name: 'Velocity', tag: 'Most Popular', featured: true,
      cpu: '4 vCPU Cores', ram: '8 GB DDR5 RAM', disk: '120 GB NVMe SSD',
      bw: '5 TB Bandwidth', port: '1 Gbps Port', extra: '1 Dedicated IPv4',
      prices: { 1: 25, 3: 65, 6: 90, 12: 140 }
    },
    {
      id: 'titan', name: 'Titan', tag: 'Power User',
      cpu: '8 vCPU Cores', ram: '16 GB DDR5 RAM', disk: '240 GB NVMe SSD',
      bw: '10 TB Bandwidth', port: '10 Gbps Port', extra: '2 Dedicated IPv4',
      prices: { 1: 32, 3: 67, 6: 100, 12: 150 }
    }
  ];
  const CYCLES = { 1: '1 Month', 3: '3 Months', 6: '6 Months', 12: '1 Year' };
  const plan = id => PLANS.find(p => p.id === id);

  /* ---------- seed default admin ---------- */
  function seed() {
    if (get(K.seeded, false)) return;
    const users = get(K.users, []);
    if (!users.some(u => u.role === 'admin')) {
      users.push({
        id: uid('USR-'), name: 'Administrator',
        email: 'admin@reloadedvps.com', password: 'admin123',
        role: 'admin', created: Date.now()
      });
      set(K.users, users);
    }
    set(K.seeded, true);
  }

  /* ---------- auth ---------- */
  function register(name, email, password) {
    const users = get(K.users, []);
    email = email.trim().toLowerCase();
    if (users.some(u => u.email === email)) return { ok: false, error: 'An account with this email already exists.' };
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
    const user = { id: uid('USR-'), name: name.trim(), email, password, role: 'client', created: Date.now() };
    users.push(user); set(K.users, users);
    set(K.session, { userId: user.id });
    return { ok: true, user };
  }
  function login(email, password) {
    const u = get(K.users, []).find(x => x.email === email.trim().toLowerCase() && x.password === password);
    if (!u) return { ok: false, error: 'Invalid email or password.' };
    set(K.session, { userId: u.id });
    return { ok: true, user: u };
  }
  const logout = () => { localStorage.removeItem(K.session); location.href = 'index.html'; };
  function currentUser() {
    const s = get(K.session, null);
    if (!s) return null;
    return get(K.users, []).find(u => u.id === s.userId) || null;
  }
  function requireAuth(role) {
    seed();
    const u = currentUser();
    if (!u) { location.href = 'login.html'; return null; }
    if (role === 'admin' && u.role !== 'admin') { location.href = 'dashboard.html'; return null; }
    if (role === 'client' && u.role === 'admin') { location.href = 'admin.html'; return null; }
    return u;
  }

  /* ---------- orders & services ---------- */
  const LAVA_URL = 'https://app.lava.top/products/6de18591-699d-4fad-988c-d6781e00b8dc';
  function createOrder(userId, planId, cycle, status) {
    const p = plan(planId); if (!p) return null;
    const order = {
      id: uid('ORD-'), userId, planId, cycle: +cycle,
      amount: p.prices[cycle],
      status: status || 'pending',        // pending → paid (admin confirms) → completed (fulfilled)
      paymentMethod: 'Lava', lavaUrl: LAVA_URL,
      invoice: uid('INV-'), created: Date.now(), paidAt: null, fulfilled: null
    };
    const orders = get(K.orders, []); orders.unshift(order); set(K.orders, orders);
    return order;
  }
  function markOrderPaid(orderId) {
    const all = get(K.orders, []);
    const o = all.find(x => x.id === orderId);
    if (!o || o.status !== 'pending') return null;
    o.status = 'paid'; o.paidAt = Date.now();
    set(K.orders, all);
    return o;
  }
  const orders = () => get(K.orders, []);
  const ordersFor = userId => orders().filter(o => o.userId === userId);
  const services = () => get(K.services, []);
  const servicesFor = userId => services().filter(s => s.userId === userId);

  /* ---------- random VPS generator (proof of fulfillment) ---------- */
  const DCS = ['Frankfurt, DE — FRA1', 'Amsterdam, NL — AMS2', 'London, UK — LON1', 'New York, US — NYC3', 'Dallas, US — DAL1', 'Singapore, SG — SIN1'];
  const OSES = ['Ubuntu 24.04 LTS', 'Debian 12', 'AlmaLinux 9', 'Rocky Linux 9', 'Windows Server 2022'];
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const rndIP = () => `${rnd([45, 66, 92, 103, 141, 158, 185, 194])}.${1 + Math.floor(Math.random() * 254)}.${1 + Math.floor(Math.random() * 254)}.${1 + Math.floor(Math.random() * 254)}`;
  function rndPass(len = 14) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let s = ''; for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
  function generateVpsDetails(planId) {
    const p = plan(planId);
    return {
      hostname: `node-${Math.floor(1000 + Math.random() * 9000)}.reloadedvps.store`,
      ip: rndIP(),
      username: 'root',
      password: rndPass(),
      os: rnd(OSES),
      datacenter: rnd(DCS),
      panelUrl: 'https://panel.reloadedvps.store',
      specs: p ? `${p.cpu} • ${p.ram} • ${p.disk}` : ''
    };
  }

  function fulfillOrder(orderId, details, adminUser) {
    const all = orders();
    const o = all.find(x => x.id === orderId);
    if (!o || o.fulfilled) return null;
    const expires = new Date(); expires.setMonth(expires.getMonth() + o.cycle);
    const service = {
      id: uid('SRV-'), userId: o.userId, orderId: o.id, planId: o.planId,
      cycle: o.cycle, amount: o.amount, status: 'active',
      details, created: Date.now(), expires: expires.getTime(),
      proof: {                                     // proof of fulfillment record
        id: uid('POF-'), fulfilledBy: adminUser.name, adminId: adminUser.id,
        at: Date.now(), method: 'Auto-provisioned (generator)',
        snapshot: { hostname: details.hostname, ip: details.ip, os: details.os, dc: details.datacenter }
      }
    };
    const svcs = services(); svcs.unshift(service); set(K.services, svcs);
    o.status = 'completed'; o.fulfilled = Date.now(); o.serviceId = service.id;
    set(K.orders, all);
    return service;
  }

  /* ---------- tickets ---------- */
  function openTicket(user, subject, body, serviceId) {
    const t = {
      id: uid('TKT-'), userId: user.id, userName: user.name, userEmail: user.email,
      serviceId: serviceId || null, subject, status: 'open',
      created: Date.now(), updated: Date.now(),
      messages: [{ from: 'client', author: user.name, body, at: Date.now() }]
    };
    const ts = get(K.tickets, []); ts.unshift(t); set(K.tickets, ts);
    return t;
  }
  function replyTicket(ticketId, from, author, body, newStatus) {
    const ts = get(K.tickets, []);
    const t = ts.find(x => x.id === ticketId); if (!t) return null;
    t.messages.push({ from, author, body, at: Date.now() });
    t.updated = Date.now();
    t.status = newStatus || (from === 'admin' ? 'answered' : 'open');
    set(K.tickets, ts);
    return t;
  }
  function setTicketStatus(ticketId, status) {
    const ts = get(K.tickets, []);
    const t = ts.find(x => x.id === ticketId); if (!t) return;
    t.status = status; t.updated = Date.now(); set(K.tickets, ts);
  }
  const tickets = () => get(K.tickets, []);
  const ticketsFor = userId => tickets().filter(t => t.userId === userId);

  /* ---------- misc ---------- */
  const users = () => get(K.users, []);
  const money = n => '$' + Number(n).toFixed(n % 1 ? 2 : 0);
  const fmtDate = ts => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtDateTime = ts => new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  seed();

  return {
    PLANS, CYCLES, plan, LAVA_URL,
    register, login, logout, currentUser, requireAuth,
    createOrder, markOrderPaid, orders, ordersFor, services, servicesFor,
    generateVpsDetails, fulfillOrder,
    openTicket, replyTicket, setTicketStatus, tickets, ticketsFor,
    users, money, fmtDate, fmtDateTime, esc
  };
})();
