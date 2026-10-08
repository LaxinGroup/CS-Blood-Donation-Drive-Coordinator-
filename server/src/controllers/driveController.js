const DataStore = require('../db/store');

const DriveController = {
    // Create new Blood Drive with Dynamic Slot Generator
    async createDrive(req, res, next) {
        try {
            const {
                title,
                description,
                location_name,
                building_room,
                drive_date,
                start_time,
                end_time,
                slot_duration_minutes = 30,
                capacity_per_slot = 4,
                target_units = 50
            } = req.body;

            if (!title || !location_name || !drive_date || !start_time || !end_time) {
                return res.status(400).json({
                    success: false,
                    message: 'Title, location name, drive date, start time, and end time are required.'
                });
            }

            const drive = await DataStore.createDrive({
                organizer_id: req.user.id,
                title,
                description,
                location_name,
                building_room,
                drive_date,
                start_time,
                end_time,
                slot_duration_minutes: Number(slot_duration_minutes),
                capacity_per_slot: Number(capacity_per_slot),
                target_units: Number(target_units)
            });

            await DataStore.logAudit({
                user_id: req.user.id,
                action: 'DRIVE_CREATED',
                details: { drive_id: drive.id, title: drive.title, slots_count: drive.slots ? drive.slots.length : 0 },
                ip_address: req.ip
            });

            return res.status(201).json({
                success: true,
                message: `Blood drive created successfully with ${drive.slots ? drive.slots.length : 0} time slots.`,
                drive
            });
        } catch (err) {
            next(err);
        }
    },

    // Get all drives (with optional status filter)
    async getAllDrives(req, res, next) {
        try {
            const { status } = req.query;
            const drives = await DataStore.getAllDrives(status || null);
            return res.status(200).json({
                success: true,
                count: drives.length,
                drives
            });
        } catch (err) {
            next(err);
        }
    },

    // Get single drive by ID
    async getDriveById(req, res, next) {
        try {
            const { id } = req.params;
            const drive = await DataStore.getDriveById(id);
            if (!drive) {
                return res.status(404).json({ success: false, message: 'Blood drive not found.' });
            }
            return res.status(200).json({
                success: true,
                drive
            });
        } catch (err) {
            next(err);
        }
    },

    // Update drive
    async updateDrive(req, res, next) {
        try {
            const { id } = req.params;
            const existing = await DataStore.getDriveById(id);
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Blood drive not found.' });
            }

            // Only organizer or Admin can update
            if (req.user.role !== 'ADMIN' && existing.organizer_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Forbidden: You are not the organizer of this drive.' });
            }

            const updated = await DataStore.updateDrive(id, req.body);
            await DataStore.logAudit({
                user_id: req.user.id,
                action: 'DRIVE_UPDATED',
                details: { drive_id: id, updates: req.body },
                ip_address: req.ip
            });

            return res.status(200).json({
                success: true,
                message: 'Blood drive updated successfully.',
                drive: updated
            });
        } catch (err) {
            next(err);
        }
    },

    // Delete or cancel drive
    async deleteDrive(req, res, next) {
        try {
            const { id } = req.params;
            const existing = await DataStore.getDriveById(id);
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Blood drive not found.' });
            }

            if (req.user.role !== 'ADMIN' && existing.organizer_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Forbidden: You are not the organizer of this drive.' });
            }

            await DataStore.deleteDrive(id);
            await DataStore.logAudit({
                user_id: req.user.id,
                action: 'DRIVE_DELETED',
                details: { drive_id: id, title: existing.title },
                ip_address: req.ip
            });

            return res.status(200).json({
                success: true,
                message: 'Blood drive deleted successfully.'
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = DriveController;
