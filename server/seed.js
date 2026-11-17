const bcrypt = require('bcryptjs');
const { prisma, toJsonArray } = require('./db.prisma');

const CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'];
const CATEGORIES = ['Fuar Standı', 'Konser & Etkinlik', 'Tadım & Promosyon', 'Hostes/Host', 'Anket & Saha', 'Depo & Lojistik'];
const REGIONS = ['hepsi', 'avrupa', 'anadolu'];

const CANDIDATE_NAMES = [
  ['Ela', 'Yıldız', 'kadın'], ['Kerem', 'Aksoy', 'erkek'], ['Nil', 'Demir', 'kadın'],
  ['Baran', 'Kaya', 'erkek'], ['Sude', 'Çelik', 'kadın'], ['Emir', 'Şahin', 'erkek'],
  ['Zeynep', 'Arslan', 'kadın'], ['Ege', 'Yılmaz', 'erkek'], ['Defne', 'Korkmaz', 'kadın'],
  ['Kaan', 'Öztürk', 'erkek'], ['Alara', 'Güneş', 'kadın'], ['Toprak', 'Aydın', 'erkek'],
  ['Ceren', 'Bulut', 'kadın'], ['Mert', 'Polat', 'erkek'], ['İpek', 'Doğan', 'kadın'],
  ['Bora', 'Çetin', 'erkek'], ['Yaren', 'Uslu', 'kadın'], ['Arda', 'Kurt', 'erkek'],
  ['Pınar', 'Kaya', 'kadın'], ['Serkan', 'Özdemir', 'erkek'], ['Ayşe', 'Kılıç', 'kadın'],
  ['İbrahim', 'Yalçın', 'erkek'], ['Merve', 'Şahin', 'kadın'], ['Ahmet', 'Duran', 'erkek'],
  ['Fatma', 'Güven', 'kadın'], ['Mustafa', 'Aydemir', 'erkek'], ['Selin', 'Çakır', 'kadın'],
  ['Gökhan', 'Keskin', 'erkek'], ['Didem', 'Aslan', 'kadın'], ['Emre', 'Savaş', 'erkek']
];

const CANDIDATE_BIOS = [
  'Etkinliklerde çalışmayı seven, iletişimi güçlü, esnek programlı biriyim.',
  'Sosyal, enerjik ve yeni insanlarla tanışmayı seviyorum.',
  'Hem öğrenci hem de çalışan. Haftasonları vardiya arıyorum.',
  'Fiziksel olarak aktif, sorun çözebilen biriyim.',
  'Pazarlama ve satış deneyimim var.'
];

const AVAILABILITY = [
  'Hafta sonu ve akşam', 'Her gün (tam zamanlı)', 'Hafta sonu sadece',
  'Esnek (her zaman uygun)', 'Gece vardiyası uygun'
];

const COMPANIES = [
  { name: 'Yeni Rakı', sector: 'İçecek & Etkinlik', city: 'İstanbul', email: 'iletisim@yeniraki.com', phone: '+90 (212) 555-0101', website: 'https://www.yeniraki.com', address: 'Nişantaşı İstanbul', description: 'Tadım ve etkinlik organizasyonları.' },
  { name: 'TechExpo Fuarcılık', sector: 'Fuar', city: 'Ankara', email: 'info@techexpo.com.tr', phone: '+90 (312) 555-0202', website: 'https://www.techexpo.com.tr', address: 'Çankaya Ankara', description: 'Teknoloji fuarları.' },
  { name: 'SoundWave Konser', sector: 'Müzik', city: 'İzmir', email: 'events@soundwave.com.tr', phone: '+90 (232) 555-0303', website: 'https://www.soundwave.com.tr', address: 'Alsancak İzmir', description: 'Konser ve festival.' },
  { name: 'Marka Aktivasyon', sector: 'Pazarlama', city: 'İstanbul', email: 'contact@markaaktivation.com', phone: '+90 (212) 555-0404', website: 'https://www.markaaktivation.com', address: 'Levent İstanbul', description: 'Marka aktivasyonları.' },
  { name: 'Lojistik Bir', sector: 'Lojistik', city: 'Bursa', email: 'hr@lojistikbir.com', phone: '+90 (224) 555-0505', website: 'https://www.lojistikbir.com', address: 'OSB Bursa', description: 'Depo ve lojistik.' }
];

function slugify(s) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
  return s.split('').map(ch => map[ch] || ch).join('').toLowerCase();
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

async function seedIfEmpty() {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;

  const passwordHash = bcrypt.hashSync('demo1234', 8);
  const candidates = [];

  for (let i = 0; i < CANDIDATE_NAMES.length; i++) {
    const [first, last, gender] = CANDIDATE_NAMES[i];
    const user = await prisma.user.create({
      data: {
        email: `${slugify(first)}.${slugify(last)}@ornek.com`,
        passwordHash,
        role: 'candidate',
        candidate: {
          create: {
            fullName: `${first} ${last}`,
            city: CITIES[i % CITIES.length],
            age: 18 + (i % 12),
            gender,
            bio: CANDIDATE_BIOS[i % CANDIDATE_BIOS.length],
            categories: toJsonArray([
              CATEGORIES[i % CATEGORIES.length],
              CATEGORIES[(i + 1) % CATEGORIES.length]
            ]),
            availability: AVAILABILITY[i % AVAILABILITY.length],
            region: REGIONS[i % REGIONS.length],
            avatarSeed: `${first}${last}`
          }
        }
      },
      include: { candidate: true }
    });
    candidates.push(user.candidate);
  }

  const companies = [];
  for (const company of COMPANIES) {
    const user = await prisma.user.create({
      data: {
        email: company.email,
        passwordHash,
        role: 'company',
        company: {
          create: {
            companyName: company.name,
            city: company.city,
            sector: company.sector,
            email: company.email,
            phone: company.phone,
            website: company.website,
            address: company.address,
            description: company.description,
            logoSeed: company.name
          }
        }
      },
      include: { company: true }
    });
    companies.push(user.company);
  }

  const jobDefs = [
    { company: 0, title: 'Rakı Tadım Standı Görevlisi', city: 'İstanbul', category: 'Tadım & Promosyon', description: 'Nişantaşı tadım stant görevlisi.', neededMale: 5, neededFemale: 8, payDaily: 1400, eventDate: daysFromNow(9) },
    { company: 1, title: 'Teknoloji Fuarı Stant Hostesi', city: 'Ankara', category: 'Fuar Standı', description: 'Fuar ziyaretçi karşılama.', neededMale: 2, neededFemale: 6, payDaily: 1200, eventDate: daysFromNow(15) },
    { company: 2, title: 'Konser Sahne Kenarı Ekibi', city: 'İzmir', category: 'Konser & Etkinlik', description: 'Konser giriş kontrolü.', neededMale: 10, neededFemale: 4, payDaily: 1300, eventDate: daysFromNow(22) },
    { company: 3, title: 'Yeni Ürün Lansmanı Saha Ekibi', city: 'İstanbul', category: 'Tadım & Promosyon', description: 'AVM ürün tanıtımı.', neededMale: 3, neededFemale: 3, payDaily: 1100, eventDate: daysFromNow(5) },
    { company: 4, title: 'Depo Envanter Sayım Ekibi', city: 'Bursa', category: 'Depo & Lojistik', description: 'Yıl sonu sayım ekibi.', neededMale: 6, neededFemale: 2, payDaily: 1000, eventDate: daysFromNow(3) },
    { company: 0, title: 'VIP Misafir Ağırlama Görevlisi', city: 'İstanbul', category: 'Hostes/Host', description: 'VIP konuk ağırlama.', neededMale: 3, neededFemale: 5, payDaily: 1800, eventDate: daysFromNow(8) },
    { company: 1, title: 'Anket Saha Görevlisi', city: 'Ankara', category: 'Anket & Saha', description: 'Tüketici araştırması.', neededMale: 4, neededFemale: 6, payDaily: 850, eventDate: daysFromNow(6) },
    { company: 2, title: 'Festival Güvenlik Görevlisi', city: 'İzmir', category: 'Konser & Etkinlik', description: 'Festival güvenlik.', neededMale: 15, neededFemale: 3, payDaily: 1100, eventDate: daysFromNow(20) }
  ];

  const jobs = [];
  for (const j of jobDefs) {
    const job = await prisma.job.create({
      data: {
        companyId: companies[j.company].id,
        title: j.title,
        description: j.description,
        city: j.city,
        category: j.category,
        neededMale: j.neededMale,
        neededFemale: j.neededFemale,
        payDaily: j.payDaily,
        eventDate: j.eventDate,
        status: 'open'
      }
    });
    jobs.push(job);
  }

  for (let ji = 0; ji < jobs.length; ji++) {
    const job = jobs[ji];
    const companyUser = await prisma.company.findUnique({ where: { id: job.companyId } });
    const local = candidates.filter(c => c.city === job.city);
    const pool = local.length >= 3 ? local : candidates;

    for (let k = 0; k < 3; k++) {
      const cand = pool[(ji * 3 + k) % pool.length];
      const mutual = k % 2 === 0;
      if (mutual) {
        await prisma.swipe.create({
          data: {
            actorRole: 'candidate',
            actorId: cand.userId,
            targetType: 'job',
            targetId: job.id,
            jobId: job.id,
            direction: 'like'
          }
        });
      }
      await prisma.swipe.create({
        data: {
          actorRole: 'company',
          actorId: companyUser.userId,
          targetType: 'candidate',
          targetId: cand.userId,
          jobId: job.id,
          direction: 'like'
        }
      });
      if (mutual) {
        await prisma.match.upsert({
          where: { jobId_candidateId: { jobId: job.id, candidateId: cand.id } },
          update: {},
          create: {
            jobId: job.id,
            candidateId: cand.id,
            companyId: job.companyId
          }
        });
      }
    }
  }

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.match.count()
  ]);
  console.log(`Demo verisi (Postgres): ${counts[0]} kullanıcı, ${counts[1]} ilan, ${counts[2]} eşleşme.`);
  console.log('Tüm demo hesapların şifresi: demo1234');
}

if (require.main === module) {
  seedIfEmpty()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { seedIfEmpty };
