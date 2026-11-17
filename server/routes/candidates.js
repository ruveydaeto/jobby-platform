const express = require('express');
const { prisma, mapCandidate, toJsonArray, parseJsonArray } = require('../db.prisma');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

router.get('/me', requireAuth, requireRole('candidate'), async (req, res) => {
  try {
    const profile = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Profil bulunamadı.' });
    res.json(mapCandidate(profile));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Profil yüklenemedi.' });
  }
});

router.put('/me', requireAuth, requireRole('candidate'), async (req, res) => {
  try {
    const { fullName, city, age, gender, bio, categories, availability, region } = req.body;
    const existing = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Profil bulunamadı.' });

    const updated = await prisma.candidate.update({
      where: { userId: req.user.id },
      data: {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(age !== undefined ? { age: age === null || age === '' ? null : Number(age) } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(categories !== undefined ? { categories: toJsonArray(categories) } : {}),
        ...(availability !== undefined ? { availability } : {}),
        ...(region !== undefined ? { region } : {}),
        avatarSeed: (fullName !== undefined ? fullName : existing.fullName) || existing.avatarSeed
      }
    });
    res.json(mapCandidate(updated));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Profil güncellenemedi.' });
  }
});

router.get('/candidates-for-job/:jobId', requireAuth, requireRole('company'), async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ error: 'Firma profili bulunamadı.' });

    const job = await prisma.job.findFirst({
      where: { id: Number(req.params.jobId), companyId: company.id }
    });
    if (!job) return res.status(404).json({ error: 'İlan bulunamadı.' });

    const alreadySwiped = await prisma.swipe.findMany({
      where: { actorRole: 'company', actorId: req.user.id, jobId: job.id },
      select: { targetId: true }
    });
    const swipedIds = new Set(alreadySwiped.map(s => s.targetId));

    const candidates = await prisma.candidate.findMany({
      where: { city: job.city }
    });

    const filtered = candidates
      .map(mapCandidate)
      .filter(c =>
        !swipedIds.has(c.userId) &&
        parseJsonArray(c.categories).includes(job.category)
      );

    res.json(filtered);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Adaylar yüklenemedi.' });
  }
});

module.exports = router;
