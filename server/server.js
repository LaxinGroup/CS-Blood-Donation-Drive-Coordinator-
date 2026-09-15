
// 1. IMPORT DEPENDENCIES
const express = require('express');
const cors = require('cors'); // Optional: handles Cross-Origin Resource Sharing
require('dotenv').config(); // Optional: loads environment variables from a .env file

// 2. INITIALISE THE APP
const app = express();
const PORT = process.env.PORT || 3000;

// 3. MIDDLEWARE (Processes requests before they hit your routes)
app.use(cors());
app.use(express.json()); // Essential: Allows the server to parse JSON incoming payloads

// 4. ROUTES & ENDPOINTS
app.get('/', (req, res) => {
    res.status(200).json({ message: "Welcome to the server API!" });
});

app.get('/api/health', (req, res) => {
    res.status(200).send("Server is running smoothly.");
});

// 5. START THE SERVER
app.listen(PORT, () => {
    console.log(`Server is happily running on http://localhost:${PORT}`);
});

