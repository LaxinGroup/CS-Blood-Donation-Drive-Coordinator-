const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');

// Public or donor-authenticated pre-screen check
router.post('/pre-screen', AppointmentController.evaluatePreScreening);

// Protected Donor Appointments
router.post('/', authenticate, AppointmentController.bookAppointment);
router.get('/my-appointments', authenticate, AppointmentController.getMyAppointments);
router.put('/:id/cancel', authenticate, AppointmentController.cancelAppointment);
router.put('/:id/reschedule', authenticate, AppointmentController.rescheduleAppointment);
router.get('/:id/ics', authenticate, AppointmentController.generateIcsInvite);

module.exports = router;
