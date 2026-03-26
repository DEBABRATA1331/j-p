require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const galleryRoutes = require('./routes/gallery');
const packagesRoutes = require('./routes/packages');
const { verifyToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS – allow any origin for Vercel/local (restrict in production if needed)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/', (req, res) => res.json({ status: 'J&P Banquet API running ✓' }));

// Public routes
app.use('/api', authRoutes);

// Protected routes (require JWT)
app.use('/api/gallery', verifyToken, galleryRoutes);
app.use('/api/packages', verifyToken, packagesRoutes);

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`✓ J&P Banquet backend running on port ${PORT}`);
});
