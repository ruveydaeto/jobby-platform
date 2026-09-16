const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

router.get('/me', requireAuth, requireRole('candidate'), (req, res) => {
  const data = db.load();
  const profile = data.candidates.find(c => c.userId === req.user.id);
  res.json(profile);
});

router.put('/me', requireAuth, requireRole('candidate'), (req, res) => {
  const { fullName, city, age, gender, bio, categories, availability, region } = req.body;
  const data = db.load();
  const profile = data.candidates.find(c => c.userId === req.user.id);
  if (!profile) return res.status(404).json({ error: 'Profil bulunamadı.' });

  if (fullName !== undefined) profile.fullName = fullName;
  if (city !== undefined) profile.city = city;
  if (age !== undefined) profile.age = age;
  if (gender !== undefined) profile.gender = gender;
  if (bio !== undefined) profile.bio = bio;
  if (categories !== undefined) profile.categories = categories;
  if (availability !== undefined) profile.availability = availability;
  if (region !== undefined) profile.region = region;
  profile.avatarSeed = profile.fullName || profile.avatarSeed;

  db.save(data);
  res.json(profile);
});

// Firmanın bir ilan için uygun adayları kaydırması (like/pass) amacıyla listeleme
router.get('/candidates-for-job/:jobId', requireAuth, requireRole('company'), (req, res) => {
  const data = db.load();
  const job = data.jobs.find(j => j.id === Number(req.params.jobId));
  if (!job || job.companyId !== req.user.id) return res.status(404).json({ error: 'İlan bulunamadı.' });

  const alreadySwiped = new Set(
    data.swipes.filter(s => s.actorRole === 'company' && s.actorId === req.user.id && s.jobId === job.id)
      .map(s => s.targetId)
  );

  const candidates = data.candidates.filter(c =>
    !alreadySwiped.has(c.userId) &&
    (c.city === job.city) &&
    (c.categories || []).includes(job.category)
  );

  res.json(candidates);
});

module.exports = router;
