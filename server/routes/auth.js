const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma, toJsonArray } = require('../db.prisma');
const { sign } = require('../auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, role, fullName, companyName, city } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'E-posta, şifre ve rol zorunludur.' });
    }
    if (!['candidate', 'company'].includes(role)) {
      return res.status(400).json({ error: 'Geçersiz rol.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ error: 'E-posta zorunludur.' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (existing) {
      return res.status(409).json({ error: 'Bu e-posta ile zaten bir hesap var.' });
    }

    const passwordHash = bcrypt.hashSync(password, 8);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role,
        ...(role === 'candidate'
          ? {
              candidate: {
                create: {
                  fullName: fullName || '',
                  city: city || '',
                  categories: toJsonArray([]),
                  avatarSeed: fullName || normalizedEmail
                }
              }
            }
          : {
              company: {
                create: {
                  companyName: companyName || '',
                  city: city || '',
                  logoSeed: companyName || normalizedEmail
                }
              }
            })
      }
    });

    const token = sign(user);
    res.json({ token, role, id: user.id });
  } catch (e) {
    console.error(e);
    if (e && e.code === 'P2002') {
      return res.status(409).json({ error: 'Bu e-posta ile zaten bir hesap var.' });
    }
    res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: String(email || '').trim().toLowerCase() }
    });
    if (!user || !bcrypt.compareSync(password || '', user.passwordHash)) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
    }
    const token = sign(user);
    res.json({ token, role: user.role, id: user.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Giriş sırasında bir hata oluştu.' });
  }
});

module.exports = router;
