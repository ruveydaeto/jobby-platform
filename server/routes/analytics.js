const express = require('express');
const analytics = require('../analytics');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

/**
 * Growth metrics endpoints
 * These are read-only and can be accessed for analytics dashboards
 */

// Overall metrics
router.get('/metrics', (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  res.json(analytics.getMetrics(startDate, endDate));
});

// Funnel analysis
router.get('/funnel', (req, res) => {
  res.json(analytics.getFunnelMetrics());
});

// Daily stats
router.get('/daily', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  res.json(analytics.getDailyStats(days));
});

// Retention
router.get('/retention', (req, res) => {
  res.json(analytics.getRetentionMetrics());
});

// Role-based metrics
router.get('/roles', (req, res) => {
  res.json(analytics.getRoleMetrics());
});

// Raw events (for external analytics tools)
router.get('/events', (req, res) => {
  const data = db.load();
  const limit = parseInt(req.query.limit) || 100;
  res.json({
    total: data.events.length,
    events: data.events.slice(-limit)
  });
});

module.exports = router;
