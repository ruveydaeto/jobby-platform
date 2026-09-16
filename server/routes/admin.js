const express = require('express');
const db = require('../db');

const router = express.Router();

// Simple password protection
const ADMIN_PASSWORD = 'admin1234';

// Middleware to check admin password
function checkAdminAuth(req, res, next) {
  const password = req.get('X-Admin-Password');
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Get all data
router.get('/data', checkAdminAuth, (req, res) => {
  const data = db.load();
  res.json(data);
});

module.exports = router;
