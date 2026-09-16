const bcrypt = require('bcryptjs');
const db = require('./db');

const CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'];
const CATEGORIES = ['Hepsi', 'Fuar Standı', 'Konser & Etkinlik', 'Tadım & Promosyon', 'Hostes/Host', 'Anket & Saha', 'Depo & Lojistik', 'Diğer'];
const REGIONS = ['hepsi', 'avrupa', 'anadolu'];

const CANDIDATE_NAMES = [
  ['Ela', 'Yıldız', 'kadın'], ['Kerem', 'Aksoy', 'erkek'], ['Nil', 'Demir', 'kadın'],
  ['Baran', 'Kaya', 'erkek'], ['Sude', 'Çelik', 'kadın'], ['Emir', 'Şahin', 'erkek'],
  ['Zeynep', 'Arslan', 'kadın'], ['Ege', 'Yılmaz', 'erkek'], ['Defne', 'Korkmaz', 'kadın'],
  ['Kaan', 'Öztürk', 'erkek'], ['Alara', 'Güneş', 'kadın'], ['Toprak', 'Aydın', 'erkek'],
  ['Ceren', 'Bulut', 'kadın'], ['Mert', 'Polat', 'erkek'], ['İpek', 'Doğan', 'kadın'],
  ['Bora', 'Çetin', 'erkek'], ['Yaren', 'Uslu', 'kadın'], ['Arda', 'Kurt', 'erkek'],
  // Ek adaylar
  ['Pınar', 'Kaya', 'kadın'], ['Serkan', 'Özdemir', 'erkek'], ['Ayşe', 'Kılıç', 'kadın'],
  ['İbrahim', 'Yalçın', 'erkek'], ['Merve', 'Şahin', 'kadın'], ['Ahmet', 'Duran', 'erkek'],
  ['Fatma', 'Güven', 'kadın'], ['Mustafa', 'Aydemir', 'erkek'], ['Selin', 'Çakır', 'kadın'],
  ['Gökhan', 'Keskin', 'erkek'], ['Didem', 'Aslan', 'kadın'], ['Emre', 'Savaş', 'erkek'],
  ['Zehra', 'Yücel', 'kadın'], ['Can', 'Eren', 'erkek'], ['Aynur', 'Turan', 'kadın'],
  ['Osman', 'Tekin', 'erkek'], ['Sinem', 'Kara', 'kadın'], ['Tarık', 'Gül', 'erkek'],
  ['Nurcan', 'Demir', 'kadın'], ['Hakan', 'Güneş', 'erkek'], ['Sibel', 'Yıldız', 'kadın'],
  ['Levent', 'Doğan', 'erkek'], ['Özlem', 'Çelik', 'kadın'], ['Tamer', 'Aktaş', 'erkek'],
  ['Neşe', 'Aksoy', 'kadın'], ['Volkan', 'Yüzer', 'erkek']
];

const CANDIDATE_BIOS = [
  'Etkinliklerde çalışmayı seven, iletişimi güçlü, esnek programlı biriyim.',
  'Sosyal, enerjik ve yeni insanlarla tanışmayı seviyorum. Her zaman gülümsüyorum!',
  'Hem öğrenci hem de çalışan. Haftasonları ve akşamlarında vardiya arıyorum.',
  'Fiziksel olarak aktif, sorun çözebilen, detaylara dikkat eden biriyim.',
  'Pazarlama ve satış deneyimim var. Müşteri hizmetleri tutkusuyla çalışıyorum.',
  'Güvenlik ve lojistik alanında deneyimli. Disiplinli ve sorumlu biriyim.',
  'Yaratıcı, eğlenceli kişiyim. Etkinlikler benim tutkum!',
  'İngilizce biliyorum. Uluslararası etkinliklerde çalışmak isterim.',
  'Depo ve envanter yönetiminde deneyim sahibiyim. Titiz çalışırım.',
  'Konserler ve müzik etkinliklerini seviyorum. Burada çalışmak hayalim!'
];

const AVAILABILITY = [
  'Hafta sonu ve akşam',
  'Her gün (tam zamanlı)',
  'Hafta sonu sadece',
  'Pazartesi-Cuma akşam',
  'Esnek (her zaman uygun)',
  'Saatli (kısa vardiyalar)',
  'Gece vardiyası uygun',
  'Yaz aylarında uygun'
];

const COMPANIES = [
  {
    name: 'Yeni Rakı',
    sector: 'İçecek & Etkinlik Pazarlaması',
    city: 'İstanbul',
    phone: '+90 (212) 555-0101',
    email: 'iletisim@yenirakı.com',
    website: 'https://www.yenirakı.com',
    address: 'Nisantaşı Mah. Abdi İpekçi Cad. No:23 İstanbul',
    description: 'Türkiye\'nin önde gelen rakı markası olarak etkinlik ve tadım organizasyonları düzenlemekteyiz. Profesyonel, dinamik ve müşteri odaklı ekipler arıyoruz.'
  },
  {
    name: 'TechExpo Fuarcılık',
    sector: 'Fuar & Etkinlik Organizasyonu',
    city: 'Ankara',
    phone: '+90 (312) 555-0202',
    email: 'info@techexpo.com.tr',
    website: 'https://www.techexpo.com.tr',
    address: 'Çankaya Mah. İnönü Cad. No:45 Ankara',
    description: 'Türkiye\'nin en büyük teknoloji fuarlarını organize etmekteyiz. Her sene binlerce ziyaretçi ve katılımcı ağırlıyoruz.'
  },
  {
    name: 'SoundWave Konser',
    sector: 'Müzik & Etkinlik Üretimi',
    city: 'İzmir',
    phone: '+90 (232) 555-0303',
    email: 'events@soundwave.com.tr',
    website: 'https://www.soundwave.com.tr',
    address: 'Alsancak Mah. Fevzipaşa Bulv. No:67 İzmir',
    description: 'Açık hava konser, müzik festivalleri ve büyük ölçekli organizasyonlar düzenliyoruz. Enerjik ve güvenilir ekip elemanları arıyoruz.'
  },
  {
    name: 'Marka Aktivasyon Ajansı',
    sector: 'Pazarlama & Ürün Tanıtımı',
    city: 'İstanbul',
    phone: '+90 (212) 555-0404',
    email: 'contact@markaaktivation.com',
    website: 'https://www.markaaktivation.com',
    address: 'Levent Mah. Büyükdere Cad. No:123 İstanbul',
    description: 'Markaların müşterilerine ulaşmasını sağlayan etkinlik ve tanıtım kampanyaları yürütüyoruz. Temsil kabiliyeti yüksek adaylar arıyoruz.'
  },
  {
    name: 'Lojistik Bir',
    sector: 'Lojistik & Depo Yönetimi',
    city: 'Bursa',
    phone: '+90 (224) 555-0505',
    email: 'hr@lojistikbir.com',
    website: 'https://www.lojistikbir.com',
    address: 'OSB Mah. Organize Sanayi Bölgesi No:567 Bursa',
    description: 'Türkiye\'nin en büyük lojistik firmalarından biri olarak mevsimlik depo ve kargo işleri için ekip arıyoruz. Güvenilir ve çalışkan adaylar tercih edilir.'
  }
];

function slugify(s) {
  const map = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' };
  return s.split('').map(ch => map[ch] || ch).join('').toLowerCase();
}

function seedIfEmpty() {
  const data = db.load();
  if (data.users.length > 0) return;

  const passwordHash = bcrypt.hashSync('demo1234', 8);

  CANDIDATE_NAMES.forEach(([first, last, gender], i) => {
    const userId = db.nextId(data.users);
    data.users.push({
      id: userId,
      email: `${slugify(first)}.${slugify(last)}@ornek.com`,
      passwordHash,
      role: 'candidate',
      createdAt: new Date().toISOString()
    });
    data.candidates.push({
      userId,
      fullName: `${first} ${last}`,
      city: CITIES[i % CITIES.length],
      age: 18 + (i % 12),
      gender,
      bio: CANDIDATE_BIOS[i % CANDIDATE_BIOS.length],
      categories: [
        CATEGORIES[(2 + i) % CATEGORIES.length],
        CATEGORIES[(3 + i) % CATEGORIES.length],
        CATEGORIES[(4 + i) % CATEGORIES.length]
      ],
      availability: AVAILABILITY[i % AVAILABILITY.length],
      region: REGIONS[i % REGIONS.length],
      avatarSeed: `${first}${last}`
    });
  });

  const jobDefs = [
    { company: 0, title: 'Rakı Tadım Standı Görevlisi', city: 'İstanbul', category: 'Tadım & Promosyon',
      description: 'Nisantaşı\'nda düzenlenecek tadım etkinliğinde stant görevlisi arıyoruz. Güler yüzlü, temsil kabiliyeti yüksek adaylar tercih sebebidir.',
      neededMale: 5, neededFemale: 8, payDaily: 1400, eventDate: daysFromNow(9) },
    { company: 1, title: 'Teknoloji Fuarı Stant Hostesi', city: 'Ankara', category: 'Fuar Standı',
      description: '3 gün sürecek teknoloji fuarında ziyaretçi karşılama ve bilgilendirme. İngilizce bilen tercih edilir.',
      neededMale: 2, neededFemale: 6, payDaily: 1200, eventDate: daysFromNow(15) },
    { company: 2, title: 'Konser Sahne Kenarı Ekibi', city: 'İzmir', category: 'Konser & Etkinlik',
      description: 'Açıkhava konserinde giriş kontrolü ve yönlendirme ekibi. Dinamik ve soğukkanlı bireyler arıyoruz.',
      neededMale: 10, neededFemale: 4, payDaily: 1300, eventDate: daysFromNow(22) },
    { company: 3, title: 'Yeni Ürün Lansmanı Saha Ekibi', city: 'İstanbul', category: 'Tadım & Promosyon',
      description: 'AVM içinde ürün tanıtımı yapacak enerjik ekip arkadaşları arıyoruz. Satış deneyimi avantaj.',
      neededMale: 3, neededFemale: 3, payDaily: 1100, eventDate: daysFromNow(5) },
    { company: 4, title: 'Depo Envanter Sayım Ekibi', city: 'Bursa', category: 'Depo & Lojistik',
      description: 'Yıl sonu sayımı için günlük vardiya ekibi. Titiz ve güvenilir çalışanlar tercih edilir.',
      neededMale: 6, neededFemale: 2, payDaily: 1000, eventDate: daysFromNow(3) },
    // Ek iş ilanları
    { company: 0, title: 'Ürün Tanıtım Görevlisi (Perakende)', city: 'İstanbul', category: 'Tadım & Promosyon',
      description: 'Büyük marketlerde ürün tanıtım ve satış. Müşteri hizmetleri odaklı, sosyal kişiler arıyoruz.',
      neededMale: 4, neededFemale: 6, payDaily: 950, eventDate: daysFromNow(7) },
    { company: 1, title: 'Web Tasarım Fuarı Moderatörü', city: 'Ankara', category: 'Fuar Standı',
      description: 'Tasarım fuarında moderation ve forum yönetimi. Yaratıcı, iyi iletişim kurabilen kişiler tercih edilir.',
      neededMale: 3, neededFemale: 4, payDaily: 1350, eventDate: daysFromNow(12) },
    { company: 2, title: 'Açıkhava Filmi Canlı Yayını Ekibi', city: 'İzmir', category: 'Konser & Etkinlik',
      description: 'Sinema etkinliğinin live streaming ve teknik desteği. Teknik bilgisi olan adaylar öne alınır.',
      neededMale: 5, neededFemale: 2, payDaily: 1500, eventDate: daysFromNow(18) },
    { company: 3, title: 'Makyöz ve Güzellik Danışmanı', city: 'İstanbul', category: 'Tadım & Promosyon',
      description: 'Yeni makyaj ürünleri event\'inde demo ve satış. Makyöz veya güzellik alanında deneyim gerekli.',
      neededMale: 0, neededFemale: 8, payDaily: 1600, eventDate: daysFromNow(4) },
    { company: 4, title: 'Kargo Dağıtım Ekibi (Geçici)', city: 'Bursa', category: 'Depo & Lojistik',
      description: 'Sezonluk kargo dağıtımı. Sabahtan akşama çalışabilecek, araç sahibi adaylar tercih edilir.',
      neededMale: 8, neededFemale: 2, payDaily: 900, eventDate: daysFromNow(2) },
    { company: 0, title: 'VIP Misafir Ağırlama Görevlisi', city: 'İstanbul', category: 'Hostes/Host',
      description: 'Kurumsal etkinliklerde VIP konukları ağırlamak. Profesyonel görünüm ve etiketi önemli.',
      neededMale: 3, neededFemale: 5, payDaily: 1800, eventDate: daysFromNow(8) },
    { company: 1, title: 'İstatistik Araştırması Saha Görevlisi', city: 'Ankara', category: 'Anket & Saha',
      description: 'Tüketici araştırması için saha görevlisi. Dikkatli, sabırlı ve iyi not tutabilen kişiler arıyoruz.',
      neededMale: 4, neededFemale: 6, payDaily: 850, eventDate: daysFromNow(6) },
    { company: 2, title: 'Müzik Festivali Güvenlik Görevlisi', city: 'İzmir', category: 'Konser & Etkinlik',
      description: 'Uluslararası müzik festivalinde güvenlik görevlisi. Güvenlik deneyimi ve fiziksel kondisyon gerekli.',
      neededMale: 15, neededFemale: 3, payDaily: 1100, eventDate: daysFromNow(20) },
    { company: 3, title: 'Sosyal Medya Etkinliği Influencer Koordinatörü', city: 'İstanbul', category: 'Tadım & Promosyon',
      description: 'Sosyal medya etkinliğinde influencer koordinasyonu. Digital savvy, genç dinamik ekip arıyoruz.',
      neededMale: 2, neededFemale: 4, payDaily: 1700, eventDate: daysFromNow(10) },
    { company: 4, title: 'Gümrük Depo Yönetim Ekibi', city: 'Bursa', category: 'Depo & Lojistik',
      description: 'Gümrük deposu yönetim ve envanter kontrol. Muhasebe veya lojistik deneyimi tercih edilir.',
      neededMale: 5, neededFemale: 1, payDaily: 1200, eventDate: daysFromNow(1) },
    { company: 0, title: 'Etkinlik Fotoğrafçı Asistanı', city: 'İstanbul', category: 'Tadım & Promosyon',
      description: 'Kurumsal etkinliklerde fotoğraf ekibinin asistanı. Teknik bilgi ve yaratıcılık gerekli.',
      neededMale: 2, neededFemale: 3, payDaily: 1250, eventDate: daysFromNow(11) },
    { company: 1, title: 'Stand Kurulum ve Söküm Teknikçi', city: 'Ankara', category: 'Fuar Standı',
      description: 'Fuar standlarının kurulum ve söküm işlemlerinde çalışacak teknik ekip arıyoruz.',
      neededMale: 8, neededFemale: 2, payDaily: 1050, eventDate: daysFromNow(14) },
    { company: 2, title: 'Konser Ses Teknisyeni Asistanı', city: 'İzmir', category: 'Konser & Etkinlik',
      description: 'Ses sistemi kurulumu ve yönetiminde teknik asistan. Müzik teknolojisi ilgisi gerekli.',
      neededMale: 4, neededFemale: 1, payDaily: 1400, eventDate: daysFromNow(19) }
  ];

  const companyIds = [];
  COMPANIES.forEach((company) => {
    const userId = db.nextId(data.users);
    data.users.push({
      id: userId,
      email: company.email,
      passwordHash,
      role: 'company',
      createdAt: new Date().toISOString()
    });
    data.companies.push({
      userId,
      companyName: company.name,
      city: company.city,
      sector: company.sector,
      email: company.email,
      phone: company.phone,
      website: company.website,
      address: company.address,
      description: company.description,
      logoSeed: company.name
    });
    companyIds.push(userId);
  });

  jobDefs.forEach(j => {
    const id = db.nextId(data.jobs);
    data.jobs.push({
      id,
      companyId: companyIds[j.company],
      title: j.title,
      description: j.description,
      city: j.city,
      category: j.category,
      neededMale: j.neededMale,
      neededFemale: j.neededFemale,
      payDaily: j.payDaily,
      eventDate: j.eventDate,
      status: 'open',
      createdAt: new Date().toISOString()
    });
  });

  // Firma tarafı hareketliliği. Eşleşme karşılıklı beğeniyle oluştuğu için
  // firmalar da aday beğenmiş olmalı; bunların bir kısmı eşleşmeye dönüşür.
  const hoursAgo = h => new Date(Date.now() - h * 3600 * 1000).toISOString();

  data.jobs.forEach((job, ji) => {
    const local = data.candidates.filter(c => c.city === job.city);
    const pool = local.length >= 5 ? local : data.candidates;
    const picked = new Set();

    for (let k = 0; k < 5; k++) {
      const cand = pool[(ji * 7 + k * 5) % pool.length];
      if (picked.has(cand.userId)) continue;
      picked.add(cand.userId);

      const mutual = k % 2 === 0; // yarısı karşılıklı beğeniyle eşleşsin
      if (mutual) {
        data.swipes.push({
          id: db.nextId(data.swipes), actorRole: 'candidate', actorId: cand.userId,
          targetType: 'job', targetId: job.id, jobId: job.id,
          direction: 'like', createdAt: hoursAgo(30 - k)
        });
      }
      data.swipes.push({
        id: db.nextId(data.swipes), actorRole: 'company', actorId: job.companyId,
        targetType: 'candidate', targetId: cand.userId, jobId: job.id,
        direction: 'like', createdAt: hoursAgo(24 - k)
      });
      if (mutual) {
        data.matches.push({
          id: db.nextId(data.matches), jobId: job.id, candidateId: cand.userId,
          companyId: job.companyId, createdAt: hoursAgo(23 - k)
        });
      }
    }
  });

  db.save(data);
  console.log('Demo verisi oluşturuldu: ' + data.users.length + ' kullanıcı, ' + data.jobs.length + ' ilan, ' + data.matches.length + ' eşleşme.');
  console.log('Tüm demo hesapların şifresi: demo1234');
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

if (require.main === module) seedIfEmpty();
module.exports = { seedIfEmpty };
