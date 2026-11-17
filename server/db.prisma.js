const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function resolveDatabaseUrl() {
  if (process.env.VERCEL) {
    const tmpDb = '/tmp/jobby.db';
    const seedDb = path.join(__dirname, 'prisma', 'dev.db');
    if (!fs.existsSync(tmpDb) && fs.existsSync(seedDb)) {
      fs.copyFileSync(seedDb, tmpDb);
    }
    return `file:${tmpDb}`;
  }
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  return `file:${path.join(__dirname, 'prisma', 'dev.db')}`;
}

process.env.DATABASE_URL = resolveDatabaseUrl();

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__jobbyPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__jobbyPrisma = prisma;
}

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toJsonArray(value) {
  if (!value) return '[]';
  if (typeof value === 'string') return value;
  return JSON.stringify(Array.isArray(value) ? value : []);
}

function mapCandidate(c) {
  if (!c) return null;
  return {
    ...c,
    categories: parseJsonArray(c.categories)
  };
}

function mapCompany(c) {
  if (!c) return null;
  return { ...c };
}

function mapJob(j, company) {
  if (!j) return null;
  return {
    ...j,
    roles: parseJsonArray(j.roles),
    perks: parseJsonArray(j.perks),
    requiredBadges: parseJsonArray(j.requiredBadges),
    companyName: company ? company.companyName : j.companyName,
    companySector: company ? company.sector : j.companySector
  };
}

module.exports = {
  prisma,
  parseJsonArray,
  toJsonArray,
  mapCandidate,
  mapCompany,
  mapJob
};
