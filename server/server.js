require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Routes will be imported here
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const operationRoutes = require('./routes/operations');
const dashboardRoutes = require('./routes/dashboard');
const locationRoutes = require('./routes/locations');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/locations', locationRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'CoreInventory API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
