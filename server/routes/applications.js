const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

function jobSummary(job, company) {
  if (!job) return {};
  return {
    jobId: job.id,
    jobTitle: job.title,
    jobCity: job.city,
    category: job.category,
    eventDate: job.eventDate,
    payDaily: job.payDaily,
    companyName: company ? company.companyName : ''
  };
}

// Aday başvurusu gönderir
router.post('/', requireAuth, requireRole('candidate'), (req, res) => {
  const { jobId, phone, coverLetter, availabilityNote, experience } = req.body;

  if (!jobId) return res.status(400).json({ error: 'İlan seçilmedi.' });
  if (!phone || !String(phone).trim()) {
    return res.status(400).json({ error: 'Telefon numarası zorunludur.' });
  }
  if (!coverLetter || String(coverLetter).trim().length < 20) {
    return res.status(400).json({ error: 'Ön yazı en az 20 karakter olmalıdır.' });
  }
  if (!availabilityNote || !String(availabilityNote).trim()) {
    return res.status(400).json({ error: 'Müsaitlik bilgisi zorunludur.' });
  }

  const data = db.load();
  const job = data.jobs.find(j => j.id === Number(jobId));
  if (!job) return res.status(404).json({ error: 'İlan bulunamadı.' });
  if (job.status !== 'open') return res.status(400).json({ error: 'Bu ilan başvuruya kapalı.' });

  const already = data.applications.find(a => a.jobId === job.id && a.candidateId === req.user.id);
  if (already) return res.status(409).json({ error: 'Bu ilana zaten başvurdun.' });

  const application = {
    id: db.nextId(data.applications),
    jobId: job.id,
    candidateId: req.user.id,
    companyId: job.companyId,
    phone: String(phone).trim(),
    coverLetter: String(coverLetter).trim(),
    availabilityNote: String(availabilityNote).trim(),
    experience: experience ? String(experience).trim() : '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    decidedAt: null
  };
  data.applications.push(application);
  db.save(data);

  res.json({ ok: true, application });
});

// Adayın kendi başvuruları
router.get('/mine', requireAuth, requireRole('candidate'), (req, res) => {
  const data = db.load();
  const result = data.applications
    .filter(a => a.candidateId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(a => {
      const job = data.jobs.find(j => j.id === a.jobId);
      const company = data.companies.find(c => c.userId === a.companyId);
      return {
        id: a.id, status: a.status, createdAt: a.createdAt, decidedAt: a.decidedAt,
        ...jobSummary(job, company)
      };
    });
  res.json(result);
});

// Adayın bu ilana başvurup başvurmadığı — form açılmadan önce kontrol
router.get('/status/:jobId', requireAuth, requireRole('candidate'), (req, res) => {
  const data = db.load();
  const found = data.applications.find(
    a => a.jobId === Number(req.params.jobId) && a.candidateId === req.user.id
  );
  res.json({ applied: Boolean(found), status: found ? found.status : null });
});

// Firmaya gelen başvurular (opsiyonel ?jobId= ile tek ilana filtreli)
router.get('/incoming', requireAuth, requireRole('company'), (req, res) => {
  const data = db.load();
  const jobIdFilter = req.query.jobId ? Number(req.query.jobId) : null;

  const result = data.applications
    .filter(a => a.companyId === req.user.id)
    .filter(a => (jobIdFilter ? a.jobId === jobIdFilter : true))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(a => {
      const job = data.jobs.find(j => j.id === a.jobId);
      const candidate = data.candidates.find(c => c.userId === a.candidateId);
      return {
        id: a.id, status: a.status, createdAt: a.createdAt, decidedAt: a.decidedAt,
        phone: a.phone, coverLetter: a.coverLetter,
        availabilityNote: a.availabilityNote, experience: a.experience,
        jobId: a.jobId, jobTitle: job ? job.title : '', payDaily: job ? job.payDaily : 0,
        candidateId: a.candidateId,
        candidateName: candidate ? candidate.fullName : '',
        candidateCity: candidate ? candidate.city : '',
        candidateAge: candidate ? candidate.age : null,
        candidateGender: candidate ? candidate.gender : '',
        candidateBio: candidate ? candidate.bio : '',
        candidateCategories: candidate ? candidate.categories : []
      };
    });
  res.json(result);
});

// Firma başvuruyu kabul veya reddeder
router.patch('/:id', requireAuth, requireRole('company'), (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Geçersiz durum.' });
  }

  const data = db.load();
  const application = data.applications.find(a => a.id === Number(req.params.id));
  if (!application) return res.status(404).json({ error: 'Başvuru bulunamadı.' });
  if (application.companyId !== req.user.id) return res.status(403).json({ error: 'Yetkisiz.' });

  application.status = status;
  application.decidedAt = new Date().toISOString();

  // Kabul edilen başvuru karşılıklı onay demektir: eşleşmeye de yansısın
  let matched = false;
  if (status === 'accepted') {
    const exists = data.matches.find(
      m => m.jobId === application.jobId && m.candidateId === application.candidateId
    );
    if (!exists) {
      data.matches.push({
        id: db.nextId(data.matches),
        jobId: application.jobId,
        candidateId: application.candidateId,
        companyId: application.companyId,
        createdAt: new Date().toISOString()
      });
    }
    matched = true;
  }

  db.save(data);
  res.json({ ok: true, status: application.status, matched });
});

module.exports = router;
