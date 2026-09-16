# Vardiya — İş & Etkinlik Eşleştirme Platformu

Öğrenci/bireyleri (adayları) günlük/etkinlik bazlı iş arayan firmalarla eşleştiren,
"Tinder tarzı" kaydırmalı bir platform. Aday ilanları kaydırır, firma da adayları kaydırır;
her iki taraf da birbirini beğenirse **eşleşme** oluşur.

## Kurulum ve çalıştırma

Node.js (v18+) yüklü olmalı.

```bash
cd server
npm install
npm start
```

Sunucu ayağa kalktığında terminalde şunu göreceksin:

```
Vardiya sunucusu http://localhost:3000 adresinde çalışıyor
```

Tarayıcıdan **http://localhost:3000** adresine git.

İlk çalıştırmada `data/db.json` dosyası otomatik oluşturulur ve demo (fake) veriyle
doldurulur: 18 aday, 5 firma, 5 ilan (Yeni Rakı tadım standı örneği dahil).

Tüm demo hesapların şifresi: **demo1234**
Örnek aday: `ela.yildiz@ornek.com` · Örnek firma: `iletisim@yeniraki.com`

Gerçek kullanıcılar `/register.html` üzerinden kayıt olup platforma dahil olabilir —
bu tamamen çalışan bir kayıt/giriş (JWT tabanlı) altyapısıdır, demo veriyle birlikte
canlı da kullanılabilir.

## Nasıl çalışır (mimari)

- **Backend:** Node.js + Express. Veritabanı olarak basit bir JSON dosyası (`data/db.json`)
  kullanılıyor — harici bir veritabanı kurulumu gerekmez, taşınabilir ve okuması kolaydır.
  İleride gerçek bir veritabanına (PostgreSQL, MongoDB vb.) geçmek istersen, tek değişmesi
  gereken yer `db.js` dosyasıdır; route'lar (`routes/*.js`) aynı kalabilir.
- **Kimlik doğrulama:** `bcryptjs` ile şifre hashleme, `jsonwebtoken` ile JWT tabanlı oturum.
- **Frontend:** Derleme gerektirmeyen saf HTML/CSS/JS (`public/` klasörü). Express bu klasörü
  doğrudan statik olarak servis eder.
- **Eşleştirme mantığı:** `routes/matches.js` içinde. Aday bir ilanı beğenir (`swipe like`),
  firma da o ilan için o adayı beğenirse otomatik olarak `matches` tablosuna kayıt düşer.

## Klasör yapısı

```
server/
  server.js          Express giriş noktası
  db.js              JSON dosya veritabanı katmanı
  seed.js            Demo (fake) veri oluşturucu
  auth.js            JWT yardımcıları
  routes/
    auth.js          Kayıt / giriş
    candidates.js     Aday profili + firmanın adayları listelemesi
    companies.js      Firma profili
    jobs.js           İlan oluşturma, ilan akışı (feed)
    matches.js        Kaydırma (swipe) + eşleşme mantığı
  public/            Frontend (saf HTML/CSS/JS)
    index.html         Landing page
    register.html      Kayıt (aday/firma seçimli)
    login.html         Giriş
    onboarding.html    Aday profil tamamlama
    swipe.html         Aday: ilanları kaydırma
    dashboard.html     Aday: eşleşmelerim
    company/
      post-job.html    Firma: ilan oluşturma
      dashboard.html   Firma: ilanlarım
      review.html      Firma: bir ilan için adayları kaydırma
      matches.html     Firma: eşleşmeler
```

## Sırada ne var? (canlıya alma önerileri)

1. `data/db.json` yerine gerçek bir veritabanına geçiş (çoklu kullanıcı ve eşzamanlılık için önemli).
2. Dosya/fotoğraf yükleme (profil fotoğrafı, firma logosu).
3. E-posta doğrulama ve şifre sıfırlama akışı.
4. Bildirim sistemi (eşleşme anında push/e-posta bildirimi).
5. Ödeme/faturalama entegrasyonu (firma başına komisyon vb. iş modeline göre).
