const express = require('express');
const { prisma, mapJob, toJsonArray, parseJsonArray } = require('../db.prisma');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'open' },
      include: { company: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs.map(j => mapJob(j, j.company)));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'İlanlar yüklenemedi.' });
  }
});

router.post('/', requireAuth, requireRole('company'), async (req, res) => {
  try {
    const {
      title, description, city, category, neededMale, neededFemale, payDaily, eventDate,
      venue, address, shiftStart, shiftEnd, shiftHours, transferService,
      roles, perks, matchMode, minScore, requiredBadges
    } = req.body;

    if (!title || !city || !category || !eventDate) {
      return res.status(400).json({ error: 'Başlık, şehir, kategori ve tarih zorunludur.' });
    }

    const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ error: 'Firma profili bulunamadı.' });

    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        title,
        description: description || '',
        city,
        category,
        neededMale: Number(neededMale) || 0,
        neededFemale: Number(neededFemale) || 0,
        payDaily: Number(payDaily) || 0,
        eventDate,
        status: 'open',
        venue: venue || '',
        address: address || '',
        shiftStart: shiftStart || '',
        shiftEnd: shiftEnd || '',
        shiftHours: Number(shiftHours) || 0,
        transferService: Boolean(transferService),
        roles: toJsonArray(roles),
        perks: toJsonArray(perks),
        matchMode: matchMode === 'classic' ? 'classic' : 'swipe',
        minScore: Number(minScore) || 0,
        requiredBadges: toJsonArray(requiredBadges)
      },
      include: { company: true }
    });

    res.json(mapJob(job, job.company));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'İlan oluşturulamadı.' });
  }
});

router.get('/mine', requireAuth, requireRole('company'), async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
    if (!company) return res.json([]);

    const jobs = await prisma.job.findMany({
      where: { companyId: company.id },
      include: {
        company: true,
        _count: {
          select: {
            matches: true,
            applications: true
          }
        },
        applications: { where: { status: 'pending' }, select: { id: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(jobs.map(j => ({
      ...mapJob(j, j.company),
      matchCount: j._count.matches,
      applicationCount: j._count.applications,
      pendingApplicationCount: j.applications.length
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'İlanlar yüklenemedi.' });
  }
});

router.get('/feed', requireAuth, requireRole('candidate'), async (req, res) => {
  try {
    const profile = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
    const swiped = await prisma.swipe.findMany({
      where: { actorRole: 'candidate', actorId: req.user.id },
      select: { targetId: true }
    });
    const alreadySwiped = new Set(swiped.map(s => s.targetId));

    let jobs = await prisma.job.findMany({
      where: { status: 'open' },
      include: { company: true },
      orderBy: { createdAt: 'desc' }
    });
    jobs = jobs.filter(j => !alreadySwiped.has(j.id));

    if (profile?.city) {
      const cityMatches = jobs.filter(j => j.city === profile.city);
      if (cityMatches.length) jobs = cityMatches;
    }
    const cats = parseJsonArray(profile?.categories);
    if (cats.length) {
      const catMatches = jobs.filter(j => cats.includes(j.category));
      if (catMatches.length) jobs = catMatches;
    }

    res.json(jobs.map(j => mapJob(j, j.company)));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Feed yüklenemedi.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: Number(req.params.id) },
      include: { company: true }
    });
    if (!job) return res.status(404).json({ error: 'İlan bulunamadı.' });
    res.json(mapJob(job, job.company));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'İlan yüklenemedi.' });
  }
});

module.exports = router;
