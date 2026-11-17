const { PrismaClient } = require('@prisma/client');

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
  const { _count, company: _companyRel, applications: _apps, matches: _matches, ...rest } = j;
  return {
    ...rest,
    roles: parseJsonArray(j.roles),
    perks: parseJsonArray(j.perks),
    requiredBadges: parseJsonArray(j.requiredBadges),
    companyName: company ? company.companyName : j.companyName,
    companySector: company ? company.sector : j.companySector,
    companyDescription: company ? (company.description || '') : (j.companyDescription || ''),
    applicantCount: _count?.applications ?? j.applicantCount ?? 0
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
