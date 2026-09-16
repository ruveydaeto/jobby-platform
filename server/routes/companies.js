const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

router.get('/me', requireAuth, requireRole('company'), (req, res) => {
  const data = db.load();
  const profile = data.companies.find(c => c.userId === req.user.id);
  res.json(profile);
});

router.put('/me', requireAuth, requireRole('company'), (req, res) => {
  const { companyName, city, sector, email, phone, website, address, description } = req.body;
  const data = db.load();
  const profile = data.companies.find(c => c.userId === req.user.id);
  if (!profile) return res.status(404).json({ error: 'Profil bulunamadı.' });

  if (companyName !== undefined) profile.companyName = companyName;
  if (city !== undefined) profile.city = city;
  if (sector !== undefined) profile.sector = sector;
  if (email !== undefined) profile.email = email;
  if (phone !== undefined) profile.phone = phone;
  if (website !== undefined) profile.website = website;
  if (address !== undefined) profile.address = address;
  if (description !== undefined) profile.description = description;
  profile.logoSeed = profile.companyName || profile.logoSeed;

  db.save(data);
  res.json(profile);
});

module.exports = router;
