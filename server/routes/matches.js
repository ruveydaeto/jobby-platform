const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

function createMatchIfNeeded(data, { jobId, candidateId, companyId }) {
  const exists = data.matches.find(m => m.jobId === jobId && m.candidateId === candidateId);
  if (exists) return exists;
  const match = { id: db.nextId(data.matches), jobId, candidateId, companyId, createdAt: new Date().toISOString() };
  data.matches.push(match);
  return match;
}

// direction: 'like' | 'pass'
// candidate ise: { targetType: 'job', targetId: jobId, direction }
// company ise:   { targetType: 'candidate', targetId: candidateUserId, jobId, direction }
router.post('/swipe', requireAuth, (req, res) => {
  const { targetType, targetId, jobId, direction } = req.body;
  if (!['like', 'pass'].includes(direction)) return res.status(400).json({ error: 'Geçersiz yön.' });

  const data = db.load();
  let matched = null;

  if (req.user.role === 'candidate') {
    if (targetType !== 'job') return res.status(400).json({ error: 'Geçersiz hedef.' });
    const job = data.jobs.find(j => j.id === Number(targetId));
    if (!job) return res.status(404).json({ error: 'İlan bulunamadı.' });

    data.swipes.push({
      id: db.nextId(data.swipes), actorRole: 'candidate', actorId: req.user.id,
      targetType: 'job', targetId: job.id, jobId: job.id, direction, createdAt: new Date().toISOString()
    });

    if (direction === 'like') {
      const companyLiked = data.swipes.find(s =>
        s.actorRole === 'company' && s.targetType === 'candidate' &&
        s.targetId === req.user.id && s.jobId === job.id && s.direction === 'like');
      if (companyLiked) {
        matched = createMatchIfNeeded(data, { jobId: job.id, candidateId: req.user.id, companyId: job.companyId });
      }
    }
  } else if (req.user.role === 'company') {
    if (targetType !== 'candidate') return res.status(400).json({ error: 'Geçersiz hedef.' });
    const job = data.jobs.find(j => j.id === Number(jobId));
    if (!job || job.companyId !== req.user.id) return res.status(404).json({ error: 'İlan bulunamadı.' });

    data.swipes.push({
      id: db.nextId(data.swipes), actorRole: 'company', actorId: req.user.id,
      targetType: 'candidate', targetId: Number(targetId), jobId: job.id, direction, createdAt: new Date().toISOString()
    });

    if (direction === 'like') {
      const candidateLiked = data.swipes.find(s =>
        s.actorRole === 'candidate' && s.targetType === 'job' &&
        s.actorId === Number(targetId) && s.jobId === job.id && s.direction === 'like');
      if (candidateLiked) {
        matched = createMatchIfNeeded(data, { jobId: job.id, candidateId: Number(targetId), companyId: req.user.id });
      }
    }
  } else {
    return res.status(403).json({ error: 'Yetkisiz.' });
  }

  db.save(data);
  res.json({ ok: true, matched: Boolean(matched) });
});

// Beğendiğin ama henüz eşleşmemiş olanlar — karşı tarafın onayı bekleniyor
router.get('/pending', requireAuth, (req, res) => {
  const data = db.load();
  let result = [];

  if (req.user.role === 'candidate') {
    const matchedJobIds = new Set(
      data.matches.filter(m => m.candidateId === req.user.id).map(m => m.jobId)
    );
    const likes = data.swipes.filter(s =>
      s.actorRole === 'candidate' && s.actorId === req.user.id &&
      s.direction === 'like' && !matchedJobIds.has(s.jobId));

    const seen = new Set();
    result = likes.map(s => {
      if (seen.has(s.jobId)) return null;
      seen.add(s.jobId);
      const job = data.jobs.find(j => j.id === s.jobId);
      if (!job) return null;
      const company = data.companies.find(c => c.userId === job.companyId);
      return {
        jobId: job.id, jobTitle: job.title, jobCity: job.city, category: job.category,
        eventDate: job.eventDate, payDaily: job.payDaily,
        companyName: company ? company.companyName : '',
        likedAt: s.createdAt
      };
    }).filter(Boolean);
  } else if (req.user.role === 'company') {
    const matchedKeys = new Set(
      data.matches.filter(m => m.companyId === req.user.id).map(m => `${m.jobId}:${m.candidateId}`)
    );
    const likes = data.swipes.filter(s =>
      s.actorRole === 'company' && s.actorId === req.user.id &&
      s.direction === 'like' && !matchedKeys.has(`${s.jobId}:${s.targetId}`));

    result = likes.map(s => {
      const job = data.jobs.find(j => j.id === s.jobId);
      const candidate = data.candidates.find(c => c.userId === s.targetId);
      if (!job) return null;
      return {
        jobId: job.id, jobTitle: job.title, payDaily: job.payDaily,
        candidateId: s.targetId,
        candidateName: candidate ? candidate.fullName : '',
        candidateCity: candidate ? candidate.city : '',
        likedAt: s.createdAt
      };
    }).filter(Boolean);
  }

  res.json(result);
});

router.get('/mine', requireAuth, (req, res) => {
  const data = db.load();
  let result = [];

  if (req.user.role === 'candidate') {
    result = data.matches
      .filter(m => m.candidateId === req.user.id)
      .map(m => {
        const job = data.jobs.find(j => j.id === m.jobId);
        const company = data.companies.find(c => c.userId === m.companyId);
        return {
          id: m.id, createdAt: m.createdAt,
          jobTitle: job ? job.title : '', jobCity: job ? job.city : '', eventDate: job ? job.eventDate : '',
          payDaily: job ? job.payDaily : 0,
          companyName: company ? company.companyName : ''
        };
      });
  } else if (req.user.role === 'company') {
    result = data.matches
      .filter(m => m.companyId === req.user.id)
      .map(m => {
        const job = data.jobs.find(j => j.id === m.jobId);
        const candidate = data.candidates.find(c => c.userId === m.candidateId);
        return {
          id: m.id, createdAt: m.createdAt,
          jobId: m.jobId, candidateId: m.candidateId,
          jobTitle: job ? job.title : '',
          payDaily: job ? job.payDaily : 0,
          candidateName: candidate ? candidate.fullName : '', candidateCity: candidate ? candidate.city : '',
          candidateAge: candidate ? candidate.age : null,
          candidateGender: candidate ? candidate.gender : ''
        };
      });
  }

  res.json(result);
});

module.exports = router;
