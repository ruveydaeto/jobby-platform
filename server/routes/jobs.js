const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

// Tüm açık iş ilanları (herkese açık)
router.get('/', (req, res) => {
  const data = db.load();
  const jobs = data.jobs.filter(j => j.status === 'open');
  const withCompany = jobs.map(j => {
    const company = data.companies.find(c => c.userId === j.companyId);
    return { ...j, companyName: company ? company.companyName : 'Firma', companySector: company ? company.sector : '' };
  });
  res.json(withCompany);
});

router.post('/', requireAuth, requireRole('company'), (req, res) => {
  const {
    title, description, city, category, neededMale, neededFemale, payDaily, eventDate,
    // Genişletilmiş ilan detayları (tümü isteğe bağlı)
    venue, address, shiftStart, shiftEnd, shiftHours, transferService,
    roles, perks, matchMode, minScore, requiredBadges
  } = req.body;

  if (!title || !city || !category || !eventDate) {
    return res.status(400).json({ error: 'Başlık, şehir, kategori ve tarih zorunludur.' });
  }
  const data = db.load();
  const id = db.nextId(data.jobs);
  const job = {
    id, companyId: req.user.id, title, description: description || '', city, category,
    neededMale: Number(neededMale) || 0, neededFemale: Number(neededFemale) || 0,
    payDaily: Number(payDaily) || 0, eventDate, status: 'open', createdAt: new Date().toISOString(),

    venue: venue || '',
    address: address || '',
    shiftStart: shiftStart || '',
    shiftEnd: shiftEnd || '',
    shiftHours: Number(shiftHours) || 0,
    transferService: Boolean(transferService),
    roles: Array.isArray(roles) ? roles : [],
    perks: Array.isArray(perks) ? perks : [],
    matchMode: matchMode === 'classic' ? 'classic' : 'swipe',
    minScore: Number(minScore) || 0,
    requiredBadges: Array.isArray(requiredBadges) ? requiredBadges : []
  };
  data.jobs.push(job);
  db.save(data);
  res.json(job);
});

router.get('/mine', requireAuth, requireRole('company'), (req, res) => {
  const data = db.load();
  const jobs = data.jobs.filter(j => j.companyId === req.user.id);
  const withCounts = jobs.map(j => ({
    ...j,
    matchCount: data.matches.filter(m => m.jobId === j.id).length,
    applicationCount: data.applications.filter(a => a.jobId === j.id).length,
    pendingApplicationCount: data.applications.filter(a => a.jobId === j.id && a.status === 'pending').length
  }));
  res.json(withCounts);
});

// Adayın kaydırması için, profiline uyan ve henüz kaydırmadığı ilanlar
router.get('/feed', requireAuth, requireRole('candidate'), (req, res) => {
  const data = db.load();
  const profile = data.candidates.find(c => c.userId === req.user.id);
  const alreadySwiped = new Set(
    data.swipes.filter(s => s.actorRole === 'candidate' && s.actorId === req.user.id)
      .map(s => s.targetId)
  );

  let jobs = data.jobs.filter(j => j.status === 'open' && !alreadySwiped.has(j.id));

  if (profile && profile.city) {
    const cityMatches = jobs.filter(j => j.city === profile.city);
    if (cityMatches.length) jobs = cityMatches;
  }
  if (profile && profile.categories && profile.categories.length) {
    const catMatches = jobs.filter(j => profile.categories.includes(j.category));
    if (catMatches.length) jobs = catMatches;
  }

  const withCompany = jobs.map(j => {
    const company = data.companies.find(c => c.userId === j.companyId);
    return { ...j, companyName: company ? company.companyName : 'Firma', companySector: company ? company.sector : '' };
  });

  res.json(withCompany);
});

// Tek ilan detayı — /feed ve /mine ile çakışmaması için en sonda dursun
router.get('/:id', (req, res) => {
  const data = db.load();
  const job = data.jobs.find(j => j.id === Number(req.params.id));
  if (!job) return res.status(404).json({ error: 'İlan bulunamadı.' });

  const company = data.companies.find(c => c.userId === job.companyId);
  res.json({
    ...job,
    companyName: company ? company.companyName : 'Firma',
    companySector: company ? company.sector : '',
    companyCity: company ? company.city : '',
    companyDescription: company ? company.description : '',
    applicantCount: data.applications.filter(a => a.jobId === job.id).length
  });
});

module.exports = router;
