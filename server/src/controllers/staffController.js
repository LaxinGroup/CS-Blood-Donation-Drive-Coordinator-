const DataStore = require('../db/store');

const StaffController = {
    // Get live check-in queue for drive
    async getDriveQueue(req, res, next) {
        try {
            const { drive_id } = req.params;
            const drive = await DataStore.getDriveById(drive_id);
            if (!drive) {
                return res.status(404).json({ success: false, message: 'Drive not found.' });
            }

            const queue = await DataStore.getDriveQueue(drive_id);
            return res.status(200).json({
                success: true,
                drive,
                count: queue.length,
                queue
            });
        } catch (err) {
            next(err);
        }
    },

    // 1-Click Donor Check-In
    async checkInDonor(req, res, next) {
        try {
            const { id } = req.params;
            const updated = await DataStore.checkInDonor(id);
            if (!updated) {
                return res.status(404).json({ success: false, message: 'Appointment not found.' });
            }

            await DataStore.logAudit({
                user_id: req.user.id,
                action: 'DONOR_CHECKED_IN',
                details: { appointment_id: id, check_in_time: updated.check_in_time },
                ip_address: req.ip
            });

            return res.status(200).json({
                success: true,
                message: 'Donor successfully checked in and moved to waiting queue.',
                appointment: updated
            });
        } catch (err) {
            next(err);
        }
    },

    // Update Live Queue Status (e.g., IN_CHAIR, NO_SHOW)
    async updateQueueStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!['CONFIRMED', 'CHECKED_IN', 'IN_CHAIR', 'COMPLETED', 'DEFERRED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid queue status.' });
            }

            const updated = await DataStore.updateAppointmentStatus(id, status);
            return res.status(200).json({
                success: true,
                message: `Status updated to ${status}.`,
                appointment: updated
            });
        } catch (err) {
            next(err);
        }
    },

    // Phlebotomy Outcome Logging (Completed / Deferred / Units Collected)
    async recordDonationOutcome(req, res, next) {
        try {
            const { id } = req.params;
            const { outcome, units_collected = 1, blood_group_collected, deferral_reason, notes } = req.body;

            if (!['COMPLETED', 'DEFERRED', 'NO_SHOW'].includes(outcome)) {
                return res.status(400).json({ success: false, message: 'Outcome must be COMPLETED, DEFERRED, or NO_SHOW.' });
            }

            const record = await DataStore.recordDonationOutcome({
                appointment_id: id,
                staff_id: req.user.id,
                outcome,
                units_collected: Number(units_collected) || 1,
                blood_group_collected,
                deferral_reason,
                notes
            });

            await DataStore.logAudit({
                user_id: req.user.id,
                action: outcome === 'COMPLETED' ? 'DONATION_COMPLETED' : 'DONATION_DEFERRED',
                details: { appointment_id: id, outcome, units: units_collected, deferral_reason },
                ip_address: req.ip
            });

            return res.status(200).json({
                success: true,
                message: outcome === 'COMPLETED' 
                    ? `Donation logged successfully! ${units_collected} unit(s) recorded.`
                    : 'Deferral recorded with medical notes.',
                record
            });
        } catch (err) {
            next(err);
        }
    },

    // Rapid Walk-In Donor Intake
    async registerWalkIn(req, res, next) {
        try {
            const { drive_id } = req.params;
            const { full_name, email, phone, blood_group, slot_id } = req.body;

            if (!full_name || !email) {
                return res.status(400).json({ success: false, message: 'Donor full name and email are required for walk-in intake.' });
            }

            const result = await DataStore.registerWalkIn({
                drive_id,
                staff_id: req.user.id,
                full_name,
                email,
                phone,
                blood_group: blood_group || 'O+',
                slot_id: slot_id || null
            });

            await DataStore.logAudit({
                user_id: req.user.id,
                action: 'WALKIN_DONOR_REGISTERED',
                details: { drive_id, donor_email: email, appointment_id: result.appointment.id },
                ip_address: req.ip
            });

            return res.status(201).json({
                success: true,
                message: 'Walk-in donor registered and checked in successfully.',
                data: result
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = StaffController;
