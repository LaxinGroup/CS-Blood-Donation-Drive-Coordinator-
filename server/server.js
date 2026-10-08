const express = require('express');
require('dotenv').config();

const createCorsMiddleware = require('./src/middleware/cors');
const errorHandler = require('./src/middleware/errorHandler');
const { initializeDatabase, isDbConnected } = require('./src/config/db');

// Route Handlers
const authRoutes = require('./src/routes/authRoutes');
const driveRoutes = require('./src/routes/driveRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const staffRoutes = require('./src/routes/staffRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(createCorsMiddleware());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Root & Health Check Endpoints
app.get('/', (req, res) => {
    res.status(200).json({
        name: 'CS Blood Donation Drive Coordinator API',
        version: '1.0.0',
        status: 'Operational',
        database_connected: isDbConnected(),
        docs: '/api/health'
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
            connected: isDbConnected(),
            provider: 'PostgreSQL (pg pool with atomic ACID transactions & row locks)'
        },
        cors: {
            allowed_vercel: true,
            allowed_render: true,
            configured_frontend: process.env.FRONTEND_URL || 'http://localhost:3000'
        }
    });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/drives', driveRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Centralized Error Handling
app.use(errorHandler);

// Initialize Database & Start Server
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 CS Blood Donation Drive Coordinator Server running on port ${PORT}`);
        console.log(`🌐 Base API URL: http://localhost:${PORT}/api`);
        console.log(`🔒 CORS configured for Vercel (*.vercel.app), Render (*.onrender.com), and Localhost.`);
    });
});

module.exports = app;
