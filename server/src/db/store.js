const { pool, query, executeTransaction, isDbConnected } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// In-Memory Fallback Store (active when PostgreSQL server is not connected or in standalone dev)
const memoryStore = {
    users: [],
    drives: [],
    slots: [],
    appointments: [],
    donationRecords: [],
    notifications: [],
    auditLogs: [],
};

// Seed initial mock data into memory store
function seedMemoryStore() {
    if (memoryStore.users.length > 0) return;

    const hash = bcrypt.hashSync('password123', 10);
    
    // 1. Initial Users
    const adminUser = {
        id: '11111111-1111-1111-1111-111111111111',
        full_name: 'Dr. Sarah Ndlovu (System Admin)',
        email: 'admin@campus.edu',
        password_hash: hash,
        role: 'ADMIN',
        blood_group: 'O+',
        phone: '+27 82 100 0001',
        date_of_birth: '1985-04-12',
        last_donation_date: null,
        created_at: new Date().toISOString()
    };

    const coordinatorUser = {
        id: '22222222-2222-2222-2222-222222222222',
        full_name: 'Nkululeko Ndlwana (Drive Coordinator)',
        email: 'coordinator@campus.edu',
        password_hash: hash,
        role: 'COORDINATOR',
        blood_group: 'A+',
        phone: '+27 83 200 0002',
        date_of_birth: '1992-08-20',
        last_donation_date: '2026-06-10',
        created_at: new Date().toISOString()
    };

    const staffUser = {
        id: '33333333-3333-3333-3333-333333333333',
        full_name: 'Sister Mary Phlebotomy (Medical Staff)',
        email: 'staff@campus.edu',
        password_hash: hash,
        role: 'STAFF',
        blood_group: 'B+',
        phone: '+27 84 300 0003',
        date_of_birth: '1988-11-05',
        last_donation_date: null,
        created_at: new Date().toISOString()
    };

    const donorUser1 = {
        id: '44444444-4444-4444-4444-444444444444',
        full_name: 'Thabo Mokoena (Student Donor)',
        email: 'donor@campus.edu',
        password_hash: hash,
        role: 'DONOR',
        blood_group: 'O-',
        phone: '+27 81 400 0004',
        date_of_birth: '2003-05-15',
        last_donation_date: '2026-07-01',
        created_at: new Date().toISOString()
    };

    const donorUser2 = {
        id: '55555555-5555-5555-5555-555555555555',
        full_name: 'Aisha Patel (Donor)',
        email: 'aisha@campus.edu',
        password_hash: hash,
        role: 'DONOR',
        blood_group: 'AB+',
        phone: '+27 82 500 0005',
        date_of_birth: '2001-09-22',
        last_donation_date: null,
        created_at: new Date().toISOString()
    };

    memoryStore.users.push(adminUser, coordinatorUser, staffUser, donorUser1, donorUser2);

    // 2. Initial Campus Blood Drives
    const drive1 = {
        id: 'd1111111-1111-1111-1111-111111111111',
        organizer_id: coordinatorUser.id,
        title: 'Spring Campus Blood Donation Festival 2026',
        description: 'Annual university blood donation drive in partnership with South African National Blood Service. Every donor receives a wellness check and energy snack pack!',
        location_name: 'Great Hall Foyer, Main Campus',
        building_room: 'Hall A, Ground Floor',
        drive_date: '2026-10-15',
        start_time: '09:00:00',
        end_time: '15:00:00',
        slot_duration_minutes: 30,
        capacity_per_slot: 4,
        target_units: 48,
        status: 'UPCOMING',
        created_at: new Date().toISOString()
    };

    const drive2 = {
        id: 'd2222222-2222-2222-2222-222222222222',
        organizer_id: coordinatorUser.id,
        title: 'Engineering Quad Urgent Blood Drive (O- & B+ Focus)',
        description: 'Urgent emergency response drive to replenish regional trauma blood banks. Walk-ins and pre-booked donors welcome.',
        location_name: 'Faculty of Engineering & Technology Atrium',
        building_room: 'Building 4, Room 102',
        drive_date: '2026-10-20',
        start_time: '08:30:00',
        end_time: '14:30:00',
        slot_duration_minutes: 30,
        capacity_per_slot: 5,
        target_units: 60,
        status: 'UPCOMING',
        created_at: new Date().toISOString()
    };

    const drive3 = {
        id: 'd3333333-3333-3333-3333-333333333333',
        organizer_id: coordinatorUser.id,
        title: 'Health Sciences Live Clinic Drive',
        description: 'Active on-site clinic drive run by university phlebotomists.',
        location_name: 'Medical School Clinic Wing',
        building_room: 'Room 205',
        drive_date: new Date().toISOString().split('T')[0],
        start_time: '08:00:00',
        end_time: '16:00:00',
        slot_duration_minutes: 30,
        capacity_per_slot: 6,
        target_units: 80,
        status: 'ONGOING',
        created_at: new Date().toISOString()
    };

    memoryStore.drives.push(drive1, drive2, drive3);

    // 3. Generate Discrete Slots for Drives
    function generateSlots(drive) {
        const slots = [];
        const [startH, startM] = drive.start_time.split(':').map(Number);
        const [endH, endM] = drive.end_time.split(':').map(Number);
        
        let currentMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        let index = 0;
        while (currentMinutes + drive.slot_duration_minutes <= endMinutes) {
            const slotStartH = Math.floor(currentMinutes / 60);
            const slotStartM = currentMinutes % 60;
            const slotEndMinutes = currentMinutes + drive.slot_duration_minutes;
            const slotEndH = Math.floor(slotEndMinutes / 60);
            const slotEndM = slotEndMinutes % 60;

            const formatTime = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

            slots.push({
                id: crypto.randomUUID(),
                drive_id: drive.id,
                start_time: formatTime(slotStartH, slotStartM),
                end_time: formatTime(slotEndH, slotEndM),
                max_capacity: drive.capacity_per_slot,
                current_bookings: index === 0 ? 2 : (index === 1 ? 1 : 0)
            });

            currentMinutes += drive.slot_duration_minutes;
            index++;
        }
        return slots;
    }

    const slots1 = generateSlots(drive1);
    const slots2 = generateSlots(drive2);
    const slots3 = generateSlots(drive3);
    memoryStore.slots.push(...slots1, ...slots2, ...slots3);

    // 4. Sample Appointments
    const appt1 = {
        id: crypto.randomUUID(),
        booking_reference: 'BDC-109283',
        user_id: donorUser1.id,
        drive_id: drive1.id,
        slot_id: slots1[0].id,
        status: 'CONFIRMED',
        pre_screen_passed: true,
        pre_screen_answers: { age_eligible: true, weight_eligible: true, feeling_well: true, travel_clear: true },
        booked_at: new Date(Date.now() - 86400000).toISOString(),
        check_in_time: null,
    };

    const appt2 = {
        id: crypto.randomUUID(),
        booking_reference: 'BDC-748291',
        user_id: donorUser2.id,
        drive_id: drive3.id,
        slot_id: slots3[0].id,
        status: 'CHECKED_IN',
        pre_screen_passed: true,
        pre_screen_answers: { age_eligible: true, weight_eligible: true, feeling_well: true, travel_clear: true },
        booked_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        check_in_time: new Date().toISOString(),
    };

    const appt3 = {
        id: crypto.randomUUID(),
        booking_reference: 'BDC-392817',
        user_id: donorUser1.id,
        drive_id: drive3.id,
        slot_id: slots3[1].id,
        status: 'COMPLETED',
        pre_screen_passed: true,
        pre_screen_answers: { age_eligible: true, weight_eligible: true, feeling_well: true, travel_clear: true },
        booked_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        check_in_time: new Date(Date.now() - 3600000 * 2).toISOString(),
    };

    memoryStore.appointments.push(appt1, appt2, appt3);

    // 5. Sample Donation Record
    const donation1 = {
        id: crypto.randomUUID(),
        appointment_id: appt3.id,
        user_id: donorUser1.id,
        drive_id: drive3.id,
        staff_id: staffUser.id,
        blood_group_collected: 'O-',
        units_collected: 1,
        deferral_reason: null,
        notes: 'Smooth collection, donor hydrated well.',
        recorded_at: new Date(Date.now() - 3600000).toISOString()
    };
    memoryStore.donationRecords.push(donation1);

    // 6. Sample Notifications
    memoryStore.notifications.push(
        {
            id: crypto.randomUUID(),
            user_id: donorUser1.id,
            title: 'Appointment Confirmed',
            message: 'Your slot for Spring Campus Blood Donation Festival is confirmed for 09:00 AM on 15 Oct 2026.',
            type: 'CONFIRMATION',
            is_read: false,
            created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: crypto.randomUUID(),
            user_id: donorUser1.id,
            title: 'Hydration & Nutrition Tip',
            message: 'Remember to drink at least 500ml of water and eat a healthy meal before your donation.',
            type: 'REMINDER',
            is_read: false,
            created_at: new Date(Date.now() - 43200000).toISOString()
        },
        {
            id: crypto.randomUUID(),
            user_id: coordinatorUser.id,
            title: 'Drive Setup Complete',
            message: 'Your Spring Campus Blood Donation Festival has generated 12 slots with 48 unit capacity.',
            type: 'INFO',
            is_read: true,
            created_at: new Date(Date.now() - 86400000 * 2).toISOString()
        }
    );
}

seedMemoryStore();

// DATA ACCESS LAYER
const DataStore = {
    // USERS
    async findUserByEmail(email) {
        if (isDbConnected()) {
            try {
                const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
                return res.rows[0] || null;
            } catch (e) {
                console.error('DB error in findUserByEmail, using fallback:', e.message);
            }
        }
        return memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },

    async findUserById(id) {
        if (isDbConnected()) {
            try {
                const res = await query('SELECT * FROM users WHERE id = $1', [id]);
                return res.rows[0] || null;
            } catch (e) {
                console.error('DB error in findUserById, using fallback:', e.message);
            }
        }
        return memoryStore.users.find(u => u.id === id) || null;
    },

    async createUser({ full_name, email, password_hash, role = 'DONOR', blood_group = null, phone = null, date_of_birth = null }) {
        const id = crypto.randomUUID();
        const created_at = new Date().toISOString();
        if (isDbConnected()) {
            try {
                const res = await query(
                    `INSERT INTO users (id, full_name, email, password_hash, role, blood_group, phone, date_of_birth, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                    [id, full_name, email, password_hash, role, blood_group, phone, date_of_birth, created_at]
                );
                return res.rows[0];
            } catch (e) {
                console.error('DB error in createUser, using fallback:', e.message);
            }
        }
        const newUser = { id, full_name, email, password_hash, role, blood_group, phone, date_of_birth, last_donation_date: null, created_at };
        memoryStore.users.push(newUser);
        return newUser;
    },

    async updateUser(id, updates) {
        if (isDbConnected()) {
            try {
                const fields = [];
                const values = [];
                let idx = 1;
                for (const [key, val] of Object.entries(updates)) {
                    fields.push(`${key} = $${idx++}`);
                    values.push(val);
                }
                values.push(id);
                const res = await query(
                    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
                    values
                );
                return res.rows[0] || null;
            } catch (e) {
                console.error('DB error in updateUser, using fallback:', e.message);
            }
        }
        const user = memoryStore.users.find(u => u.id === id);
        if (user) {
            Object.assign(user, updates);
            return user;
        }
        return null;
    },

    async getAllUsers() {
        if (isDbConnected()) {
            try {
                const res = await query('SELECT id, full_name, email, role, blood_group, phone, date_of_birth, last_donation_date, created_at FROM users ORDER BY created_at DESC');
                return res.rows;
            } catch (e) {
                console.error('DB error in getAllUsers, using fallback:', e.message);
            }
        }
        return memoryStore.users.map(({ password_hash, ...rest }) => rest);
    },

    // DRIVES & DYNAMIC SLOTS
    async createDrive({ organizer_id, title, description, location_name, building_room, drive_date, start_time, end_time, slot_duration_minutes = 30, capacity_per_slot = 4, target_units = 50 }) {
        const driveId = crypto.randomUUID();
        const created_at = new Date().toISOString();

        // Calculate discrete slot intervals
        const [startH, startM] = start_time.split(':').map(Number);
        const [endH, endM] = end_time.split(':').map(Number);
        let currentMin = startH * 60 + startM;
        const endMin = endH * 60 + endM;

        const generatedSlots = [];
        while (currentMin + Number(slot_duration_minutes) <= endMin) {
            const sH = Math.floor(currentMin / 60);
            const sM = currentMin % 60;
            const eMin = currentMin + Number(slot_duration_minutes);
            const eH = Math.floor(eMin / 60);
            const eM = eMin % 60;

            const format = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

            generatedSlots.push({
                id: crypto.randomUUID(),
                drive_id: driveId,
                start_time: format(sH, sM),
                end_time: format(eH, eM),
                max_capacity: Number(capacity_per_slot),
                current_bookings: 0
            });
            currentMin += Number(slot_duration_minutes);
        }

        if (isDbConnected()) {
            try {
                return await executeTransaction(async (client) => {
                    const driveRes = await client.query(
                        `INSERT INTO drives (id, organizer_id, title, description, location_name, building_room, drive_date, start_time, end_time, slot_duration_minutes, capacity_per_slot, target_units, status, created_at)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'UPCOMING', $13) RETURNING *`,
                        [driveId, organizer_id, title, description, location_name, building_room, drive_date, start_time, end_time, slot_duration_minutes, capacity_per_slot, target_units, created_at]
                    );
                    const drive = driveRes.rows[0];

                    for (const slot of generatedSlots) {
                        await client.query(
                            `INSERT INTO slots (id, drive_id, start_time, end_time, max_capacity, current_bookings)
                             VALUES ($1, $2, $3, $4, $5, $6)`,
                            [slot.id, slot.drive_id, slot.start_time, slot.end_time, slot.max_capacity, slot.current_bookings]
                        );
                    }

                    return { ...drive, slots: generatedSlots };
                });
            } catch (e) {
                console.error('DB error in createDrive, using fallback:', e.message);
            }
        }

        const drive = {
            id: driveId,
            organizer_id,
            title,
            description,
            location_name,
            building_room,
            drive_date,
            start_time,
            end_time,
            slot_duration_minutes: Number(slot_duration_minutes),
            capacity_per_slot: Number(capacity_per_slot),
            target_units: Number(target_units),
            status: 'UPCOMING',
            created_at
        };
        memoryStore.drives.push(drive);
        memoryStore.slots.push(...generatedSlots);
        return { ...drive, slots: generatedSlots };
    },

    async getAllDrives(filterStatus = null) {
        let drives = [];
        if (isDbConnected()) {
            try {
                const queryStr = filterStatus 
                    ? 'SELECT d.*, u.full_name as organizer_name FROM drives d LEFT JOIN users u ON d.organizer_id = u.id WHERE d.status = $1 ORDER BY d.drive_date ASC, d.start_time ASC'
                    : 'SELECT d.*, u.full_name as organizer_name FROM drives d LEFT JOIN users u ON d.organizer_id = u.id ORDER BY d.drive_date ASC, d.start_time ASC';
                const res = await query(queryStr, filterStatus ? [filterStatus] : []);
                drives = res.rows;
            } catch (e) {
                console.error('DB error in getAllDrives, using fallback:', e.message);
                drives = memoryStore.drives;
            }
        } else {
            drives = filterStatus ? memoryStore.drives.filter(d => d.status === filterStatus) : memoryStore.drives;
        }

        // Attach slots & live booking aggregate counts
        return Promise.all(drives.map(async (drive) => {
            const slots = await this.getSlotsByDriveId(drive.id);
            const totalCapacity = slots.reduce((acc, s) => acc + Number(s.max_capacity), 0);
            const totalBookings = slots.reduce((acc, s) => acc + Number(s.current_bookings), 0);
            return {
                ...drive,
                slots,
                total_capacity: totalCapacity,
                total_bookings: totalBookings,
                available_spots: Math.max(0, totalCapacity - totalBookings)
            };
        }));
    },

    async getDriveById(id) {
        let drive = null;
        if (isDbConnected()) {
            try {
                const res = await query('SELECT d.*, u.full_name as organizer_name FROM drives d LEFT JOIN users u ON d.organizer_id = u.id WHERE d.id = $1', [id]);
                drive = res.rows[0] || null;
            } catch (e) {
                console.error('DB error in getDriveById, using fallback:', e.message);
            }
        }
        if (!drive) {
            drive = memoryStore.drives.find(d => d.id === id) || null;
        }
        if (!drive) return null;

        const slots = await this.getSlotsByDriveId(drive.id);
        const totalCapacity = slots.reduce((acc, s) => acc + Number(s.max_capacity), 0);
        const totalBookings = slots.reduce((acc, s) => acc + Number(s.current_bookings), 0);

        return {
            ...drive,
            slots,
            total_capacity: totalCapacity,
            total_bookings: totalBookings,
            available_spots: Math.max(0, totalCapacity - totalBookings)
        };
    },

    async updateDrive(id, updates) {
        if (isDbConnected()) {
            try {
                const fields = [];
                const values = [];
                let idx = 1;
                for (const [key, val] of Object.entries(updates)) {
                    fields.push(`${key} = $${idx++}`);
                    values.push(val);
                }
                values.push(id);
                const res = await query(`UPDATE drives SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
                return res.rows[0] || null;
            } catch (e) {
                console.error('DB error in updateDrive, using fallback:', e.message);
            }
        }
        const drive = memoryStore.drives.find(d => d.id === id);
        if (drive) {
            Object.assign(drive, updates);
            return drive;
        }
        return null;
    },

    async deleteDrive(id) {
        if (isDbConnected()) {
            try {
                await query('DELETE FROM drives WHERE id = $1', [id]);
                return true;
            } catch (e) {
                console.error('DB error in deleteDrive, using fallback:', e.message);
            }
        }
        const index = memoryStore.drives.findIndex(d => d.id === id);
        if (index !== -1) {
            memoryStore.drives.splice(index, 1);
            memoryStore.slots = memoryStore.slots.filter(s => s.drive_id !== id);
            return true;
        }
        return false;
    },

    async getSlotsByDriveId(driveId) {
        if (isDbConnected()) {
            try {
                const res = await query('SELECT * FROM slots WHERE drive_id = $1 ORDER BY start_time ASC', [driveId]);
                return res.rows;
            } catch (e) {
                console.error('DB error in getSlotsByDriveId, using fallback:', e.message);
            }
        }
        return memoryStore.slots.filter(s => s.drive_id === driveId).sort((a, b) => a.start_time.localeCompare(b.start_time));
    },

    async getSlotById(slotId) {
        if (isDbConnected()) {
            try {
                const res = await query('SELECT * FROM slots WHERE id = $1', [slotId]);
                return res.rows[0] || null;
            } catch (e) {
                console.error('DB error in getSlotById, using fallback:', e.message);
            }
        }
        return memoryStore.slots.find(s => s.id === slotId) || null;
    },

    // APPOINTMENTS & TRANSACTIONAL LOCKING
    // CRITICAL: Slot booking executes with PostgreSQL "SELECT ... FOR UPDATE" to guarantee zero double-booking under race conditions
    async bookAppointment({ user_id, drive_id, slot_id, pre_screen_passed = true, pre_screen_answers = {} }) {
        const booking_reference = `BDC-${Math.floor(100000 + Math.random() * 900000)}`;
        const appointmentId = crypto.randomUUID();
        const booked_at = new Date().toISOString();

        if (isDbConnected()) {
            return await executeTransaction(async (client) => {
                // 1. Transactional Row Lock on Slot
                const slotRes = await client.query('SELECT * FROM slots WHERE id = $1 FOR UPDATE', [slot_id]);
                const slot = slotRes.rows[0];

                if (!slot) {
                    const err = new Error('Selected time slot does not exist');
                    err.statusCode = 404;
                    throw err;
                }

                if (slot.current_bookings >= slot.max_capacity) {
                    const err = new Error('Slot is fully booked. Please select another time slot.');
                    err.statusCode = 409; // 409 Conflict
                    throw err;
                }

                // Check if user already booked this drive
                const existingRes = await client.query(
                    'SELECT * FROM appointments WHERE user_id = $1 AND drive_id = $2 AND status NOT IN (\'CANCELLED\', \'DEFERRED\')',
                    [user_id, drive_id]
                );
                if (existingRes.rows.length > 0) {
                    const err = new Error('You already have an active appointment booked for this blood drive.');
                    err.statusCode = 400;
                    throw err;
                }

                // 2. Increment slot current_bookings atomically
                await client.query(
                    'UPDATE slots SET current_bookings = current_bookings + 1 WHERE id = $1',
                    [slot_id]
                );

                // 3. Create appointment record
                const apptRes = await client.query(
                    `INSERT INTO appointments (id, booking_reference, user_id, drive_id, slot_id, status, pre_screen_passed, pre_screen_answers, booked_at)
                     VALUES ($1, $2, $3, $4, $5, 'CONFIRMED', $6, $7, $8) RETURNING *`,
                    [appointmentId, booking_reference, user_id, drive_id, slot_id, pre_screen_passed, JSON.stringify(pre_screen_answers), booked_at]
                );

                // 4. Create in-app confirmation notification
                await client.query(
                    `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
                     VALUES ($1, $2, $3, $4, 'CONFIRMATION', false, $5)`,
                    [crypto.randomUUID(), user_id, 'Appointment Booked Successfully', `Your donation booking reference is ${booking_reference}.`, booked_at]
                );

                return apptRes.rows[0];
            });
        }

        // In-Memory Fallback with atomic lock
        const slot = memoryStore.slots.find(s => s.id === slot_id);
        if (!slot) {
            const err = new Error('Selected time slot does not exist');
            err.statusCode = 404;
            throw err;
        }

        if (slot.current_bookings >= slot.max_capacity) {
            const err = new Error('Slot is fully booked. Please select another time slot.');
            err.statusCode = 409;
            throw err;
        }

        const existing = memoryStore.appointments.find(
            a => a.user_id === user_id && a.drive_id === drive_id && !['CANCELLED', 'DEFERRED'].includes(a.status)
        );
        if (existing) {
            const err = new Error('You already have an active appointment booked for this blood drive.');
            err.statusCode = 400;
            throw err;
        }

        slot.current_bookings += 1;
        const appt = {
            id: appointmentId,
            booking_reference,
            user_id,
            drive_id,
            slot_id,
            status: 'CONFIRMED',
            pre_screen_passed,
            pre_screen_answers,
            booked_at,
            check_in_time: null
        };
        memoryStore.appointments.push(appt);

        memoryStore.notifications.push({
            id: crypto.randomUUID(),
            user_id,
            title: 'Appointment Booked Successfully',
            message: `Your donation booking reference is ${booking_reference}.`,
            type: 'CONFIRMATION',
            is_read: false,
            created_at: booked_at
        });

        return appt;
    },

    async cancelAppointment(appointmentId, userId = null) {
        if (isDbConnected()) {
            return await executeTransaction(async (client) => {
                const apptRes = await client.query('SELECT * FROM appointments WHERE id = $1 FOR UPDATE', [appointmentId]);
                const appt = apptRes.rows[0];
                if (!appt) {
                    const err = new Error('Appointment not found');
                    err.statusCode = 404;
                    throw err;
                }
                if (userId && appt.user_id !== userId) {
                    const err = new Error('Unauthorized to cancel this appointment');
                    err.statusCode = 403;
                    throw err;
                }
                if (appt.status === 'CANCELLED') {
                    return appt;
                }

                // Decrement slot count
                await client.query('UPDATE slots SET current_bookings = GREATEST(0, current_bookings - 1) WHERE id = $1', [appt.slot_id]);
                // Update appointment
                const updatedRes = await client.query('UPDATE appointments SET status = \'CANCELLED\' WHERE id = $1 RETURNING *', [appointmentId]);
                return updatedRes.rows[0];
            });
        }

        const appt = memoryStore.appointments.find(a => a.id === appointmentId);
        if (!appt) {
            const err = new Error('Appointment not found');
            err.statusCode = 404;
            throw err;
        }
        if (userId && appt.user_id !== userId) {
            const err = new Error('Unauthorized to cancel this appointment');
            err.statusCode = 403;
            throw err;
        }
        if (appt.status !== 'CANCELLED') {
            appt.status = 'CANCELLED';
            const slot = memoryStore.slots.find(s => s.id === appt.slot_id);
            if (slot && slot.current_bookings > 0) {
                slot.current_bookings -= 1;
            }
        }
        return appt;
    },

    async rescheduleAppointment(appointmentId, newSlotId, userId = null) {
        if (isDbConnected()) {
            return await executeTransaction(async (client) => {
                const apptRes = await client.query('SELECT * FROM appointments WHERE id = $1 FOR UPDATE', [appointmentId]);
                const appt = apptRes.rows[0];
                if (!appt) {
                    const err = new Error('Appointment not found');
                    err.statusCode = 404;
                    throw err;
                }
                if (userId && appt.user_id !== userId) {
                    const err = new Error('Unauthorized to reschedule this appointment');
                    err.statusCode = 403;
                    throw err;
                }

                // Lock new slot
                const newSlotRes = await client.query('SELECT * FROM slots WHERE id = $1 FOR UPDATE', [newSlotId]);
                const newSlot = newSlotRes.rows[0];
                if (!newSlot || newSlot.current_bookings >= newSlot.max_capacity) {
                    const err = new Error('New slot is unavailable or fully booked');
                    err.statusCode = 409;
                    throw err;
                }

                // Decrement old slot and increment new slot
                await client.query('UPDATE slots SET current_bookings = GREATEST(0, current_bookings - 1) WHERE id = $1', [appt.slot_id]);
                await client.query('UPDATE slots SET current_bookings = current_bookings + 1 WHERE id = $1', [newSlotId]);

                const updatedRes = await client.query('UPDATE appointments SET slot_id = $1, status = \'CONFIRMED\' WHERE id = $2 RETURNING *', [newSlotId, appointmentId]);
                return updatedRes.rows[0];
            });
        }

        const appt = memoryStore.appointments.find(a => a.id === appointmentId);
        if (!appt) {
            const err = new Error('Appointment not found');
            err.statusCode = 404;
            throw err;
        }
        const oldSlot = memoryStore.slots.find(s => s.id === appt.slot_id);
        const newSlot = memoryStore.slots.find(s => s.id === newSlotId);

        if (!newSlot || newSlot.current_bookings >= newSlot.max_capacity) {
            const err = new Error('New slot is unavailable or fully booked');
            err.statusCode = 409;
            throw err;
        }

        if (oldSlot && oldSlot.current_bookings > 0) oldSlot.current_bookings -= 1;
        newSlot.current_bookings += 1;
        appt.slot_id = newSlotId;
        appt.status = 'CONFIRMED';
        return appt;
    },

    async getUserAppointments(userId) {
        if (isDbConnected()) {
            try {
                const res = await query(
                    `SELECT a.*, d.title as drive_title, d.location_name, d.building_room, d.drive_date,
                            s.start_time as slot_start_time, s.end_time as slot_end_time
                     FROM appointments a
                     JOIN drives d ON a.drive_id = d.id
                     JOIN slots s ON a.slot_id = s.id
                     WHERE a.user_id = $1
                     ORDER BY d.drive_date DESC, s.start_time DESC`,
                    [userId]
                );
                return res.rows;
            } catch (e) {
                console.error('DB error in getUserAppointments, using fallback:', e.message);
            }
        }
        return memoryStore.appointments
            .filter(a => a.user_id === userId)
            .map(a => {
                const drive = memoryStore.drives.find(d => d.id === a.drive_id) || {};
                const slot = memoryStore.slots.find(s => s.id === a.slot_id) || {};
                return {
                    ...a,
                    drive_title: drive.title,
                    location_name: drive.location_name,
                    building_room: drive.building_room,
                    drive_date: drive.drive_date,
                    slot_start_time: slot.start_time,
                    slot_end_time: slot.end_time
                };
            });
    },

    // MEDICAL STAFF ON-SITE LIVE CONSOLE & QUEUE
    async getDriveQueue(driveId) {
        if (isDbConnected()) {
            try {
                const res = await query(
                    `SELECT a.*, u.full_name as donor_name, u.email as donor_email, u.blood_group as donor_blood_group, u.phone as donor_phone,
                            s.start_time as slot_start_time, s.end_time as slot_end_time,
                            dr.units_collected, dr.deferral_reason, dr.blood_group_collected
                     FROM appointments a
                     JOIN users u ON a.user_id = u.id
                     JOIN slots s ON a.slot_id = s.id
                     LEFT JOIN donation_records dr ON a.id = dr.appointment_id
                     WHERE a.drive_id = $1
                     ORDER BY s.start_time ASC, a.booked_at ASC`,
                    [driveId]
                );
                return res.rows;
            } catch (e) {
                console.error('DB error in getDriveQueue, using fallback:', e.message);
            }
        }
        return memoryStore.appointments
            .filter(a => a.drive_id === driveId)
            .map(a => {
                const user = memoryStore.users.find(u => u.id === a.user_id) || {};
                const slot = memoryStore.slots.find(s => s.id === a.slot_id) || {};
                const dr = memoryStore.donationRecords.find(d => d.appointment_id === a.id) || {};
                return {
                    ...a,
                    donor_name: user.full_name,
                    donor_email: user.email,
                    donor_blood_group: user.blood_group,
                    donor_phone: user.phone,
                    slot_start_time: slot.start_time,
                    slot_end_time: slot.end_time,
                    units_collected: dr.units_collected || null,
                    deferral_reason: dr.deferral_reason || null,
                    blood_group_collected: dr.blood_group_collected || null
                };
            });
    },

    async checkInDonor(appointmentId) {
        const check_in_time = new Date().toISOString();
        if (isDbConnected()) {
            try {
                const res = await query(
                    'UPDATE appointments SET status = \'CHECKED_IN\', check_in_time = $1 WHERE id = $2 RETURNING *',
                    [check_in_time, appointmentId]
                );
                return res.rows[0];
            } catch (e) {
                console.error('DB error in checkInDonor, using fallback:', e.message);
            }
        }
        const appt = memoryStore.appointments.find(a => a.id === appointmentId);
        if (appt) {
            appt.status = 'CHECKED_IN';
            appt.check_in_time = check_in_time;
            return appt;
        }
        return null;
    },

    async updateAppointmentStatus(appointmentId, status) {
        if (isDbConnected()) {
            try {
                const res = await query('UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *', [status, appointmentId]);
                return res.rows[0];
            } catch (e) {
                console.error('DB error in updateAppointmentStatus, using fallback:', e.message);
            }
        }
        const appt = memoryStore.appointments.find(a => a.id === appointmentId);
        if (appt) {
            appt.status = status;
            return appt;
        }
        return null;
    },

    async recordDonationOutcome({ appointment_id, staff_id, outcome, units_collected = 1, blood_group_collected = null, deferral_reason = null, notes = '' }) {
        const now = new Date().toISOString();
        const recordId = crypto.randomUUID();

        // 1. Get Appointment
        let appt = null;
        if (isDbConnected()) {
            const apptRes = await query('SELECT * FROM appointments WHERE id = $1', [appointment_id]);
            appt = apptRes.rows[0];
        } else {
            appt = memoryStore.appointments.find(a => a.id === appointment_id);
        }
        if (!appt) {
            const err = new Error('Appointment not found');
            err.statusCode = 404;
            throw err;
        }

        const isCompleted = outcome === 'COMPLETED';
        const newStatus = isCompleted ? 'COMPLETED' : (outcome === 'DEFERRED' ? 'DEFERRED' : 'NO_SHOW');

        if (isDbConnected()) {
            return await executeTransaction(async (client) => {
                // Update appointment status
                await client.query('UPDATE appointments SET status = $1 WHERE id = $2', [newStatus, appointment_id]);

                // Insert or update donation record
                const recordRes = await client.query(
                    `INSERT INTO donation_records (id, appointment_id, user_id, drive_id, staff_id, blood_group_collected, units_collected, deferral_reason, notes, recorded_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                     ON CONFLICT (appointment_id) DO UPDATE
                     SET blood_group_collected = $6, units_collected = $7, deferral_reason = $8, notes = $9, recorded_at = $10
                     RETURNING *`,
                    [recordId, appointment_id, appt.user_id, appt.drive_id, staff_id, blood_group_collected, isCompleted ? units_collected : 0, deferral_reason, notes, now]
                );

                // Update user's last_donation_date and blood group if completed
                if (isCompleted) {
                    const todayDate = now.split('T')[0];
                    await client.query(
                        'UPDATE users SET last_donation_date = $1, blood_group = COALESCE($2, blood_group) WHERE id = $3',
                        [todayDate, blood_group_collected, appt.user_id]
                    );

                    // Send Thank You Notification
                    await client.query(
                        `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
                         VALUES ($1, $2, 'Thank You for Your Donation! ❤️', 'Your contribution helps save up to 3 lives. Your next eligible donation date has been updated.', 'CONFIRMATION', false, $3)`,
                        [crypto.randomUUID(), appt.user_id, now]
                    );
                }

                return recordRes.rows[0];
            });
        }

        // Memory fallback
        appt.status = newStatus;
        const record = {
            id: recordId,
            appointment_id,
            user_id: appt.user_id,
            drive_id: appt.drive_id,
            staff_id,
            blood_group_collected,
            units_collected: isCompleted ? units_collected : 0,
            deferral_reason,
            notes,
            recorded_at: now
        };
        const existingIdx = memoryStore.donationRecords.findIndex(r => r.appointment_id === appointment_id);
        if (existingIdx !== -1) {
            memoryStore.donationRecords[existingIdx] = record;
        } else {
            memoryStore.donationRecords.push(record);
        }

        if (isCompleted) {
            const user = memoryStore.users.find(u => u.id === appt.user_id);
            if (user) {
                user.last_donation_date = now.split('T')[0];
                if (blood_group_collected) user.blood_group = blood_group_collected;
            }
            memoryStore.notifications.push({
                id: crypto.randomUUID(),
                user_id: appt.user_id,
                title: 'Thank You for Your Donation! ❤️',
                message: 'Your contribution helps save up to 3 lives. Your next eligible donation date has been updated.',
                type: 'CONFIRMATION',
                is_read: false,
                created_at: now
            });
        }

        return record;
    },

    // RAPID WALK-IN DONOR INTAKE
    async registerWalkIn({ drive_id, staff_id, full_name, email, phone, blood_group = 'O+', pre_screen_passed = true, slot_id = null }) {
        // 1. Create or Find User
        let user = await this.findUserByEmail(email);
        if (!user) {
            const tempHash = bcrypt.hashSync('walkin123', 10);
            user = await this.createUser({ full_name, email, password_hash: tempHash, role: 'DONOR', blood_group, phone });
        }

        // 2. Determine slot: use specified or first slot
        let targetSlotId = slot_id;
        if (!targetSlotId) {
            const slots = await this.getSlotsByDriveId(drive_id);
            const availableSlot = slots.find(s => s.current_bookings < s.max_capacity) || slots[0];
            targetSlotId = availableSlot ? availableSlot.id : null;
        }

        if (!targetSlotId) {
            const err = new Error('No slot available for walk-in intake');
            err.statusCode = 400;
            throw err;
        }

        // 3. Book and immediately Check-In
        const appt = await this.bookAppointment({
            user_id: user.id,
            drive_id,
            slot_id: targetSlotId,
            pre_screen_passed,
            pre_screen_answers: { walk_in_intake: true, pre_screen_passed: true }
        });

        const checkedInAppt = await this.checkInDonor(appt.id);
        return { user, appointment: checkedInAppt };
    },

    // ANALYTICS & AGGREGATIONS
    async getDriveAnalytics(driveId) {
        const drive = await this.getDriveById(driveId);
        if (!drive) return null;

        const queue = await this.getDriveQueue(driveId);
        const totalBooked = queue.length;
        const checkedInCount = queue.filter(a => ['CHECKED_IN', 'IN_CHAIR', 'COMPLETED'].includes(a.status)).length;
        const completedCount = queue.filter(a => a.status === 'COMPLETED').length;
        const deferredCount = queue.filter(a => a.status === 'DEFERRED').length;
        const noShowCount = queue.filter(a => a.status === 'NO_SHOW').length;

        const totalUnitsCollected = queue
            .filter(a => a.status === 'COMPLETED')
            .reduce((sum, a) => sum + (Number(a.units_collected) || 1), 0);

        const turnoutRate = totalBooked > 0 ? Math.round((completedCount / totalBooked) * 100) : 0;
        const targetProgress = drive.target_units > 0 ? Math.min(100, Math.round((totalUnitsCollected / drive.target_units) * 100)) : 0;

        // Blood Group breakdown
        const bloodGroups = { 'O+': 0, 'O-': 0, 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0 };
        queue.forEach(a => {
            const bg = a.blood_group_collected || a.donor_blood_group || 'O+';
            if (bloodGroups[bg] !== undefined) {
                bloodGroups[bg] += 1;
            } else {
                bloodGroups['O+'] += 1;
            }
        });

        // Hourly distribution
        const hourlyDistribution = {};
        queue.forEach(a => {
            const time = a.slot_start_time ? a.slot_start_time.substring(0, 2) + ':00' : '09:00';
            hourlyDistribution[time] = (hourlyDistribution[time] || 0) + 1;
        });

        // Deferral reasons breakdown
        const deferralReasons = {};
        queue.filter(a => a.status === 'DEFERRED').forEach(a => {
            const reason = a.deferral_reason || 'Low Hemoglobin';
            deferralReasons[reason] = (deferralReasons[reason] || 0) + 1;
        });

        return {
            drive,
            metrics: {
                target_units: drive.target_units,
                total_units_collected: totalUnitsCollected,
                target_progress_percentage: targetProgress,
                total_booked: totalBooked,
                checked_in_count: checkedInCount,
                completed_count: completedCount,
                deferred_count: deferredCount,
                no_show_count: noShowCount,
                turnout_rate_percentage: turnoutRate,
            },
            blood_group_distribution: bloodGroups,
            hourly_distribution: hourlyDistribution,
            deferral_reasons: deferralReasons,
            donor_list: queue
        };
    },

    // NOTIFICATIONS
    async getUserNotifications(userId) {
        if (isDbConnected()) {
            try {
                const res = await query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30', [userId]);
                return res.rows;
            } catch (e) {
                console.error('DB error in getUserNotifications, using fallback:', e.message);
            }
        }
        return memoryStore.notifications.filter(n => n.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
    },

    async markNotificationAsRead(id, userId) {
        if (isDbConnected()) {
            try {
                const res = await query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
                return res.rows[0];
            } catch (e) {
                console.error('DB error in markNotificationAsRead, using fallback:', e.message);
            }
        }
        const notif = memoryStore.notifications.find(n => n.id === id && n.user_id === userId);
        if (notif) notif.is_read = true;
        return notif;
    },

    async markAllNotificationsAsRead(userId) {
        if (isDbConnected()) {
            try {
                await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
                return true;
            } catch (e) {
                console.error('DB error in markAllNotificationsAsRead, using fallback:', e.message);
            }
        }
        memoryStore.notifications.filter(n => n.user_id === userId).forEach(n => { n.is_read = true; });
        return true;
    },

    async broadcastAlert({ title, message, target_blood_groups = [], drive_id = null }) {
        const users = await this.getAllUsers();
        const now = new Date().toISOString();
        const createdNotifs = [];

        for (const user of users) {
            if (user.role === 'DONOR') {
                if (target_blood_groups.length === 0 || target_blood_groups.includes(user.blood_group)) {
                    const notifId = crypto.randomUUID();
                    if (isDbConnected()) {
                        try {
                            await query(
                                `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
                                 VALUES ($1, $2, $3, $4, 'URGENT_BROADCAST', false, $5)`,
                                [notifId, user.id, title, message, now]
                            );
                        } catch (e) {
                            console.error('DB error broadcasting:', e.message);
                        }
                    } else {
                        memoryStore.notifications.push({
                            id: notifId,
                            user_id: user.id,
                            title,
                            message,
                            type: 'URGENT_BROADCAST',
                            is_read: false,
                            created_at: now
                        });
                    }
                    createdNotifs.push({ user_id: user.id, notifId });
                }
            }
        }
        return { sent_count: createdNotifs.length };
    },

    // AUDIT LOGGING
    async logAudit({ user_id = null, action, details = {}, ip_address = '127.0.0.1' }) {
        const id = crypto.randomUUID();
        const created_at = new Date().toISOString();
        if (isDbConnected()) {
            try {
                await query(
                    'INSERT INTO audit_logs (id, user_id, action, details, ip_address, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
                    [id, user_id, action, JSON.stringify(details), ip_address, created_at]
                );
            } catch (e) {
                console.error('Audit log DB error:', e.message);
            }
        } else {
            memoryStore.auditLogs.push({ id, user_id, action, details, ip_address, created_at });
        }
    },

    async getAuditLogs(limit = 100) {
        if (isDbConnected()) {
            try {
                const res = await query(
                    `SELECT al.*, u.full_name, u.email, u.role
                     FROM audit_logs al
                     LEFT JOIN users u ON al.user_id = u.id
                     ORDER BY al.created_at DESC LIMIT $1`,
                    [limit]
                );
                return res.rows;
            } catch (e) {
                console.error('DB error in getAuditLogs, using fallback:', e.message);
            }
        }
        return memoryStore.auditLogs.slice(-limit).reverse().map(l => {
            const u = memoryStore.users.find(usr => usr.id === l.user_id) || {};
            return { ...l, full_name: u.full_name, email: u.email, role: u.role };
        });
    }
};

module.exports = DataStore;
