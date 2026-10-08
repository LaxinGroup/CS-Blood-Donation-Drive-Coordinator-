const DataStore = require('../db/store');

const AnalyticsController = {
    // Get Drive Turnout Analytics
    async getDriveAnalytics(req, res, next) {
        try {
            const { id } = req.params;
            const analytics = await DataStore.getDriveAnalytics(id);

            if (!analytics) {
                return res.status(404).json({ success: false, message: 'Drive not found.' });
            }

            return res.status(200).json({
                success: true,
                analytics
            });
        } catch (err) {
            next(err);
        }
    },

    // CSV Turnout Export
    async exportCsv(req, res, next) {
        try {
            const { id } = req.params;
            const analytics = await DataStore.getDriveAnalytics(id);

            if (!analytics) {
                return res.status(404).json({ success: false, message: 'Drive not found.' });
            }

            const rows = [
                ['CS Blood Donation Drive Coordinator - Turnout Report'],
                [`Drive Title: ${analytics.drive.title}`],
                [`Date: ${analytics.drive.drive_date}`],
                [`Venue: ${analytics.drive.location_name} (${analytics.drive.building_room || ''})`],
                [`Target Units: ${analytics.metrics.target_units} | Units Collected: ${analytics.metrics.total_units_collected} (${analytics.metrics.target_progress_percentage}%)`],
                [`Turnout Rate: ${analytics.metrics.turnout_rate_percentage}% | Total Booked: ${analytics.metrics.total_booked}`],
                [],
                ['Booking Ref', 'Donor Name', 'Email', 'Blood Group', 'Slot Time', 'Status', 'Units Collected', 'Deferral Reason', 'Check-In Time']
            ];

            analytics.donor_list.forEach(item => {
                rows.push([
                    `"${item.booking_reference || ''}"`,
                    `"${item.donor_name || ''}"`,
                    `"${item.donor_email || ''}"`,
                    `"${item.blood_group_collected || item.donor_blood_group || 'N/A'}"`,
                    `"${item.slot_start_time || ''} - ${item.slot_end_time || ''}"`,
                    `"${item.status || ''}"`,
                    `"${item.units_collected || 0}"`,
                    `"${item.deferral_reason || 'None'}"`,
                    `"${item.check_in_time ? new Date(item.check_in_time).toLocaleTimeString() : 'N/A'}"`
                ]);
            });

            const csvString = rows.map(r => r.join(',')).join('\r\n');

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="Drive_Turnout_Report_${id.substring(0, 8)}.csv"`);
            return res.send(csvString);
        } catch (err) {
            next(err);
        }
    },

    // Overall System Metrics
    async getSystemOverview(req, res, next) {
        try {
            const drives = await DataStore.getAllDrives();
            const users = await DataStore.getAllUsers();

            const totalDonors = users.filter(u => u.role === 'DONOR').length;
            const totalDrives = drives.length;
            const upcomingDrives = drives.filter(d => d.status === 'UPCOMING').length;

            let totalUnitsCollectedAllTime = 0;
            for (const drive of drives) {
                const queue = await DataStore.getDriveQueue(drive.id);
                const completed = queue.filter(q => q.status === 'COMPLETED');
                totalUnitsCollectedAllTime += completed.reduce((sum, c) => sum + (Number(c.units_collected) || 1), 0);
            }

            return res.status(200).json({
                success: true,
                overview: {
                    total_donors: totalDonors,
                    total_drives: totalDrives,
                    upcoming_drives: upcomingDrives,
                    total_units_collected_all_time: totalUnitsCollectedAllTime,
                    lives_impacted_estimate: totalUnitsCollectedAllTime * 3
                }
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = AnalyticsController;
