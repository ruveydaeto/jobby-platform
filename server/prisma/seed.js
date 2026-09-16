const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const CANDIDATE_NAMES = [
  ['Ali', 'Yılmaz', 'male'],
  ['Ayşe', 'Kaya', 'female'],
  ['Mehmet', 'Demir', 'male'],
  ['Fatma', 'Şahin', 'female'],
  ['Zeynep', 'Özkan', 'female'],
  ['Hasan', 'Kılıç', 'male'],
  ['Pınar', 'Kaya', 'female'],
  ['Serkan', 'Özdemir', 'male'],
  ['Gülşah', 'Aydın', 'female'],
  ['Emre', 'Çakır', 'male'],
  ['İrem', 'Yıldız', 'female'],
  ['Cem', 'Güzel', 'male'],
  ['Seda', 'Uğur', 'female'],
  ['Barış', 'Aslan', 'male'],
  ['Deniz', 'Kürşad', 'female'],
  ['Kaan', 'Yaşar', 'male'],
  ['Esin', 'Duran', 'female'],
  ['Volkan', 'Yüzer', 'male'],
  // 12 more...
  ['Neslihan', 'Eren', 'female'],
  ['Özgür', 'Kaya', 'male'],
  ['Şule', 'Akçay', 'female'],
  ['Furkan', 'Karahan', 'male'],
  ['İpek', 'Tuncay', 'female'],
  ['Tarık', 'Demirtaş', 'male'],
  ['Nurcan', 'Polat', 'female'],
  ['Levent', 'Yaman', 'male'],
  ['Ebru', 'Soysal', 'female'],
  ['Kadir', 'Çetin', 'male'],
  ['Şenay', 'Gözde', 'female']
];

const CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'];
const CATEGORIES = ['Tadım & Promosyon', 'Fuar Standı', 'Konser & Etkinlik', 'Hostes/Host', 'Anket & Saha', 'Depo & Lojistik'];
const REGIONS = ['Hepsi', 'Avrupa Yakası', 'Anadolu Yakası'];
const CANDIDATE_BIOS = [
  'Sosyal ve enerjik, etkinlikleri seviyorum',
  'Deneyimli host, profesyonel hizmet',
  'Güvenilir ve hızlı çalışan ekip üyesi',
  'Müşteri memnuniyetini ön planda tutan',
  'Yoğun tempoda çalışmaktan hoşlanan',
  'İletişim becerisi güçlü, dil bilgili',
  'Detaylara dikkat eden, titiz çalışan',
  'Pazarlama ve satış konusunda yetenekli',
  'Teknik bilgisi olan, sorun çözen',
  'Liderlik özellikleri taşıyan kişi'
];
const AVAILABILITY = [
  'Hafta sonu müsaitim',
  'Tam zamanlı çalışabilirim',
  'Esnek vardiyalar tercih ederim',
  'Gündüz saatleri uygun',
  'Akşam ve gece vardiyası yapabilirim',
  'Haftanın her günü müsaitim',
  'Belirli saatlerde müsaitim',
  'Acil çağrıya yanıt verebilirim'
];

const COMPANY_NAMES = ['EventPro', 'Festivalo', 'KonserMania', 'FuarTech', 'TadımEvi', 'StandArtı'];

async function main() {
  // Clear existing data
  await prisma.application.deleteMany();
  await prisma.match.deleteMany();
  await prisma.job.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = bcrypt.hashSync('demo1234', 8);

  // Create companies
  const companyUsers = [];
  for (const name of COMPANY_NAMES) {
    const user = await prisma.user.create({
      data: {
        email: `${name.toLowerCase()}@firma.com`,
        passwordHash,
        role: 'company'
      }
    });
    const company = await prisma.company.create({
      data: {
        userId: user.id,
        companyName: name,
        sector: 'Etkinlik & Tadım',
        city: CITIES[Math.floor(Math.random() * CITIES.length)],
        email: `${name.toLowerCase()}@firma.com`,
        phone: '+90555' + Math.floor(Math.random() * 9000000 + 1000000),
        website: `www.${name.toLowerCase()}.com`,
        logoSeed: name
      }
    });
    companyUsers.push({ id: user.id, companyId: company.id });
  }

  // Create candidates
  const candidateUsers = [];
  for (let i = 0; i < CANDIDATE_NAMES.length; i++) {
    const [first, last, gender] = CANDIDATE_NAMES[i];
    const user = await prisma.user.create({
      data: {
        email: `${first.toLowerCase()}.${last.toLowerCase()}@aday.com`,
        passwordHash,
        role: 'candidate'
      }
    });
    const candidate = await prisma.candidate.create({
      data: {
        userId: user.id,
        fullName: `${first} ${last}`,
        city: CITIES[i % CITIES.length],
        region: REGIONS[i % REGIONS.length],
        age: 18 + (i % 12),
        gender,
        bio: CANDIDATE_BIOS[i % CANDIDATE_BIOS.length],
        categories: JSON.stringify([
          CATEGORIES[(2 + i) % CATEGORIES.length],
          CATEGORIES[(3 + i) % CATEGORIES.length]
        ]),
        availability: AVAILABILITY[i % AVAILABILITY.length],
        avatarSeed: `${first}${last}`
      }
    });
    candidateUsers.push({ id: user.id, candidateId: candidate.id });
  }

  // Create jobs
  const jobDefs = [
    { company: 0, title: 'Rakı Tadım Standı Görevlisi', city: 'İstanbul', category: 'Tadım & Promosyon',
      description: 'Nisantaşı\'nda düzenlenecek tadım etkinliğinde stant görevlisi arıyoruz.',
      neededMale: 5, neededFemale: 8, payDaily: 1400, eventDate: '2026-09-23' },
    { company: 1, title: 'Teknoloji Fuarı Stant Hostesi', city: 'Ankara', category: 'Fuar Standı',
      description: '3 gün sürecek teknoloji fuarında ziyaretçi karşılama.',
      neededMale: 2, neededFemale: 6, payDaily: 1200, eventDate: '2026-09-29' },
    { company: 2, title: 'Konser Sahne Kenarı Ekibi', city: 'İzmir', category: 'Konser & Etkinlik',
      description: 'Açıkhava konserinde giriş kontrolü ve yönlendirme ekibi.',
      neededMale: 10, neededFemale: 4, payDaily: 1300, eventDate: '2026-10-06' },
    { company: 3, title: 'Yeni Ürün Lansmanı Saha Ekibi', city: 'İstanbul', category: 'Tadım & Promosyon',
      description: 'AVM içinde ürün tanıtımı yapacak enerjik ekip.',
      neededMale: 3, neededFemale: 3, payDaily: 1100, eventDate: '2026-09-18' },
    { company: 4, title: 'Depo Envanter Sayım Ekibi', city: 'Bursa', category: 'Depo & Lojistik',
      description: 'Yıl sonu sayımı için günlük vardiya ekibi.',
      neededMale: 6, neededFemale: 2, payDaily: 1000, eventDate: '2026-09-16' },
    { company: 5, title: 'Ürün Tanıtım Görevlisi', city: 'İstanbul', category: 'Tadım & Promosyon',
      description: 'Büyük marketlerde ürün tanıtım ve satış.',
      neededMale: 4, neededFemale: 6, payDaily: 950, eventDate: '2026-09-20' },
    { company: 0, title: 'VIP Misafir Ağırlama Görevlisi', city: 'İstanbul', category: 'Hostes/Host',
      description: 'Kurumsal etkinliklerde VIP konukları ağırlama.',
      neededMale: 3, neededFemale: 5, payDaily: 1800, eventDate: '2026-09-21' },
    { company: 1, title: 'Müzik Festivali Güvenlik Görevlisi', city: 'İzmir', category: 'Konser & Etkinlik',
      description: 'Uluslararası müzik festivalinde güvenlik görevlisi.',
      neededMale: 15, neededFemale: 3, payDaily: 1100, eventDate: '2026-10-04' }
  ];

  for (const jobDef of jobDefs) {
    await prisma.job.create({
      data: {
        companyId: companyUsers[jobDef.company].companyId,
        title: jobDef.title,
        description: jobDef.description,
        city: jobDef.city,
        category: jobDef.category,
        neededMale: jobDef.neededMale,
        neededFemale: jobDef.neededFemale,
        payDaily: jobDef.payDaily,
        eventDate: jobDef.eventDate,
        status: 'open'
      }
    });
  }

  console.log('✅ Demo verisi oluşturuldu!');
  console.log(`   ${CANDIDATE_NAMES.length} aday, ${COMPANY_NAMES.length} firma, ${jobDefs.length} iş ilanı`);
  console.log('   Tüm demo hesapların şifresi: demo1234');
}

main()
  .catch(e => {
    console.error('Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
