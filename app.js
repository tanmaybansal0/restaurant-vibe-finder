// Required packages
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const venuesRoutes = require('./routes/venues');


// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
app.use(express.json());

// Import routes
const restaurantRoutes = require('./routes/restaurants');

// Use routes
app.use('/api/venues', venuesRoutes);
app.use('/api/restaurants', restaurantRoutes);

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)){
    fs.mkdirSync(publicDir);
}

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;  // Changed from 3000 to 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});