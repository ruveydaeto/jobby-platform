const express = require('express');
const { prisma, mapCompany } = require('../db.prisma');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

router.get('/me', requireAuth, requireRole('company'), async (req, res) => {
  try {
    const profile = await prisma.company.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Profil bulunamadı.' });
    res.json(mapCompany(profile));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Profil yüklenemedi.' });
  }
});

router.put('/me', requireAuth, requireRole('company'), async (req, res) => {
  try {
    const { companyName, city, sector, email, phone, website, address, description } = req.body;
    const existing = await prisma.company.findUnique({ where: { userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Profil bulunamadı.' });

    const updated = await prisma.company.update({
      where: { userId: req.user.id },
      data: {
        ...(companyName !== undefined ? { companyName } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(sector !== undefined ? { sector } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(website !== undefined ? { website } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(description !== undefined ? { description } : {}),
        logoSeed: (companyName !== undefined ? companyName : existing.companyName) || existing.logoSeed
      }
    });
    res.json(mapCompany(updated));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Profil güncellenemedi.' });
  }
});

module.exports = router;
