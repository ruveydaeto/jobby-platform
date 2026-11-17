const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { seedIfEmpty } = require('./seed');

const app = express();
const publicDir = path.join(__dirname, '..', 'public');

let ready;
function ensureReady() {
  if (!ready) {
    ready = seedIfEmpty().catch((err) => {
      console.error('Seed hatası:', err);
      ready = null;
      throw err;
    });
  }
  return ready;
}

app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    await ensureReady();
    next();
  } catch (e) {
    res.status(500).json({ error: 'Veritabanı hazırlanamadı.' });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));

app.use(express.static(publicDir));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

module.exports = app;
