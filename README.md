# 🛡️ Gelişmiş Discord Yetkili Takip Sistemi (v1.11)

Discord sunucunuzun yetkili kadrosunu **profesyonel bir şekilde**
yönetmenizi sağlayan, oyunlaştırma (gamification)
destekli ve yüksek performanslı gelişmiş Discord botu.

------------------------------------------------------------------------

## 🚀 Özellikler

### 📊 Gerçek Zamanlı Canvas Stat Kartları

-   Seste geçirilen aktif süreyi anlık olarak işler.
-   Veritabanını yormadan optimize edilmiş hesaplama sistemi.
-   Şık ve profesyonel PNG stat kart çıktısı.

### 🎯 Görev & Rütbe Sistemi

-   Günlük mesaj ve ses görevleri.
-   Otomatik puan kazanımı.
-   Seviye bazlı **otomatik rol (terfi)** sistemi.
-   Esnek görev ve puan yapılandırması.

### 🛍️ Yetkili Marketi (Ekonomi Sistemi)

-   Kazanılan jetonlarla ürün/rol satın alma.
-   Harcanan puanlar seviye düşürmez.
-   Admin kontrollü market yönetimi.

### 🏖️ İzin & Mazeret Yönetimi

-   Belirli gün ve sebep ile izin talebi.
-   İzinli personel pasiflik cezasından muaf tutulur.
-   Yönetici onay mekanizması.

### ⚔️ Moderasyon (İcraat) Takibi

-   Audit Log üzerinden Ban, Kick ve Timeout işlemlerini takip eder.
-   Moderasyon işlemlerine puan tanımlar.
-   Yetkili performansını ölçer.

### 🛡️ Anti-Crash & Auto-Save Mimarisi

-   Beklenmedik hatalarda güvenli kapanma.
-   Elektrik kesintisine karşı veri güvenliği.
-   Arkaplanda otomatik kayıt sistemi.

### 📅 Haftalık Otomatik Sıfırlama

-   node-cron ile her Pazartesi 00:00’da:
    -   Liderlik tablosu paylaşımı
    -   Haftalık arşiv oluşturma
    -   Verilerin sıfırlanması

------------------------------------------------------------------------

## 🧰 Gereksinimler

-   Node.js v18 veya üzeri (v22 tam uyumlu)
-   MongoDB
-   Discord Bot Token

------------------------------------------------------------------------

## 📦 Kurulum

### 1️⃣ Repoyu Klonlayın

``` bash
git clone https://github.com/heraklessii/StaffBot.git
cd StaffBot
```

### 2️⃣ Paketleri Yükleyin

``` bash
npm install
```

### 3️⃣ .env Dosyasını Ayarlayın

`.env.example` dosyasını `.env` olarak değiştirin ve aşağıdaki alanları
doldurun:

``` env
DISCORD_TOKEN=
MONGO_URI=
CLIENT_ID=
```

### 4️⃣ Botu Başlatın

``` bash
npm start
```

Geliştirici modu:

``` bash
npm run dev
```

------------------------------------------------------------------------

## 💻 Komutlar

### 🧑‍💼 Yetkili Komutları

| Komut                      | Açıklama                               |
|----------------------------|----------------------------------------|
| /staff-stats \[kullanıcı\] | Gerçek zamanlı Canvas istatistik kartı |
| /staff-gorevler            | Günlük görev ilerleme durumu           |
| /staff-izin                | İzin talebi oluşturma                  |
| /staff-market              | Yetkili marketinden alışveriş          |

------------------------------------------------------------------------

### 👑 Yönetici Komutları

| Komut               | Açıklama                 |
|---------------------|--------------------------|
| /staff-setup        | Sistem ayar paneli       |
| /staff-panel        | Genel liderlik tablosu   |
| /staff-admin        | Yetkili yönetim paneli   |
| /staff-admin-market | Market yönetimi          |
| /staff-rewards      | Seviye ödülleri ayarlama |
| /staff-add          | Manuel yetkili ekleme    |
| /staff-remove       | Yetkili silme            |
| /staff-toplanti     | Ses yoklama sistemi      |
| /staff-export       | CSV olarak dışa aktarma  |

------------------------------------------------------------------------

## 🏗️ Proje Mimarisi

    src/
     ├── commands/      → Slash komutları
     ├── events/        → Discord eventleri
     ├── handlers/      → Loader & Anti-crash sistemi
     ├── models/        → MongoDB (Mongoose) şemaları
     └── utils/         → Canvas, tarih, buton & modal yardımcıları

------------------------------------------------------------------------

## 🔒 Güvenlik & Performans

-   Optimize edilmiş veri yazma stratejisi
-   Gereksiz DB çağrılarından kaçınma
-   Event tabanlı veri işleme
-   Crash-resistant yapı

------------------------------------------------------------------------

## 📄 Lisans

Bu proje **GPL 3.0 Lisansı** altında lisanslanmıştır.  

------------------------------------------------------------------------

## 📌 Versiyon

v1.11
