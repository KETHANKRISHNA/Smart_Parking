#!/usr/bin/env node
/**
 * Fills a running SmartPark instance with realistic demo data through its own admin API:
 * extra admins, facility managers, drivers, 13 facilities in 4 cities (with photos and bays), and a
 * handful of bookings so the dashboards, tickets and gate scanner have something to show.
 *
 * It is safe to run twice: users and facilities that already exist are skipped, and bookings are only
 * created when there are none yet.
 *
 *   node scripts/seed-demo-data.mjs --admin-email you@example.com --admin-password '...'
 *   node scripts/seed-demo-data.mjs --base https://your-api.onrender.com --admin-email ... --admin-password ...
 *   add --no-bookings to skip the sample bookings
 *
 * WARNING: the accounts below use shared, documented passwords. Use this for local development and
 * presentations only, never on a deployment that holds real users.
 */
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
    return acc;
  }, [])
);
const BASE = (args.base || process.env.BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const ADMIN_EMAIL = args['admin-email'] || process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = args['admin-password'] || process.env.ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Usage: node scripts/seed-demo-data.mjs --admin-email <email> --admin-password <password> [--base <url>] [--no-bookings]');
  process.exit(1);
}

const PASSWORDS = { ROLE_ADMIN: 'Admin@2026', ROLE_PARKING_MANAGER: 'Manager@2026', ROLE_USER: 'User@2026' };

// ---------------------------------------------------------------- people
const phone = (n) => `+91 98450${String(10000 + n).slice(-5)}`;
const person = (role, first, last, n) => ({ role, name: `${first} ${last}`, email: `${first}.${last}@example.com`.toLowerCase(), phone: phone(n) });

const ADMINS = [person('ROLE_ADMIN', 'Anita', 'Rao', 1), person('ROLE_ADMIN', 'Vikram', 'Mehta', 2)];
const MANAGERS = [
  person('ROLE_PARKING_MANAGER', 'Rajesh', 'Kumar', 11),
  person('ROLE_PARKING_MANAGER', 'Priya', 'Sharma', 12),
  person('ROLE_PARKING_MANAGER', 'Sandeep', 'Nair', 13),
  person('ROLE_PARKING_MANAGER', 'Meera', 'Iyer', 14),
  person('ROLE_PARKING_MANAGER', 'Arjun', 'Reddy', 15),
  person('ROLE_PARKING_MANAGER', 'Farhan', 'Qureshi', 16),
  person('ROLE_PARKING_MANAGER', 'Neha', 'Bansal', 17),
];
const DRIVERS = [
  ['Aarav', 'Patel'], ['Diya', 'Singh'], ['Rohan', 'Gupta'], ['Ananya', 'Krishnan'], ['Karthik', 'Subramanian'],
  ['Sneha', 'Joshi'], ['Imran', 'Sheikh'], ['Pooja', 'Desai'], ['Naveen', 'Gowda'], ['Meghana', 'Hegde'],
  ['Siddharth', 'Verma'], ['Kavya', 'Menon'], ['Harish', 'Babu'], ['Tanvi', 'Kulkarni'],
].map(([f, l], i) => person('ROLE_USER', f, l, 100 + i));

// ---------------------------------------------------------------- facilities (manager = index into MANAGERS)
const FACILITIES = [
  { name: 'Phoenix Marketcity Parking', city: 'Bangalore', category: 'MALL', address: 'Whitefield Main Road, Mahadevapura', lat: 12.9959, lng: 77.6963, rate: 60, hours: ['09:00', '23:30'], manager: 0, image: 'phoenix-mall', bays: 28, description: 'Four-level covered parking beside the mall entrances, with guided bays, fast EV chargers and a dedicated two-wheeler zone.' },
  { name: 'Orion Mall Multi-Level Parking', city: 'Bangalore', category: 'COMMERCIAL_HUB', address: 'Brigade Gateway, Rajajinagar', lat: 13.0109, lng: 77.5551, rate: 50, hours: ['00:00', '23:59'], manager: 0, image: 'multilevel-garage', bays: 24, description: 'Well-lit multi-storey garage with ramps to every level, 24-hour security and quick access to the mall and offices.' },
  { name: 'Manipal Hospital Parking', city: 'Bangalore', category: 'HOSPITAL', address: 'HAL Airport Road, Kodihalli', lat: 12.9583, lng: 77.6482, rate: 40, hours: ['00:00', '23:59'], manager: 2, image: 'manipal-hospital', bays: 20, description: 'Round-the-clock parking for patients and visitors, with accessible bays beside the main lobby and priority lanes for ambulances.' },
  { name: 'KSR Bengaluru City Railway Station Parking', city: 'Bangalore', category: 'RAILWAY_STATION', address: 'Majestic, Kempegowda Road', lat: 12.9784, lng: 77.5694, rate: 30, hours: ['00:00', '23:59'], manager: 2, image: 'railway-station', bays: 22, description: 'Long-stay parking steps from the platforms, with manned booths, CCTV and a bike locker area.' },
  { name: 'Kempegowda Airport T1 Short-Stay Parking', city: 'Bangalore', category: 'AIRPORT', address: 'KIAL Road, Devanahalli', lat: 13.1986, lng: 77.7066, rate: 100, hours: ['00:00', '23:59'], manager: 1, image: 'airport-t1', bays: 24, description: 'Covered short-stay bays a short walk from the departures hall, with FASTag checkout and luggage trolleys.' },
  { name: 'Embassy Tech Village Parking', city: 'Bangalore', category: 'IT_PARK', address: 'Outer Ring Road, Devarabisanahalli', lat: 12.9255, lng: 77.6883, rate: 35, hours: ['06:00', '23:00'], manager: 3, image: 'tech-park', bays: 26, description: 'Campus parking for employees and visitors, with reserved EV lanes and shuttle pick-up to every block.' },
  { name: 'Cubbon Park Open-Air Parking', city: 'Bangalore', category: 'TOURIST_SPOT', address: 'Kasturba Road, near High Court', lat: 12.9763, lng: 77.5929, rate: 25, hours: ['06:00', '20:00'], manager: 3, image: 'open-air-lot', bays: 16, description: 'Shaded open-air parking beside the park, close to the museums and the morning walking trails.' },
  { name: 'Inorbit Mall Basement Parking', city: 'Hyderabad', category: 'MALL', address: 'Madhapur, HITEC City Road', lat: 17.4344, lng: 78.3866, rate: 50, hours: ['10:00', '23:00'], manager: 4, image: 'mall-basement', bays: 24, description: 'Two basement levels with valet drop-off, EV charging and clear bay guidance.' },
  { name: 'HITEC City Cyber Towers Parking', city: 'Hyderabad', category: 'IT_PARK', address: 'Madhapur, Cyber Towers Road', lat: 17.4504, lng: 78.3808, rate: 40, hours: ['06:00', '23:59'], manager: 4, image: 'surface-lot', bays: 20, description: 'Surface parking for the Cyber Towers cluster with hourly and day rates and fast entry.' },
  { name: 'Apollo Hospital Jubilee Hills Parking', city: 'Hyderabad', category: 'HOSPITAL', address: 'Road No. 72, Jubilee Hills', lat: 17.4126, lng: 78.4071, rate: 45, hours: ['00:00', '23:59'], manager: 4, image: 'apollo-hospital', bays: 18, description: 'Patient and visitor parking with accessible bays near the entrance and a short walk to the emergency block.' },
  { name: 'BKC Business Hub Parking', city: 'Mumbai', category: 'COMMERCIAL_HUB', address: 'Bandra Kurla Complex, G Block', lat: 19.0669, lng: 72.8693, rate: 90, hours: ['07:00', '23:00'], manager: 5, image: 'business-hub', bays: 22, description: 'Premium parking in the heart of BKC, ideal for meetings and events, with reserved bays for electric cars.' },
  { name: 'Mumbai Airport T2 Parking', city: 'Mumbai', category: 'AIRPORT', address: 'Sahar Road, Andheri East', lat: 19.0896, lng: 72.8656, rate: 120, hours: ['00:00', '23:59'], manager: 5, image: 'airport-t2', bays: 24, description: 'Terminal 2 multi-level parking connected to departures by covered walkways, open all day and night.' },
  { name: 'India Gate Heritage Parking', city: 'Delhi', category: 'TOURIST_SPOT', address: 'Rajpath, near India Gate', lat: 28.6129, lng: 77.2295, rate: 30, hours: ['06:00', '22:00'], manager: 6, image: 'india-gate', bays: 18, description: 'Visitor parking close to the lawns and the monument, with coach bays and well-signed pedestrian routes.' },
];

// ---------------------------------------------------------------- http helpers
let adminToken = null;
const tokens = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(method, path, { token, body, tries = 6 } = {}) {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const res = await fetch(`${BASE}/api/v1${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429) {
      const wait = Number(res.headers.get('retry-after') || 20) + 1;
      console.log(`  (rate limited, waiting ${wait}s)`);
      await sleep(wait * 1000);
      continue;
    }
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${json.message || text}`);
    return json.data;
  }
  throw new Error(`${method} ${path} kept being rate limited`);
}

async function login(email, password) {
  if (tokens.has(email)) return tokens.get(email);
  const data = await call('POST', '/auth/login', { body: { email, password } });
  tokens.set(email, data.token);
  return data.token;
}

// Times are wall-clock strings in the app's business time zone (Asia/Kolkata), whatever this machine's zone is.
const istFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
const istAfter = (minutes) => istFormat.format(new Date(Date.now() + minutes * 60000)).replace(' ', 'T');
const istDay = (days, hour) => `${istAfter(days * 1440).slice(0, 10)}T${String(hour).padStart(2, '0')}:00`;
const plusHours = (isoLocal, hours) => {
  const [d, t] = isoLocal.split('T');
  const [y, mo, da] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  const ms = Date.UTC(y, mo - 1, da, h, mi) + hours * 3600000;
  return new Date(ms).toISOString().slice(0, 16);
};

// ---------------------------------------------------------------- 1. people
async function seedPeople() {
  const existing = new Set((await call('GET', '/admin/users', { token: adminToken })).map((u) => u.email.toLowerCase()));
  let created = 0;
  for (const p of [...ADMINS, ...MANAGERS, ...DRIVERS]) {
    if (existing.has(p.email)) continue;
    await call('POST', '/admin/users', { token: adminToken, body: { ...p, password: PASSWORDS[p.role] } });
    created += 1;
  }
  console.log(`people:     ${created} created, ${ADMINS.length + MANAGERS.length + DRIVERS.length - created} already there`);
  return call('GET', '/admin/users', { token: adminToken });
}

// ---------------------------------------------------------------- 2. facilities and bays
function baysFor(total) {
  const bike = Math.max(3, Math.round(total * 0.18));
  const ev = Math.max(2, Math.round(total * 0.1));
  const access = Math.max(2, Math.round(total * 0.08));
  const car = total - bike - ev - access;
  const bays = [];
  for (let i = 1; i <= car; i += 1) bays.push({ n: `A${String(i).padStart(2, '0')}`, type: 'CAR', floor: i <= Math.ceil(car / 2) ? 'Ground floor' : 'Level 1' });
  for (let i = 1; i <= ev; i += 1) bays.push({ n: `E${String(i).padStart(2, '0')}`, type: 'EV', floor: 'Ground floor', ev: true });
  for (let i = 1; i <= access; i += 1) bays.push({ n: `D${String(i).padStart(2, '0')}`, type: 'ACCESSIBLE', floor: 'Ground floor' });
  for (let i = 1; i <= bike; i += 1) bays.push({ n: `B${String(i).padStart(2, '0')}`, type: 'BIKE', floor: 'Basement' });
  return bays;
}

async function seedFacilities(users) {
  const managerByEmail = new Map(users.filter((u) => u.role === 'ROLE_PARKING_MANAGER').map((u) => [u.email.toLowerCase(), u]));
  const existing = new Map((await call('GET', '/admin/locations', { token: adminToken })).map((l) => [l.name, l]));
  let made = 0;
  let bayCount = 0;
  const result = [];
  for (const f of FACILITIES) {
    let loc = existing.get(f.name);
    if (!loc) {
      loc = await call('POST', '/admin/locations', {
        token: adminToken,
        body: {
          name: f.name, address: f.address, city: f.city, latitude: f.lat, longitude: f.lng, description: f.description,
          openingTime: f.hours[0], closingTime: f.hours[1], category: f.category, hourlyRate: f.rate,
          imageUrl: `/facilities/${f.image}.jpg`, active: true,
        },
      });
      made += 1;
    }
    const manager = managerByEmail.get(MANAGERS[f.manager].email);
    if (manager && loc.managerId !== manager.id) {
      loc = await call('POST', `/admin/locations/${loc.id}/assign-manager/${manager.id}`, { token: adminToken });
    }
    const slots = await call('GET', `/parking/${loc.id}/slots`);
    if (slots.length === 0) {
      for (const b of baysFor(f.bays)) {
        await call('POST', '/admin/slots', {
          token: adminToken,
          body: {
            slotNumber: b.n, locationId: loc.id, slotType: b.type, status: 'AVAILABLE', floorLevel: b.floor,
            hasEvCharger: Boolean(b.ev), customHourlyRate: b.ev ? f.rate + 15 : b.type === 'BIKE' ? Math.max(10, Math.round(f.rate / 2)) : null,
          },
        });
        bayCount += 1;
      }
    }
    result.push({ ...f, id: loc.id, managerEmail: MANAGERS[f.manager].email });
  }
  console.log(`facilities: ${made} created, ${FACILITIES.length - made} already there; ${bayCount} bays added`);
  return result;
}

// ---------------------------------------------------------------- 3. bookings
const PLATES = ['KA01AB1234', 'KA05MH2026', 'KA03EQ7788', 'KA51JK4521', 'KA02MN9012', 'MH12DE3456', 'TS09FG7821', 'DL8CAF5031', 'KA04HS6677', 'KA53PL1290', 'MH02CK8845', 'TS07UB3318', 'KA01EV2026', 'KA05BK4410'];
const VEHICLE_BAY = { CAR: 'CAR', EV: 'EV', BIKE: 'BIKE' };

async function book({ facility, driver, vehicle, start, hours, pay = true, cancel = false, gate = null, plate }) {
  const token = await login(driver.email, PASSWORDS.ROLE_USER);
  const end = plusHours(start, hours);
  const slots = await call('GET', `/parking/${facility.id}/slots?startTime=${start}&endTime=${end}`);
  const bay = slots.find((s) => s.status === 'AVAILABLE' && !s.bookedForWindow && s.slotType === VEHICLE_BAY[vehicle]);
  if (!bay) throw new Error(`no free ${vehicle} bay at ${facility.name}`);
  const booking = await call('POST', '/bookings', {
    token,
    body: { locationId: facility.id, slotId: bay.id, vehicleNumber: plate, vehicleType: vehicle, startTime: start, endTime: end },
  });
  if (pay) {
    const method = vehicle === 'EV' ? 'CARD' : 'UPI';
    const order = await call('POST', '/payments/create-order', { token, body: { bookingId: booking.id, paymentMethod: method } });
    await call('POST', '/payments/confirm', { token, body: { transactionId: order.transactionId, instrument: method === 'CARD' ? 'card-4242' : `${driver.name.split(' ')[0].toLowerCase()}@okaxis` } });
  }
  if (cancel) await call('POST', `/bookings/${booking.id}/cancel`, { token, body: { reason: 'Change of plans' } });
  if (gate) {
    const detailed = await call('GET', `/bookings/${booking.id}`, { token });
    const mgrToken = await login(facility.managerEmail, PASSWORDS.ROLE_PARKING_MANAGER);
    await call('POST', '/manager/gate-entry', { token: mgrToken, body: { qrToken: detailed.qrToken, gateName: 'Main Entrance' } });
    if (gate === 'exit') await call('POST', '/manager/gate-exit', { token: mgrToken, body: { qrToken: detailed.qrToken, gateName: 'Main Exit' } });
  }
  return booking;
}

async function seedBookings(facilities) {
  const existing = await call('GET', '/admin/bookings', { token: adminToken });
  if (existing.length > 0) {
    console.log(`bookings:   skipped (${existing.length} already exist)`);
    return;
  }
  const F = (name) => facilities.find((f) => f.name.startsWith(name));
  const D = (i) => DRIVERS[i % DRIVERS.length];
  const soon = istAfter(10); // inside the 15-minute early-entry window, so the gate accepts it right away
  const plan = [
    // finished visits (entered and left): they count as paid revenue today
    { f: 'Phoenix', d: 0, v: 'CAR', start: soon, h: 2, gate: 'exit' },
    { f: 'Manipal', d: 1, v: 'CAR', start: soon, h: 3, gate: 'exit' },
    { f: 'KSR', d: 2, v: 'BIKE', start: soon, h: 4, gate: 'exit' },
    { f: 'Embassy', d: 3, v: 'EV', start: soon, h: 8, gate: 'exit' },
    // vehicles parked right now (occupied bays, "vehicles inside" on the manager board)
    { f: 'Phoenix', d: 4, v: 'EV', start: soon, h: 3, gate: 'entry' },
    { f: 'Kempegowda', d: 5, v: 'CAR', start: soon, h: 6, gate: 'entry' },
    { f: 'Orion', d: 6, v: 'CAR', start: soon, h: 2, gate: 'entry' },
    // upcoming paid reservations
    { f: 'Phoenix', d: 7, v: 'CAR', start: istDay(1, 11), h: 3 },
    { f: 'Manipal', d: 8, v: 'CAR', start: istDay(1, 9), h: 2 },
    { f: 'Kempegowda', d: 9, v: 'CAR', start: istDay(2, 6), h: 12 },
    { f: 'Embassy', d: 10, v: 'EV', start: istDay(1, 9), h: 9 },
    { f: 'Inorbit', d: 11, v: 'CAR', start: istDay(2, 17), h: 3 },
    { f: 'HITEC', d: 12, v: 'BIKE', start: istDay(1, 10), h: 8 },
    { f: 'BKC', d: 13, v: 'CAR', start: istDay(3, 10), h: 5 },
    { f: 'Mumbai Airport', d: 0, v: 'CAR', start: istDay(4, 5), h: 24 },
    { f: 'India Gate', d: 1, v: 'CAR', start: istDay(2, 10), h: 4 },
    { f: 'Cubbon', d: 2, v: 'BIKE', start: istDay(1, 8), h: 3 },
    // paid and then cancelled with a refund
    { f: 'Orion', d: 3, v: 'CAR', start: istDay(3, 14), h: 2, cancel: true },
    { f: 'Apollo', d: 4, v: 'CAR', start: istDay(2, 12), h: 2, cancel: true },
  ];
  let ok = 0;
  for (const [i, step] of plan.entries()) {
    try {
      await book({ facility: F(step.f), driver: D(step.d), vehicle: step.v, start: step.start, hours: step.h, cancel: step.cancel, gate: step.gate, plate: PLATES[i % PLATES.length] });
      ok += 1;
    } catch (e) {
      console.log(`  booking ${i + 1} (${step.f}) skipped: ${e.message}`);
    }
  }
  console.log(`bookings:   ${ok} of ${plan.length} created (paid, parked, completed and cancelled)`);
}

// ---------------------------------------------------------------- run
console.log(`Seeding ${BASE} as ${ADMIN_EMAIL}`);
adminToken = (await call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })).token;
const users = await seedPeople();
const facilities = await seedFacilities(users);
if (!args['no-bookings']) await seedBookings(facilities);

console.log('\nDone. Sign in at /login with any of these (shared demo passwords):\n');
console.log(`  Your admin   ${ADMIN_EMAIL}   (the password you supplied)`);
console.log(`  Admin        ${ADMINS[0].email}   ${PASSWORDS.ROLE_ADMIN}`);
console.log(`  Manager      ${MANAGERS[0].email}   ${PASSWORDS.ROLE_PARKING_MANAGER}   (Phoenix Marketcity + Orion Mall)`);
console.log(`  Driver       ${DRIVERS[0].email}   ${PASSWORDS.ROLE_USER}`);
