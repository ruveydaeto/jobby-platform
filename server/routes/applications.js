const express = require('express');
const { prisma, parseJsonArray } = require('../db.prisma');
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

function isSwipePlaceholder(app) {
  return Boolean(app && String(app.phone || '').includes('Swipe'));
}

router.post('/', requireAuth, requireRole('candidate'), async (req, res) => {
  try {
    const { jobId, phone, coverLetter, availabilityNote, experience } = req.body;

    if (!jobId) return res.status(400).json({ error: 'İlan seçilmedi.' });
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ error: 'Telefon numarası zorunludur.' });
    }
    if (!coverLetter || String(coverLetter).trim().length < 20) {
      return res.status(400).json({ error: 'Ön yazı en az 20 karakter olmalıdır.' });
    }

    const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
    if (!candidate) return res.status(404).json({ error: 'Aday profili bulunamadı.' });

    const job = await prisma.job.findUnique({ where: { id: Number(jobId) } });
    if (!job) return res.status(404).json({ error: 'İlan bulunamadı.' });
    if (job.status !== 'open') return res.status(400).json({ error: 'Bu ilan başvuruya kapalı.' });

    const already = await prisma.application.findUnique({
      where: { jobId_candidateId: { jobId: job.id, candidateId: candidate.id } }
    });

    const payload = {
      phone: String(phone).trim(),
      coverLetter: String(coverLetter).trim(),
      availabilityNote: availabilityNote
        ? String(availabilityNote).trim()
        : (candidate.availability || 'Belirtilmedi'),
      experience: experience ? String(experience).trim() : '',
      companyId: job.companyId
    };

    // Swipe placeholder varsa formu üzerine yaz; gerçek başvuruyu 409 ile engelle
    if (already) {
      if (!isSwipePlaceholder(already) || already.status !== 'pending') {
        return res.status(409).json({ error: 'Bu ilana zaten başvurdun.' });
      }
      const application = await prisma.application.update({
        where: { id: already.id },
        data: payload
      });
      return res.json({
        ok: true,
        application: {
          ...application,
          candidateUserId: req.user.id
        }
      });
    }

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        ...payload,
        status: 'pending'
      }
    });

    res.json({
      ok: true,
      application: {
        ...application,
        candidateUserId: req.user.id
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Başvuru gönderilemedi.' });
  }
});

router.get('/mine', requireAuth, requireRole('candidate'), async (req, res) => {
  try {
    const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
    if (!candidate) return res.json([]);

    const apps = await prisma.application.findMany({
      where: { candidateId: candidate.id },
      include: { job: true, company: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(apps.map(a => ({
      id: a.id,
      status: a.status,
      createdAt: a.createdAt,
      decidedAt: a.decidedAt,
      source: isSwipePlaceholder(a) ? 'swipe' : 'form',
      ...jobSummary(a.job, a.company)
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Başvurular yüklenemedi.' });
  }
});

router.get('/status/:jobId', requireAuth, requireRole('candidate'), async (req, res) => {
  try {
    const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
    if (!candidate) return res.json({ applied: false, status: null, completable: false, source: null });

    const found = await prisma.application.findUnique({
      where: {
        jobId_candidateId: {
          jobId: Number(req.params.jobId),
          candidateId: candidate.id
        }
      }
    });

    const swipePending = Boolean(found && isSwipePlaceholder(found) && found.status === 'pending');
    res.json({
      applied: Boolean(found) && !swipePending,
      status: found ? found.status : null,
      completable: swipePending,
      source: found ? (isSwipePlaceholder(found) ? 'swipe' : 'form') : null
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Durum alınamadı.' });
  }
});

router.get('/incoming', requireAuth, requireRole('company'), async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
    if (!company) return res.json([]);

    const jobIdFilter = req.query.jobId ? Number(req.query.jobId) : null;

    const apps = await prisma.application.findMany({
      where: {
        OR: [
          { companyId: company.id },
          { job: { companyId: company.id } }
        ],
        ...(jobIdFilter ? { jobId: jobIdFilter } : {})
      },
      include: { job: true, candidate: true },
      orderBy: { createdAt: 'desc' }
    });

    const seen = new Set();
    const unique = [];
    for (const a of apps) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      if (a.job && a.companyId !== a.job.companyId) {
        await prisma.application.update({
          where: { id: a.id },
          data: { companyId: a.job.companyId }
        });
        a.companyId = a.job.companyId;
      }
      unique.push(a);
    }

    res.json(unique.map(a => ({
      id: a.id,
      status: a.status,
      createdAt: a.createdAt,
      decidedAt: a.decidedAt,
      phone: a.phone || '',
      coverLetter: a.coverLetter || '',
      availabilityNote: a.availabilityNote || '',
      experience: a.experience || '',
      source: isSwipePlaceholder(a) ? 'swipe' : 'form',
      jobId: a.jobId,
      jobTitle: a.job?.title || '',
      payDaily: a.job?.payDaily || 0,
      candidateId: a.candidate?.userId,
      candidateName: a.candidate?.fullName || 'İsimsiz aday',
      candidateCity: a.candidate?.city || '',
      candidateAge: a.candidate?.age ?? null,
      candidateGender: a.candidate?.gender || '',
      candidateBio: a.candidate?.bio || '',
      candidateCategories: parseJsonArray(a.candidate?.categories)
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Başvurular yüklenemedi.' });
  }
});

router.patch('/:id', requireAuth, requireRole('company'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Geçersiz durum.' });
    }

    const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ error: 'Firma profili bulunamadı.' });

    const application = await prisma.application.findUnique({
      where: { id: Number(req.params.id) },
      include: { job: true }
    });
    if (!application) return res.status(404).json({ error: 'Başvuru bulunamadı.' });

    const ownerCompanyId = application.job?.companyId ?? application.companyId;
    if (ownerCompanyId !== company.id) return res.status(403).json({ error: 'Yetkisiz.' });

    if (application.companyId !== ownerCompanyId) {
      await prisma.application.update({
        where: { id: application.id },
        data: { companyId: ownerCompanyId }
      });
    }

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status, decidedAt: new Date(), companyId: ownerCompanyId }
    });

    let matched = false;
    if (status === 'accepted') {
      const exists = await prisma.match.findUnique({
        where: {
          jobId_candidateId: {
            jobId: application.jobId,
            candidateId: application.candidateId
          }
        }
      });
      if (!exists) {
        await prisma.match.create({
          data: {
            jobId: application.jobId,
            candidateId: application.candidateId,
            companyId: ownerCompanyId
          }
        });
      }
      matched = true;
    } else {
      await prisma.match.deleteMany({
        where: {
          jobId: application.jobId,
          candidateId: application.candidateId
        }
      });
    }

    res.json({ ok: true, status: updated.status, matched });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Başvuru güncellenemedi.' });
  }
});

module.exports = router;
