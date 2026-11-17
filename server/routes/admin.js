const express = require('express');
const { prisma, mapCandidate, parseJsonArray } = require('../db.prisma');

const router = express.Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';

function checkAdminAuth(req, res, next) {
  const password = req.get('X-Admin-Password');
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.get('/data', checkAdminAuth, async (req, res) => {
  try {
    const [users, candidates, companies, jobs, matches, applications, swipes] = await Promise.all([
      prisma.user.findMany(),
      prisma.candidate.findMany(),
      prisma.company.findMany(),
      prisma.job.findMany(),
      prisma.match.findMany(),
      prisma.application.findMany(),
      prisma.swipe.findMany()
    ]);

    res.json({
      users: users.map(({ passwordHash, ...u }) => u),
      candidates: candidates.map(mapCandidate),
      companies,
      jobs: jobs.map(j => ({
        ...j,
        roles: parseJsonArray(j.roles),
        perks: parseJsonArray(j.perks),
        requiredBadges: parseJsonArray(j.requiredBadges)
      })),
      matches,
      applications,
      swipes
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Admin verisi yüklenemedi.' });
  }
});

module.exports = router;
