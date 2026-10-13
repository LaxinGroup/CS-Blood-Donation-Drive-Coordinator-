const { query, executeTransaction, isDbConnected } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function dbUnavailableError() {
    const err = new Error('Database unavailable. Please try again later.');
    err.statusCode = 503;
    return err;
}

function requireDb() {
    if (!isDbConnected()) {
        throw dbUnavailableError();
    }
}

// DATA ACCESS LAYER — PostgreSQL only (no demo / in-memory seed)
const DataStore = {
    // USERS
    async findUserByEmail(email) {
        if (!isDbConnected()) return null;
        const res = await query(
            'SELECT id, full_name, email, password_hash, role, last_donation_date, created_at FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );
        return res.rows[0] || null;
    },

    async findUserById(id) {
        if (!isDbConnected()) return null;
        const res = await query(
            'SELECT id, full_name, email, role, last_donation_date, created_at FROM users WHERE id = $1',
            [id]
        );
        return res.rows[0] || null;
    },

    async createUser({ full_name, email, password_hash, role = 'DONOR' }) {
        requireDb();
        const res = await query(
            `INSERT INTO users (full_name, email, password_hash, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, full_name, email, role, last_donation_date, created_at`,
            [full_name, email, password_hash, role]
        );
        return res.rows[0];
    },

    async updateUser(id, updates) {
        const allowedColumns = ['full_name', 'password_hash', 'role', 'last_donation_date'];
        const validUpdates = {};
        for (const [key, val] of Object.entries(updates)) {
            if (allowedColumns.includes(key)) {
                validUpdates[key] = val;
            }
        }

        if (Object.keys(validUpdates).length === 0) {
            return this.findUserById(id);
        }

        requireDb();
        const fields = [];
        const values = [];
        let idx = 1;
        for (const [key, val] of Object.entries(validUpdates)) {
            fields.push(`${key} = $${idx++}`);
            values.push(val);
        }
        values.push(id);
        const res = await query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, full_name, email, role, last_donation_date, created_at`,
            values
        );
        return res.rows[0] || null;
    },

    async getAllUsers() {
        if (!isDbConnected()) return [];
        const res = await query(
            'SELECT id, full_name, email, role, last_donation_date, created_at FROM users ORDER BY created_at DESC'
        );
        return res.rows;
    },

    // DRIVES & DYNAMIC SLOTS
    async createDrive({
        organizer_id,
        title,
        description,
        location_name,
        building_room,
        drive_date,
        start_time,
        end_time,
        slot_duration_minutes = 30,
        capacity_per_slot = 4,
        target_units = 50,
    }) {
        requireDb();
        const driveId = crypto.randomUUID();
        const created_at = new Date().toISOString();

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
                current_bookings: 0,
            });
            currentMin += Number(slot_duration_minutes);
        }

        return await executeTransaction(async (client) => {
            const driveRes = await client.query(
                `INSERT INTO drives (id, organizer_id, title, description, location_name, building_room, drive_date, start_time, end_time, slot_duration_minutes, capacity_per_slot, target_units, status, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'UPCOMING', $13) RETURNING *`,
                [
                    driveId,
                    organizer_id,
                    title,
                    description,
                    location_name,
                    building_room,
                    drive_date,
                    start_time,
                    end_time,
                    slot_duration_minutes,
                    capacity_per_slot,
                    target_units,
                    created_at,
                ]
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
    },

    async getAllDrives(filterStatus = null) {
        if (!isDbConnected()) return [];

        const queryStr = filterStatus
            ? 'SELECT d.*, u.full_name as organizer_name FROM drives d LEFT JOIN users u ON d.organizer_id = u.id WHERE d.status = $1 ORDER BY d.drive_date ASC, d.start_time ASC'
            : 'SELECT d.*, u.full_name as organizer_name FROM drives d LEFT JOIN users u ON d.organizer_id = u.id ORDER BY d.drive_date ASC, d.start_time ASC';
        const res = await query(queryStr, filterStatus ? [filterStatus] : []);
        const drives = res.rows;

        return Promise.all(
            drives.map(async (drive) => {
                const slots = await this.getSlotsByDriveId(drive.id);
                const totalCapacity = slots.reduce((acc, s) => acc + Number(s.max_capacity), 0);
                const totalBookings = slots.reduce((acc, s) => acc + Number(s.current_bookings), 0);
                return {
                    ...drive,
                    slots,
                    total_capacity: totalCapacity,
                    total_bookings: totalBookings,
                    available_spots: Math.max(0, totalCapacity - totalBookings),
                };
            })
        );
    },

    async getDriveById(id) {
        if (!isDbConnected()) return null;

        const res = await query(
            'SELECT d.*, u.full_name as organizer_name FROM drives d LEFT JOIN users u ON d.organizer_id = u.id WHERE d.id = $1',
            [id]
        );
        const drive = res.rows[0] || null;
        if (!drive) return null;

        const slots = await this.getSlotsByDriveId(drive.id);
        const totalCapacity = slots.reduce((acc, s) => acc + Number(s.max_capacity), 0);
        const totalBookings = slots.reduce((acc, s) => acc + Number(s.current_bookings), 0);

        return {
            ...drive,
            slots,
            total_capacity: totalCapacity,
            total_bookings: totalBookings,
            available_spots: Math.max(0, totalCapacity - totalBookings),
        };
    },

    async updateDrive(id, updates) {
        requireDb();
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
    },

    async deleteDrive(id) {
        requireDb();
        await query('DELETE FROM drives WHERE id = $1', [id]);
        return true;
    },

    async getSlotsByDriveId(driveId) {
        if (!isDbConnected()) return [];
        const res = await query('SELECT * FROM slots WHERE drive_id = $1 ORDER BY start_time ASC', [driveId]);
        return res.rows;
    },

    async getSlotById(slotId) {
        if (!isDbConnected()) return null;
        const res = await query('SELECT * FROM slots WHERE id = $1', [slotId]);
        return res.rows[0] || null;
    },

    // APPOINTMENTS & TRANSACTIONAL LOCKING
    async bookAppointment({ user_id, drive_id, slot_id, pre_screen_passed = true, pre_screen_answers = {} }) {
        requireDb();
        const booking_reference = `BDC-${Math.floor(100000 + Math.random() * 900000)}`;
        const appointmentId = crypto.randomUUID();
        const booked_at = new Date().toISOString();

        return await executeTransaction(async (client) => {
            const slotRes = await client.query('SELECT * FROM slots WHERE id = $1 FOR UPDATE', [slot_id]);
            const slot = slotRes.rows[0];

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

            const existingRes = await client.query(
                "SELECT * FROM appointments WHERE user_id = $1 AND drive_id = $2 AND status NOT IN ('CANCELLED', 'DEFERRED')",
                [user_id, drive_id]
            );
            if (existingRes.rows.length > 0) {
                const err = new Error('You already have an active appointment booked for this blood drive.');
                err.statusCode = 400;
                throw err;
            }

            await client.query('UPDATE slots SET current_bookings = current_bookings + 1 WHERE id = $1', [slot_id]);

            const apptRes = await client.query(
                `INSERT INTO appointments (id, booking_reference, user_id, drive_id, slot_id, status, pre_screen_passed, pre_screen_answers, booked_at)
                 VALUES ($1, $2, $3, $4, $5, 'CONFIRMED', $6, $7, $8) RETURNING *`,
                [
                    appointmentId,
                    booking_reference,
                    user_id,
                    drive_id,
                    slot_id,
                    pre_screen_passed,
                    JSON.stringify(pre_screen_answers),
                    booked_at,
                ]
            );

            await client.query(
                `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
                 VALUES ($1, $2, $3, $4, 'CONFIRMATION', false, $5)`,
                [
                    crypto.randomUUID(),
                    user_id,
                    'Appointment Booked Successfully',
                    `Your donation booking reference is ${booking_reference}.`,
                    booked_at,
                ]
            );

            return apptRes.rows[0];
        });
    },

    async cancelAppointment(appointmentId, userId = null) {
        requireDb();
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

            await client.query(
                'UPDATE slots SET current_bookings = GREATEST(0, current_bookings - 1) WHERE id = $1',
                [appt.slot_id]
            );
            const updatedRes = await client.query(
                "UPDATE appointments SET status = 'CANCELLED' WHERE id = $1 RETURNING *",
                [appointmentId]
            );
            return updatedRes.rows[0];
        });
    },

    async rescheduleAppointment(appointmentId, newSlotId, userId = null) {
        requireDb();
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

            const newSlotRes = await client.query('SELECT * FROM slots WHERE id = $1 FOR UPDATE', [newSlotId]);
            const newSlot = newSlotRes.rows[0];
            if (!newSlot || newSlot.current_bookings >= newSlot.max_capacity) {
                const err = new Error('New slot is unavailable or fully booked');
                err.statusCode = 409;
                throw err;
            }

            await client.query(
                'UPDATE slots SET current_bookings = GREATEST(0, current_bookings - 1) WHERE id = $1',
                [appt.slot_id]
            );
            await client.query('UPDATE slots SET current_bookings = current_bookings + 1 WHERE id = $1', [newSlotId]);

            const updatedRes = await client.query(
                "UPDATE appointments SET slot_id = $1, status = 'CONFIRMED' WHERE id = $2 RETURNING *",
                [newSlotId, appointmentId]
            );
            return updatedRes.rows[0];
        });
    },

    async getUserAppointments(userId) {
        if (!isDbConnected()) return [];
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
    },

    // MEDICAL STAFF ON-SITE LIVE CONSOLE & QUEUE
    async getDriveQueue(driveId) {
        if (!isDbConnected()) return [];
        const res = await query(
            `SELECT a.*, u.full_name as donor_name, u.email as donor_email,
                    NULL::text as donor_blood_group, NULL::text as donor_phone,
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
    },

    async checkInDonor(appointmentId) {
        requireDb();
        const check_in_time = new Date().toISOString();
        const res = await query(
            "UPDATE appointments SET status = 'CHECKED_IN', check_in_time = $1 WHERE id = $2 RETURNING *",
            [check_in_time, appointmentId]
        );
        return res.rows[0] || null;
    },

    async updateAppointmentStatus(appointmentId, status) {
        requireDb();
        const res = await query('UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *', [
            status,
            appointmentId,
        ]);
        return res.rows[0] || null;
    },

    async recordDonationOutcome({
        appointment_id,
        staff_id,
        outcome,
        units_collected = 1,
        blood_group_collected = null,
        deferral_reason = null,
        notes = '',
    }) {
        requireDb();
        const now = new Date().toISOString();
        const recordId = crypto.randomUUID();

        const apptRes = await query('SELECT * FROM appointments WHERE id = $1', [appointment_id]);
        const appt = apptRes.rows[0];
        if (!appt) {
            const err = new Error('Appointment not found');
            err.statusCode = 404;
            throw err;
        }

        const isCompleted = outcome === 'COMPLETED';
        const newStatus = isCompleted ? 'COMPLETED' : outcome === 'DEFERRED' ? 'DEFERRED' : 'NO_SHOW';

        return await executeTransaction(async (client) => {
            await client.query('UPDATE appointments SET status = $1 WHERE id = $2', [newStatus, appointment_id]);

            const recordRes = await client.query(
                `INSERT INTO donation_records (id, appointment_id, user_id, drive_id, staff_id, blood_group_collected, units_collected, deferral_reason, notes, recorded_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (appointment_id) DO UPDATE
                 SET blood_group_collected = $6, units_collected = $7, deferral_reason = $8, notes = $9, recorded_at = $10
                 RETURNING *`,
                [
                    recordId,
                    appointment_id,
                    appt.user_id,
                    appt.drive_id,
                    staff_id,
                    blood_group_collected,
                    isCompleted ? units_collected : 0,
                    deferral_reason,
                    notes,
                    now,
                ]
            );

            if (isCompleted) {
                const todayDate = now.split('T')[0];
                await client.query('UPDATE users SET last_donation_date = $1 WHERE id = $2', [
                    todayDate,
                    appt.user_id,
                ]);

                await client.query(
                    `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
                     VALUES ($1, $2, 'Thank You for Your Donation!', 'Your contribution helps save up to 3 lives. Your next eligible donation date has been updated.', 'CONFIRMATION', false, $3)`,
                    [crypto.randomUUID(), appt.user_id, now]
                );
            }

            return recordRes.rows[0];
        });
    },

    // RAPID WALK-IN DONOR INTAKE
    async registerWalkIn({
        drive_id,
        staff_id,
        full_name,
        email,
        phone,
        blood_group = 'O+',
        pre_screen_passed = true,
        slot_id = null,
    }) {
        requireDb();
        let user = await this.findUserByEmail(email);
        if (!user) {
            const tempHash = bcrypt.hashSync('walkin123', 10);
            user = await this.createUser({
                full_name,
                email,
                password_hash: tempHash,
                role: 'DONOR',
            });
        }

        let targetSlotId = slot_id;
        if (!targetSlotId) {
            const slots = await this.getSlotsByDriveId(drive_id);
            const availableSlot = slots.find((s) => s.current_bookings < s.max_capacity) || slots[0];
            targetSlotId = availableSlot ? availableSlot.id : null;
        }

        if (!targetSlotId) {
            const err = new Error('No slot available for walk-in intake');
            err.statusCode = 400;
            throw err;
        }

        const appt = await this.bookAppointment({
            user_id: user.id,
            drive_id,
            slot_id: targetSlotId,
            pre_screen_passed,
            pre_screen_answers: { walk_in_intake: true, pre_screen_passed: true, phone, blood_group },
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
        const checkedInCount = queue.filter((a) =>
            ['CHECKED_IN', 'IN_CHAIR', 'COMPLETED'].includes(a.status)
        ).length;
        const completedCount = queue.filter((a) => a.status === 'COMPLETED').length;
        const deferredCount = queue.filter((a) => a.status === 'DEFERRED').length;
        const noShowCount = queue.filter((a) => a.status === 'NO_SHOW').length;

        const totalUnitsCollected = queue
            .filter((a) => a.status === 'COMPLETED')
            .reduce((sum, a) => sum + (Number(a.units_collected) || 1), 0);

        const turnoutRate = totalBooked > 0 ? Math.round((completedCount / totalBooked) * 100) : 0;
        const targetProgress =
            drive.target_units > 0
                ? Math.min(100, Math.round((totalUnitsCollected / drive.target_units) * 100))
                : 0;

        const bloodGroups = { 'O+': 0, 'O-': 0, 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0 };
        queue.forEach((a) => {
            const bg = a.blood_group_collected || a.donor_blood_group || 'O+';
            if (bloodGroups[bg] !== undefined) {
                bloodGroups[bg] += 1;
            } else {
                bloodGroups['O+'] += 1;
            }
        });

        const hourlyDistribution = {};
        queue.forEach((a) => {
            const time = a.slot_start_time ? a.slot_start_time.substring(0, 2) + ':00' : '09:00';
            hourlyDistribution[time] = (hourlyDistribution[time] || 0) + 1;
        });

        const deferralReasons = {};
        queue
            .filter((a) => a.status === 'DEFERRED')
            .forEach((a) => {
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
            donor_list: queue,
        };
    },

    // NOTIFICATIONS
    async getUserNotifications(userId) {
        if (!isDbConnected()) return [];
        const res = await query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
            [userId]
        );
        return res.rows;
    },

    async markNotificationAsRead(id, userId) {
        requireDb();
        const res = await query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );
        return res.rows[0] || null;
    },

    async markAllNotificationsAsRead(userId) {
        requireDb();
        await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
        return true;
    },

    async broadcastAlert({ title, message, target_blood_groups = [], drive_id = null }) {
        requireDb();
        const users = await this.getAllUsers();
        const now = new Date().toISOString();
        const createdNotifs = [];

        // users has no blood_group column yet — broadcast reaches all donors
        void target_blood_groups;
        void drive_id;

        for (const user of users) {
            if (user.role !== 'DONOR') continue;

            const notifId = crypto.randomUUID();
            await query(
                `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
                 VALUES ($1, $2, $3, $4, 'URGENT_BROADCAST', false, $5)`,
                [notifId, user.id, title, message, now]
            );
            createdNotifs.push({ user_id: user.id, notifId });
        }
        return { sent_count: createdNotifs.length };
    },

    // AUDIT LOGGING
    async logAudit({ user_id = null, action, details = {}, ip_address = '127.0.0.1' }) {
        if (!isDbConnected()) return;
        const id = crypto.randomUUID();
        const created_at = new Date().toISOString();
        try {
            await query(
                'INSERT INTO audit_logs (id, user_id, action, details, ip_address, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
                [id, user_id, action, JSON.stringify(details), ip_address, created_at]
            );
        } catch (e) {
            console.error('Audit log DB error:', e.message);
        }
    },

    async getAuditLogs(limit = 100) {
        if (!isDbConnected()) return [];
        const res = await query(
            `SELECT al.*, u.full_name, u.email, u.role
             FROM audit_logs al
             LEFT JOIN users u ON al.user_id = u.id
             ORDER BY al.created_at DESC LIMIT $1`,
            [limit]
        );
        return res.rows;
    },
};

module.exports = DataStore;
