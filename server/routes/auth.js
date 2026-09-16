const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { sign } = require('../auth');

const router = express.Router();

router.post('/register', (req, res) => {
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

  const data = db.load();
  if (data.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Bu e-posta ile zaten bir hesap var.' });
  }

  const userId = db.nextId(data.users);
  const user = {
    id: userId,
    email,
    passwordHash: bcrypt.hashSync(password, 8),
    role,
    createdAt: new Date().toISOString()
  };
  data.users.push(user);

  if (role === 'candidate') {
    data.candidates.push({
      userId, fullName: fullName || '', city: city || '', age: null, gender: '',
      bio: '', categories: [], availability: '', avatarSeed: fullName || email
    });
  } else {
    data.companies.push({
      userId, companyName: companyName || '', city: city || '', sector: '', logoSeed: companyName || email
    });
  }

  db.save(data);
  const token = sign(user);
  res.json({ token, role, id: userId });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const data = db.load();
  const user = data.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.passwordHash)) {
    return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
  }
  const token = sign(user);
  res.json({ token, role: user.role, id: user.id });
});

module.exports = router;
