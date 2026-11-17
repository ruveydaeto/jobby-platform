const express = require('express');
const { prisma } = require('../db.prisma');
const { requireAuth } = require('../auth');

const router = express.Router();

async function createMatchIfNeeded({ jobId, candidateProfileId, companyId }) {
  const exists = await prisma.match.findUnique({
    where: { jobId_candidateId: { jobId, candidateId: candidateProfileId } }
  });
  if (exists) return exists;
  return prisma.match.create({
    data: { jobId, candidateId: candidateProfileId, companyId }
  });
}

async function acceptApplicationIfNeeded({ jobId, candidateProfileId, companyId }) {
  const app = await prisma.application.findUnique({
    where: { jobId_candidateId: { jobId, candidateId: candidateProfileId } }
  });
  if (!app) return;
  if (app.status === 'accepted' && app.companyId === companyId) return;
  await prisma.application.update({
    where: { id: app.id },
    data: {
      status: 'accepted',
      decidedAt: app.decidedAt || new Date(),
      companyId
    }
  });
}

router.post('/swipe', requireAuth, async (req, res) => {
  try {
    const { targetType, targetId, jobId, direction } = req.body;
    if (!['like', 'pass'].includes(direction)) {
      return res.status(400).json({ error: 'Geçersiz yön.' });
    }

    let matched = null;

    if (req.user.role === 'candidate') {
      if (targetType !== 'job') return res.status(400).json({ error: 'Geçersiz hedef.' });
      const job = await prisma.job.findUnique({ where: { id: Number(targetId) } });
      if (!job) return res.status(404).json({ error: 'İlan bulunamadı.' });
      if (job.status !== 'open') return res.status(400).json({ error: 'Bu ilan başvuruya kapalı.' });

      const dup = await prisma.swipe.findFirst({
        where: {
          actorRole: 'candidate',
          actorId: req.user.id,
          jobId: job.id,
          targetType: 'job',
          targetId: job.id
        }
      });
      if (dup) return res.status(409).json({ error: 'Bu ilan için zaten kaydırma var.' });

      await prisma.swipe.create({
        data: {
          actorRole: 'candidate',
          actorId: req.user.id,
          targetType: 'job',
          targetId: job.id,
          jobId: job.id,
          direction
        }
      });

      if (direction === 'like') {
        const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
        if (candidate) {
          // Swipe like da firma "Başvurular" kutusuna düşsün
          const existingApp = await prisma.application.findUnique({
            where: { jobId_candidateId: { jobId: job.id, candidateId: candidate.id } }
          });
          if (!existingApp) {
            await prisma.application.create({
              data: {
                jobId: job.id,
                candidateId: candidate.id,
                companyId: job.companyId,
                phone: 'Swipe ile iletildi',
                coverLetter: 'Aday bu ilanı swipe ile beğendi. Detaylı form doldurulmadı; profilinden inceleyebilirsiniz.',
                availabilityNote: candidate.availability || 'Belirtilmedi',
                experience: candidate.bio || '',
                status: 'pending'
              }
            });
          }

          const companyLiked = await prisma.swipe.findFirst({
            where: {
              actorRole: 'company',
              targetType: 'candidate',
              targetId: req.user.id,
              jobId: job.id,
              direction: 'like'
            }
          });
          if (companyLiked) {
            matched = await createMatchIfNeeded({
              jobId: job.id,
              candidateProfileId: candidate.id,
              companyId: job.companyId
            });
            await acceptApplicationIfNeeded({
              jobId: job.id,
              candidateProfileId: candidate.id,
              companyId: job.companyId
            });
          }
        }
      }
    } else if (req.user.role === 'company') {
      if (targetType !== 'candidate') return res.status(400).json({ error: 'Geçersiz hedef.' });
      const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
      if (!company) return res.status(404).json({ error: 'Firma profili bulunamadı.' });

      const job = await prisma.job.findFirst({
        where: { id: Number(jobId), companyId: company.id }
      });
      if (!job) return res.status(404).json({ error: 'İlan bulunamadı.' });

      const candidateUserId = Number(targetId);
      const dup = await prisma.swipe.findFirst({
        where: {
          actorRole: 'company',
          actorId: req.user.id,
          jobId: job.id,
          targetType: 'candidate',
          targetId: candidateUserId
        }
      });
      if (dup) return res.status(409).json({ error: 'Bu aday için zaten kaydırma var.' });

      await prisma.swipe.create({
        data: {
          actorRole: 'company',
          actorId: req.user.id,
          targetType: 'candidate',
          targetId: candidateUserId,
          jobId: job.id,
          direction
        }
      });

      if (direction === 'like') {
        const candidateLiked = await prisma.swipe.findFirst({
          where: {
            actorRole: 'candidate',
            actorId: candidateUserId,
            targetType: 'job',
            targetId: job.id,
            jobId: job.id,
            direction: 'like'
          }
        });
        if (candidateLiked) {
          const candidate = await prisma.candidate.findUnique({ where: { userId: candidateUserId } });
          if (candidate) {
            matched = await createMatchIfNeeded({
              jobId: job.id,
              candidateProfileId: candidate.id,
              companyId: job.companyId
            });
            await acceptApplicationIfNeeded({
              jobId: job.id,
              candidateProfileId: candidate.id,
              companyId: job.companyId
            });
          }
        }
      }
    } else {
      return res.status(403).json({ error: 'Yetkisiz.' });
    }

    res.json({ ok: true, matched: Boolean(matched) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Kaydırma kaydedilemedi.' });
  }
});

router.get('/pending', requireAuth, async (req, res) => {
  try {
    if (req.user.role === 'candidate') {
      const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
      const matchedJobIds = new Set(
        (candidate
          ? await prisma.match.findMany({ where: { candidateId: candidate.id }, select: { jobId: true } })
          : []
        ).map(m => m.jobId)
      );

      const appliedJobIds = new Set(
        (candidate
          ? await prisma.application.findMany({
              where: { candidateId: candidate.id },
              select: { jobId: true }
            })
          : []
        ).map(a => a.jobId)
      );

      const likes = await prisma.swipe.findMany({
        where: {
          actorRole: 'candidate',
          actorId: req.user.id,
          direction: 'like'
        },
        orderBy: { createdAt: 'desc' }
      });

      const seen = new Set();
      const result = [];
      for (const s of likes) {
        // Application inbox'ta zaten görünenleri pending'den çıkar
        if (seen.has(s.jobId) || matchedJobIds.has(s.jobId) || appliedJobIds.has(s.jobId)) continue;
        seen.add(s.jobId);
        const job = await prisma.job.findUnique({
          where: { id: s.jobId },
          include: { company: true }
        });
        if (!job) continue;
        result.push({
          jobId: job.id,
          jobTitle: job.title,
          jobCity: job.city,
          category: job.category,
          eventDate: job.eventDate,
          payDaily: job.payDaily,
          companyName: job.company?.companyName || '',
          likedAt: s.createdAt
        });
      }
      return res.json(result);
    }

    if (req.user.role === 'company') {
      const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
      if (!company) return res.json([]);

      const matches = await prisma.match.findMany({
        where: { companyId: company.id },
        include: { candidate: true }
      });
      const matchedKeys = new Set(matches.map(m => `${m.jobId}:${m.candidate.userId}`));

      const likes = await prisma.swipe.findMany({
        where: { actorRole: 'company', actorId: req.user.id, direction: 'like' },
        orderBy: { createdAt: 'desc' }
      });

      const result = [];
      for (const s of likes) {
        if (matchedKeys.has(`${s.jobId}:${s.targetId}`)) continue;
        const job = await prisma.job.findUnique({ where: { id: s.jobId } });
        const candidate = await prisma.candidate.findUnique({ where: { userId: s.targetId } });
        if (!job) continue;
        result.push({
          jobId: job.id,
          jobTitle: job.title,
          payDaily: job.payDaily,
          candidateId: s.targetId,
          candidateName: candidate ? candidate.fullName : '',
          candidateCity: candidate ? candidate.city : '',
          likedAt: s.createdAt
        });
      }
      return res.json(result);
    }

    res.json([]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Bekleyenler yüklenemedi.' });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    if (req.user.role === 'candidate') {
      const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
      if (!candidate) return res.json([]);

      const matches = await prisma.match.findMany({
        where: { candidateId: candidate.id },
        include: { job: true, company: true },
        orderBy: { createdAt: 'desc' }
      });

      return res.json(matches.map(m => ({
        id: m.id,
        createdAt: m.createdAt,
        jobId: m.jobId,
        jobTitle: m.job?.title || '',
        jobCity: m.job?.city || '',
        eventDate: m.job?.eventDate || '',
        payDaily: m.job?.payDaily || 0,
        companyName: m.company?.companyName || ''
      })));
    }

    if (req.user.role === 'company') {
      const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
      if (!company) return res.json([]);

      const matches = await prisma.match.findMany({
        where: { companyId: company.id },
        include: { job: true, candidate: true },
        orderBy: { createdAt: 'desc' }
      });

      return res.json(matches.map(m => ({
        id: m.id,
        createdAt: m.createdAt,
        jobId: m.jobId,
        candidateId: m.candidate?.userId,
        jobTitle: m.job?.title || '',
        payDaily: m.job?.payDaily || 0,
        candidateName: m.candidate?.fullName || '',
        candidateCity: m.candidate?.city || '',
        candidateAge: m.candidate?.age ?? null,
        candidateGender: m.candidate?.gender || ''
      })));
    }

    res.json([]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Eşleşmeler yüklenemedi.' });
  }
});

module.exports = router;
