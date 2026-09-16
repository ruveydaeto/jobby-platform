-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "bio" TEXT,
    "categories" TEXT,
    "availability" TEXT,
    "avatarSeed" TEXT,
    CONSTRAINT "candidates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "companies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "sector" TEXT,
    "city" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "description" TEXT,
    "logoSeed" TEXT,
    CONSTRAINT "companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "neededMale" INTEGER NOT NULL DEFAULT 0,
    "neededFemale" INTEGER NOT NULL DEFAULT 0,
    "payDaily" INTEGER NOT NULL DEFAULT 0,
    "eventDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "matches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobId" INTEGER NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "matches_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "matches_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "matches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "applications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobId" INTEGER NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "coverLetter" TEXT NOT NULL,
    "availabilityNote" TEXT NOT NULL,
    "experience" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" DATETIME,
    CONSTRAINT "applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "applications_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "applications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_userId_key" ON "candidates"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_userId_key" ON "companies"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_jobId_candidateId_key" ON "matches"("jobId", "candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "applications_jobId_candidateId_key" ON "applications"("jobId", "candidateId");
