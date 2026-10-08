// Comprehensive Automated Test Suite covering Sprints 1 to 10
// Tests: Auth, RBAC, Dynamic Slots, Concurrency Lock (409 Conflict), Pre-Screening, Check-in, Outcome Logging, Analytics & CORS

const http = require('http');
const app = require('./server');

const PORT = 5099;
let server;

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const reqHeaders = {
            'Content-Type': 'application/json',
            ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
            ...headers
        };

        const req = http.request({
            hostname: '127.0.0.1',
            port: PORT,
            path: `/api${path}`,
            method,
            headers: reqHeaders
        }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                let parsed;
                try { parsed = JSON.parse(data); } catch { parsed = data; }
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('🧪 ========================================================');
    console.log('🧪 CS Blood Donation Drive Coordinator - Automated Test Suite');
    console.log('🧪 ========================================================\n');

    let passed = 0;
    let failed = 0;

    const assert = (condition, msg) => {
        if (condition) {
            console.log(`  ✅ PASS: ${msg}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${msg}`);
            failed++;
        }
    };

    // 1. Start test server
    server = app.listen(PORT);
    await new Promise(r => setTimeout(r, 600));

    try {
        // Test 1: Health & CORS Check (Sprint 1 & 9)
        console.log('--- Phase 1: Foundation & CORS Policies ---');
        const healthRes = await request('GET', '/health', null, { 'Origin': 'https://campus-blood.vercel.app' });
        assert(healthRes.status === 200, 'GET /api/health returns 200 OK');
        assert(healthRes.headers['access-control-allow-origin'] === 'https://campus-blood.vercel.app', 'CORS allows Vercel domain');

        const renderCors = await request('GET', '/health', null, { 'Origin': 'https://blood-api.onrender.com' });
        assert(renderCors.headers['access-control-allow-origin'] === 'https://blood-api.onrender.com', 'CORS allows Render domain');

        // Test 2: Authentication & RBAC (Sprint 2)
        console.log('\n--- Phase 1: Authentication & RBAC ---');
        const loginDonor = await request('POST', '/auth/login', { email: 'donor@campus.edu', password: 'password123' });
        assert(loginDonor.status === 200 && loginDonor.body.token, 'Donor login succeeds and returns JWT');
        const donorToken = loginDonor.body.token;

        const loginCoord = await request('POST', '/auth/login', { email: 'coordinator@campus.edu', password: 'password123' });
        assert(loginCoord.status === 200 && loginCoord.body.token, 'Coordinator login succeeds');
        const coordToken = loginCoord.body.token;

        const loginStaff = await request('POST', '/auth/login', { email: 'staff@campus.edu', password: 'password123' });
        assert(loginStaff.status === 200 && loginStaff.body.token, 'Medical staff login succeeds');
        const staffToken = loginStaff.body.token;

        // RBAC Forbidden Test
        const unauthDriveCreate = await request('POST', '/drives', { title: 'Unauthorized' }, { 'Authorization': `Bearer ${donorToken}` });
        assert(unauthDriveCreate.status === 403, 'Donor cannot create drives (403 Forbidden)');

        // Test 3: Dynamic Slot Generation (Sprint 3)
        console.log('\n--- Phase 2: Drive Creation & Dynamic Slot Generator ---');
        const newDrive = await request('POST', '/drives', {
            title: 'Automated Test Drive 2026',
            description: 'Unit testing drive generator',
            location_name: 'Campus Biology Labs',
            drive_date: '2026-11-10',
            start_time: '09:00:00',
            end_time: '11:00:00', // 2 hours = 4 slots of 30 min
            slot_duration_minutes: 30,
            capacity_per_slot: 1, // 1 capacity to test race conditions easily!
            target_units: 10
        }, { 'Authorization': `Bearer ${coordToken}` });

        assert(newDrive.status === 201, 'Coordinator created new blood drive');
        const driveData = newDrive.body.drive;
        assert(driveData.slots && driveData.slots.length === 4, 'Dynamic slot generator produced exactly 4 slots for 2-hour window (30m each)');
        const testSlot = driveData.slots[0];

        // Test 4: Concurrency & Transactional Slot Reservation (Sprint 4)
        console.log('\n--- Phase 2: Concurrency & Slot Booking (SELECT FOR UPDATE) ---');
        // Register second test donor
        const regDonor2 = await request('POST', '/auth/register', {
            full_name: 'Second Concurrent Donor',
            email: `concurrent_${Date.now()}@campus.edu`,
            password: 'password123',
            blood_group: 'O+'
        });
        const donor2Token = regDonor2.body.token;

        // Simulate 2 parallel bookings competing for the 1 remaining slot (capacity = 1)
        const [res1, res2] = await Promise.all([
            request('POST', '/appointments', { drive_id: driveData.id, slot_id: testSlot.id }, { 'Authorization': `Bearer ${donorToken}` }),
            request('POST', '/appointments', { drive_id: driveData.id, slot_id: testSlot.id }, { 'Authorization': `Bearer ${donor2Token}` })
        ]);

        const statuses = [res1.status, res2.status];
        assert(statuses.includes(201) && statuses.includes(409), `Concurrent race condition test: 1 winner (201) and 1 conflict (409). Actual: ${statuses.join(', ')}`);

        // Test 5: Pre-Screening Eligibility & Cooldown (Sprint 5)
        console.log('\n--- Phase 3: Digital Pre-Screening & Cooldown Rules ---');
        const passScreen = await request('POST', '/appointments/pre-screen', {
            age: 22,
            weight_kg: 68,
            feeling_well: true,
            has_tattoos_recent: false,
            on_antibiotics: false,
            pregnant: false
        });
        assert(passScreen.body.eligible === true, 'Healthy donor passes pre-screening');

        const failScreen = await request('POST', '/appointments/pre-screen', {
            age: 15, // Under 16
            weight_kg: 45, // Under 50
            feeling_well: false
        });
        assert(failScreen.body.eligible === false && failScreen.body.reasons.length >= 2, 'Underage & underweight donor properly deferred');

        // Test 6: Medical Staff Live Check-In & Phlebotomy Outcome (Sprint 6)
        console.log('\n--- Phase 3: Staff Live Desk & Outcome Logging ---');
        const winningAppt = res1.status === 201 ? res1.body.appointment : res2.body.appointment;
        const checkInRes = await request('PUT', `/staff/appointments/${winningAppt.id}/checkin`, null, { 'Authorization': `Bearer ${staffToken}` });
        assert(checkInRes.status === 200 && checkInRes.body.appointment.status === 'CHECKED_IN', 'Donor checked in and status set to CHECKED_IN');

        const outcomeRes = await request('POST', `/staff/appointments/${winningAppt.id}/complete`, {
            outcome: 'COMPLETED',
            units_collected: 1,
            blood_group_collected: 'O+',
            notes: 'Test collection successful'
        }, { 'Authorization': `Bearer ${staffToken}` });
        assert(outcomeRes.status === 200 && outcomeRes.body.record.units_collected === 1, 'Donation outcome logged as COMPLETED');

        // Test 7: Coordinator Real-Time Analytics & CSV Export (Sprint 7)
        console.log('\n--- Phase 4: Turnout Analytics & CSV Reporting ---');
        const analyticsRes = await request('GET', `/analytics/drives/${driveData.id}`, null, { 'Authorization': `Bearer ${coordToken}` });
        assert(analyticsRes.status === 200 && analyticsRes.body.analytics.metrics.total_units_collected === 1, 'Analytics shows 1 unit collected in real time');

        const csvRes = await request('GET', `/analytics/drives/${driveData.id}/export/csv`, null, { 'Authorization': `Bearer ${coordToken}` });
        assert(csvRes.status === 200 && typeof csvRes.body === 'string' && csvRes.body.includes('CS Blood Donation Drive Coordinator'), 'CSV export endpoint produces valid CSV text');

        // Test 8: Emergency Shortage Broadcast (Sprint 8)
        console.log('\n--- Phase 4: Emergency Broadcast Alerts ---');
        const broadcastRes = await request('POST', '/notifications/broadcast', {
            title: 'Critical O+ Shortage',
            message: 'Please donate blood at Great Hall today.',
            target_blood_groups: ['O+', 'AB+']
        }, { 'Authorization': `Bearer ${coordToken}` });
        assert(broadcastRes.status === 200 && broadcastRes.body.sent_count >= 1, 'Emergency broadcast dispatched to matching donors');

    } catch (err) {
        console.error('Test execution error:', err);
        failed++;
    } finally {
        server.close();
        console.log('\n========================================================');
        console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
        console.log('========================================================\n');
        process.exit(failed > 0 ? 1 : 0);
    }
}

runTests();
