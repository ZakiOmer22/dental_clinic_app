/**
 * Dental Clinic API — Complete Endpoint Test Suite (V1)
 * Run: node scripts/test-api.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_EMAIL = 'admin@mail.com';
const TEST_PASSWORD = '12345678';
const PREFIX = '/api/v1';

const c = { reset:'\x1b[0m', green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m', blue:'\x1b[34m', cyan:'\x1b[36m', magenta:'\x1b[35m' };

const results = { passed:0, failed:0, skipped:0, details:[], startTime:Date.now() };
let authToken = null;
let testData = { userId:null, clinicId:null, patientId:null };

const log = {
  info: (m) => console.log(`${c.blue}ℹ${c.reset} ${m}`),
  success: (m) => console.log(`${c.green}✅${c.reset} ${m}`),
  error: (m) => console.log(`${c.red}❌${c.reset} ${m}`),
  warning: (m) => console.log(`${c.yellow}⚠${c.reset} ${m}`),
  section: (m) => console.log(`\n${c.cyan}━━━ ${m} ━━━${c.reset}\n`),
  title: () => { console.log(`\n${c.magenta}${'='.repeat(60)}\n  DENTAL CLINIC API — V1 TEST SUITE\n${'='.repeat(60)}${c.reset}\n`); },
};

const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

// Manually add auth header instead of interceptor
function authHeaders() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

async function test(name, fn) {
  try {
    const result = await fn();
    if (result === false) { results.failed++; results.details.push({name,status:'FAILED'}); log.error(`${name} - FAILED`); }
    else { results.passed++; results.details.push({name,status:'PASSED'}); log.success(`${name} - PASSED`); }
    return result;
  } catch (err) {
    results.failed++;
    const msg = err.response?.data?.error || err.message;
    results.details.push({name,status:'FAILED',error:msg});
    log.error(`${name} - FAILED (${msg})`);
    return false;
  }
}

async function assertStatus(res, expected) {
  if (res.status !== expected) throw new Error(`Expected ${expected}, got ${res.status}: ${JSON.stringify(res.data).slice(0,100)}`);
  return true;
}

async function testHealthCheck() {
  log.section('1. HEALTH CHECK');
  await test('GET /health', async () => { const r = await api.get('/health'); await assertStatus(r,200); return r.data.ok===true; });
}

async function testAuthentication() {
  log.section('2. AUTHENTICATION');
  await test(`POST ${PREFIX}/auth/login`, async () => {
    const r = await api.post(`${PREFIX}/auth/login`, { email: TEST_EMAIL, password: TEST_PASSWORD });
    if (r.status !== 200) throw new Error(r.data.error||'Login failed');
    // Try different token locations
    authToken = r.data.token || r.data.data?.token || r.data.accessToken;
    if (!authToken) throw new Error('No token in response: ' + JSON.stringify(r.data));
    testData.userId = r.data.user?.id || r.data.data?.user?.id;
    testData.clinicId = r.data.user?.clinicId || r.data.data?.user?.clinicId;
    return true;
  });
  await test(`GET ${PREFIX}/auth/me`, async () => {
    const r = await api.get(`${PREFIX}/auth/me`, { headers: authHeaders() });
    await assertStatus(r,200); return true;
  });
  await test(`POST ${PREFIX}/auth/login - invalid`, async () => {
    const r = await api.post(`${PREFIX}/auth/login`, {email:'x@x.com',password:'x'});
    return r.status===401;
  });
}

async function testPatients() {
  log.section('3. PATIENTS');
  const route = `${PREFIX}/patients`;
  await test(`GET ${route}`, async () => { const r = await api.get(`${route}?limit=5`, { headers: authHeaders() }); await assertStatus(r,200); return true; });
  await test(`POST ${route}`, async () => {
    const r = await api.post(route, { firstName:'Test', lastName:`P${Date.now()}`, phone:'+252600000000', email:`t${Date.now()}@m.com`, gender:'Male', dateOfBirth:'1990-01-01' }, { headers: authHeaders() });
    if (r.status===201||r.status===200) { const d=r.data.data||r.data; testData.patientId=d.id||d.patient?.id; return true; }
    throw new Error(r.data.error||'Create failed');
  });
  if (testData.patientId) {
    await test(`GET ${route}/:id`, async () => { const r = await api.get(`${route}/${testData.patientId}`, { headers: authHeaders() }); return r.status===200; });
  }
}

async function testAppointments() {
  log.section('4. APPOINTMENTS');
  const route = `${PREFIX}/appointments`;
  await test(`GET ${route}`, async () => { const r = await api.get(`${route}?limit=5`, { headers: authHeaders() }); await assertStatus(r,200); return true; });
}

async function testTreatments() {
  log.section('5. TREATMENTS');
  await test(`GET ${PREFIX}/treatments`, async () => { const r = await api.get(`${PREFIX}/treatments?limit=5`, { headers: authHeaders() }); return r.status===200; });
  await test(`GET ${PREFIX}/procedures`, async () => { const r = await api.get(`${PREFIX}/procedures?limit=10`, { headers: authHeaders() }); return r.status===200; });
}

async function testPrescriptions() {
  log.section('6. PRESCRIPTIONS');
  await test(`GET ${PREFIX}/prescriptions`, async () => { const r = await api.get(`${PREFIX}/prescriptions?limit=5`, { headers: authHeaders() }); return r.status===200; });
}

async function testBilling() {
  log.section('7. BILLING');
  await test(`GET ${PREFIX}/billing/invoices`, async () => { const r = await api.get(`${PREFIX}/billing/invoices?limit=5`, { headers: authHeaders() }); return r.status===200; });
}

async function testInventory() {
  log.section('8. INVENTORY');
  await test(`GET ${PREFIX}/inventory/items`, async () => { const r = await api.get(`${PREFIX}/inventory/items?limit=5`, { headers: authHeaders() }); return r.status===200; });
  await test(`GET ${PREFIX}/inventory/alerts`, async () => { const r = await api.get(`${PREFIX}/inventory/alerts`, { headers: authHeaders() }); return r.status===200; });
}

async function testLabOrders() {
  log.section('9. LAB ORDERS');
  await test(`GET ${PREFIX}/lab-orders`, async () => { const r = await api.get(`${PREFIX}/lab-orders?limit=5`, { headers: authHeaders() }); return r.status===200; });
}

async function testAuditLogs() {
  log.section('10. AUDIT LOGS');
  await test(`GET ${PREFIX}/logs`, async () => { const r = await api.get(`${PREFIX}/logs?limit=5`, { headers: authHeaders() }); return r.status===200; });
}

async function testStaff() {
  log.section('11. STAFF');
  await test(`GET ${PREFIX}/staff`, async () => { const r = await api.get(`${PREFIX}/staff?limit=5`, { headers: authHeaders() }); return r.status===200; });
  await test(`GET ${PREFIX}/users`, async () => { const r = await api.get(`${PREFIX}/users?limit=5`, { headers: authHeaders() }); return r.status===200; });
}

async function testRooms() {
  log.section('12. ROOMS');
  await test(`GET ${PREFIX}/rooms`, async () => { const r = await api.get(`${PREFIX}/rooms`, { headers: authHeaders() }); return r.status===200; });
}

async function testNotifications() {
  log.section('13. NOTIFICATIONS');
  await test(`GET ${PREFIX}/notifications`, async () => { const r = await api.get(`${PREFIX}/notifications?limit=5`, { headers: authHeaders() }); return r.status===200; });
  await test(`GET ${PREFIX}/notifications/unread-count`, async () => { const r = await api.get(`${PREFIX}/notifications/unread-count`, { headers: authHeaders() }); return r.status===200; });
}

async function testSecurity() {
  log.section('14. SECURITY');
  await test(`GET ${PREFIX}/patients without token → 401`, async () => { const r = await axios.get(`${BASE_URL}${PREFIX}/patients`, { validateStatus: () => true }); return r.status===401; });
}

async function cleanup() {
  log.section('CLEANUP');
  if (testData.patientId) {
    if (!authToken) { const lr = await api.post(`${PREFIX}/auth/login`, {email:TEST_EMAIL,password:TEST_PASSWORD}); authToken=lr.data.token||lr.data.data?.token; }
    await test(`DELETE ${PREFIX}/patients/:id`, async () => { const r = await api.delete(`${PREFIX}/patients/${testData.patientId}`, { headers: authHeaders() }); return r.status===200; });
  }
}

async function testLogout() {
  log.section('15. LOGOUT');
  await test(`POST ${PREFIX}/auth/logout`, async () => { const r = await api.post(`${PREFIX}/auth/logout`, {}, { headers: authHeaders() }); await assertStatus(r,200); authToken=null; return true; });
}

function printSummary() {
  const duration = ((Date.now()-results.startTime)/1000).toFixed(2);
  const total = results.passed+results.failed;
  const rate = total>0?((results.passed/total)*100).toFixed(1):'0.0';
  console.log(`\n${c.magenta}${'='.repeat(60)}\n  TEST SUMMARY\n${'='.repeat(60)}${c.reset}\n`);
  console.log(`  ${c.green}✅ Passed: ${results.passed}${c.reset}`);
  console.log(`  ${c.red}❌ Failed: ${results.failed}${c.reset}`);
  console.log(`  ${c.blue}⏱ Duration: ${duration}s${c.reset}`);
  console.log(`  ${c.cyan}📊 Success Rate: ${rate}%${c.reset}`);
  const report = { timestamp:new Date().toISOString(), baseUrl:BASE_URL, routeType:'V1', duration:`${duration}s`, results:{passed:results.passed,failed:results.failed,successRate:`${rate}%`}, details:results.details };
  fs.writeFileSync(path.join(__dirname, 'test-report.json'), JSON.stringify(report,null,2));
  log.info('Report saved to scripts/test-report.json');
}

async function main() {
  console.clear();
  log.title();
  log.info(`Base URL: ${BASE_URL}`);
  await testHealthCheck();
  await testAuthentication();
  await testPatients();
  await testAppointments();
  await testTreatments();
  await testPrescriptions();
  await testBilling();
  await testInventory();
  await testLabOrders();
  await testAuditLogs();
  await testStaff();
  await testRooms();
  await testNotifications();
  await testSecurity();
  await cleanup();
  await testLogout();
  printSummary();
  process.exit(results.failed>0?1:0);
}

process.on('unhandledRejection',(err)=>{ log.error(`Unhandled: ${err.message}`); process.exit(1); });
main();