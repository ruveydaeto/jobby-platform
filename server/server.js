const app = require('./app');

const PORT = process.env.PORT || 3000;

// Yerel geliştirmede dinle; Vercel serverless'ta app export yeterlidir.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`JOBBY sunucusu http://localhost:${PORT} adresinde çalışıyor`);
  });
}

module.exports = app;
