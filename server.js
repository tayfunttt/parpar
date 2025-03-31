const express = require("express");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// VAPID anahtarları
const publicVapidKey = "BBmkso1ixwQ8On7uqdmz8wNuwHloZMhwoRRWcQKNGvyijIlsbEwZf1-SVl0BqbBvhbRqFUz5_f31eSTHCmAj2ic";
const privateVapidKey = "L93WoCAlXlFyLVk56LhB1PruElgLlxJ7XJN1EENXhng";

webpush.setVapidDetails(
  "mailto:example@yourdomain.org",
  publicVapidKey,
  privateVapidKey
);

// Bellekte tutulacak kullanıcı listesi
let kullanicilar = {};

// ✅ Kullanıcı kaydı
app.post("/kayit", (req, res) => {
  const { id, ad, subscription } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID zorunludur." });
  }

  // Üstüne yaz
  kullanicilar[id] = {
    ad: ad || "Bilinmeyen",
    subscription: subscription || null
  };

  console.log(`📌 Kayıt: ${id} (${ad}) – Subscription: ${subscription ? "✅ VAR" : "❌ YOK"}`);
  res.sendStatus(201);
});

// ✅ Kayıtlı kullanıcıları getir
app.get("/kullanicilar", (req, res) => {
  const liste = Object.entries(kullanicilar).map(([id, veri]) => ({
    id,
    ad: veri.ad || "Bilinmeyen"
  }));
  res.json(liste);
});

// ✅ Tüm kullanıcıları sil
app.delete("/kullanicilar", (req, res) => {
  kullanicilar = {};
  console.log("🗑️ Tüm kullanıcılar silindi.");
  res.sendStatus(200);
});

// ✅ Mesaj gönder (push notification)
app.post("/gonder", async (req, res) => {
  const { hedefID, mesaj } = req.body;

  if (!hedefID || !mesaj) {
    return res.status(400).json({ error: "Eksik bilgi gönderildi." });
  }

  const kayit = kullanicilar[hedefID];

  if (!kayit || !kayit.subscription) {
    console.log(`❌ Hedef bulunamadı veya subscription yok: ${hedefID}`);
    return res.status(404).json({ error: "Kullanıcı bulunamadı." });
  }

  try {
    await webpush.sendNotification(kayit.subscription, JSON.stringify({
      title: "Yeni Mesaj",
      body: mesaj
    }));

    console.log(`📨 Mesaj gönderildi → ${hedefID}`);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Push gönderme hatası:", err);
    res.sendStatus(500);
  }
});

// ✅ Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
});
