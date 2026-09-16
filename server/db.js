const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

const EMPTY = {
  users: [],           // {id, email, passwordHash, role, createdAt}
  candidates: [],      // {userId, fullName, city, age, gender, bio, categories:[], availability, region, avatarSeed}
  companies: [],       // {userId, companyName, city, sector, email, phone, website, address, description, logoSeed}
  jobs: [],            // {id, companyId, title, description, city, eventDate, category, neededMale, neededFemale, payDaily, status, createdAt}
  swipes: [],          // {id, actorRole, actorId, targetType:'job'|'candidate', targetId, jobId, direction:'like'|'pass', createdAt}
  matches: [],         // {id, jobId, candidateId, companyId, createdAt}
  applications: []     // {id, jobId, candidateId, companyId, phone, coverLetter, availabilityNote, experience, status:'pending'|'accepted'|'rejected', createdAt, decidedAt}
};

function load() {
  if (!fs.existsSync(DB_PATH)) {
    save(EMPTY);
    return JSON.parse(JSON.stringify(EMPTY));
  }
  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  // Şema sonradan büyüdüyse eski kayıtta eksik kalan koleksiyonları tamamla
  Object.keys(EMPTY).forEach(key => {
    if (!Array.isArray(data[key])) data[key] = [];
  });
  return data;
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function nextId(list) {
  return list.length ? Math.max(...list.map(x => x.id)) + 1 : 1;
}

module.exports = { load, save, nextId, DB_PATH };
