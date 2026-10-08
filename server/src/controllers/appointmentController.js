const DataStore = require('../db/store');

const AppointmentController = {
    // Pre-screening eligibility evaluator
    async evaluatePreScreening(req, res, next) {
        try {
            const {
                age,
                weight_kg,
                feeling_well = true,
                has_tattoos_recent = false,
                on_antibiotics = false,
                pregnant = false,
                last_donation_date = null
            } = req.body;

            const user = req.user ? await DataStore.findUserById(req.user.id) : null;
            const effectiveLastDonation = last_donation_date || (user ? user.last_donation_date : null);

            let eligible = true;
            const reasons = [];
            let nextEligibleDate = null;

            // 1. Age check (>= 16/18)
            if (age !== undefined && Number(age) < 16) {
                eligible = false;
                reasons.push('Donors must be at least 16 years of age.');
            }

            // 2. Weight check (>= 50kg)
            if (weight_kg !== undefined && Number(weight_kg) < 50) {
                eligible = false;
                reasons.push('Donors must weigh at least 50kg (110 lbs).');
            }

            // 3. Wellness check
            if (feeling_well === false) {
                eligible = false;
                reasons.push('You must be in good health and feeling well on the day of donation.');
            }

            // 4. Recent tattoos / piercings (< 3 months)
            if (has_tattoos_recent === true) {
                eligible = false;
                reasons.push('Tattoos or body piercings within the past 3 months require a temporary deferral.');
            }

            // 5. Antibiotics
            if (on_antibiotics === true) {
                eligible = false;
                reasons.push('Donors currently taking antibiotics must wait 48 hours after completing the course.');
            }

            // 6. Pregnancy
            if (pregnant === true) {
                eligible = false;
                reasons.push('Pregnancy requires deferral until 6 weeks postpartum.');
            }

            // 7. 56-day Cooldown Check
            if (effectiveLastDonation) {
                const lastDate = new Date(effectiveLastDonation);
                const cooldownDays = 56;
                const nextEligible = new Date(lastDate.getTime() + cooldownDays * 24 * 60 * 60 * 1000);
                const today = new Date();

                if (today < nextEligible) {
                    eligible = false;
                    const daysRemaining = Math.ceil((nextEligible - today) / (1000 * 60 * 60 * 24));
                    nextEligibleDate = nextEligible.toISOString().split('T')[0];
                    reasons.push(`Standard cooldown is 56 days between donations. You will be eligible on ${nextEligibleDate} (${daysRemaining} days remaining).`);
                }
            }

            return res.status(200).json({
                success: true,
                eligible,
                reasons,
                next_eligible_date: nextEligibleDate,
                guidelines: 'Stay hydrated (drink 500ml water) and have a healthy snack prior to donation.'
            });
        } catch (err) {
            next(err);
        }
    },

    // Transactional Slot Booking (Protected by PostgreSQL SELECT FOR UPDATE row locking)
    async bookAppointment(req, res, next) {
        try {
            const { drive_id, slot_id, pre_screen_answers = {}, blood_group } = req.body;

            if (!drive_id || !slot_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Drive ID and Slot ID are required to reserve an appointment.'
                });
            }

            // Update user blood group if provided
            if (blood_group && (!req.user.blood_group || req.user.blood_group !== blood_group)) {
                await DataStore.updateUser(req.user.id, { blood_group });
            }

            const appointment = await DataStore.bookAppointment({
                user_id: req.user.id,
                drive_id,
                slot_id,
                pre_screen_passed: true,
                pre_screen_answers
            });

            await DataStore.logAudit({
                user_id: req.user.id,
                action: 'APPOINTMENT_BOOKED',
                details: { appointment_id: appointment.id, reference: appointment.booking_reference, drive_id, slot_id },
                ip_address: req.ip
            });

            return res.status(201).json({
                success: true,
                message: 'Appointment reserved successfully! Please arrive 10 minutes before your slot.',
                appointment
            });
        } catch (err) {
            next(err);
        }
    },

    // Get current user's appointments
    async getMyAppointments(req, res, next) {
        try {
            const appointments = await DataStore.getUserAppointments(req.user.id);
            return res.status(200).json({
                success: true,
                count: appointments.length,
                appointments
            });
        } catch (err) {
            next(err);
        }
    },

    // Cancel appointment and release capacity
    async cancelAppointment(req, res, next) {
        try {
            const { id } = req.params;
            const updated = await DataStore.cancelAppointment(id, req.user.role === 'ADMIN' ? null : req.user.id);

            await DataStore.logAudit({
                user_id: req.user.id,
                action: 'APPOINTMENT_CANCELLED',
                details: { appointment_id: id },
                ip_address: req.ip
            });

            return res.status(200).json({
                success: true,
                message: 'Appointment cancelled. Your time slot has been released for other donors.',
                appointment: updated
            });
        } catch (err) {
            next(err);
        }
    },

    // Reschedule appointment to another slot
    async rescheduleAppointment(req, res, next) {
        try {
            const { id } = req.params;
            const { new_slot_id } = req.body;

            if (!new_slot_id) {
                return res.status(400).json({ success: false, message: 'New slot ID is required to reschedule.' });
            }

            const updated = await DataStore.rescheduleAppointment(id, new_slot_id, req.user.role === 'ADMIN' ? null : req.user.id);

            await DataStore.logAudit({
                user_id: req.user.id,
                action: 'APPOINTMENT_RESCHEDULED',
                details: { appointment_id: id, new_slot_id },
                ip_address: req.ip
            });

            return res.status(200).json({
                success: true,
                message: 'Appointment rescheduled successfully.',
                appointment: updated
            });
        } catch (err) {
            next(err);
        }
    },

    // Download ICS Calendar Invite
    async generateIcsInvite(req, res, next) {
        try {
            const { id } = req.params;
            const appointments = await DataStore.getUserAppointments(req.user.id);
            const appt = appointments.find(a => a.id === id);

            if (!appt) {
                return res.status(404).json({ success: false, message: 'Appointment not found.' });
            }

            const driveDate = appt.drive_date.replace(/-/g, '');
            const startTime = (appt.slot_start_time || '09:00:00').replace(/:/g, '').substring(0, 6);
            const endTime = (appt.slot_end_time || '09:30:00').replace(/:/g, '').substring(0, 6);

            const icsContent = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//CS Blood Donation Drive Coordinator//EN',
                'CALSCALE:GREGORIAN',
                'METHOD:PUBLISH',
                'BEGIN:VEVENT',
                `UID:${appt.id}@campus.blood-donation`,
                `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                `DTSTART:${driveDate}T${startTime}`,
                `DTEND:${driveDate}T${endTime}`,
                `SUMMARY:Blood Donation: ${appt.drive_title}`,
                `DESCRIPTION:Blood Donation Appointment. Reference: ${appt.booking_reference}. Venue: ${appt.location_name} (${appt.building_room || ''}).`,
                `LOCATION:${appt.location_name}, ${appt.building_room || ''}`,
                'STATUS:CONFIRMED',
                'END:VEVENT',
                'END:VCALENDAR'
            ].join('\r\n');

            res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="Blood_Donation_${appt.booking_reference}.ics"`);
            return res.send(icsContent);
        } catch (err) {
            next(err);
        }
    }
};

module.exports = AppointmentController;
