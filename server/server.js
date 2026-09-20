const express = require('express');
const cors = require('cors');
const path = require('path');
const { seedIfEmpty } = require('./seed');

seedIfEmpty();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`JOBBY sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});
