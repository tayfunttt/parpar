const express = require("express");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// 🌐 VAPID key'lerini Render'daki Environment Variables'dan alıyoruz
const publicVapidKey = "BBmkso1ixwQ8On7uqdmz8wNuwHloZMhwoRRWcQKNGvyijIlsbEwZf1-SVl0BqbBvhbRqFUz5_f31eSTHCmAj2ic";
const privateVapidKey = "L93WoCAlXlFyLVk56LhB1PruElgLlxJ7XJN1EENXhng";

webpush.setVapidDetails(
  "mailto:example@yourdomain.org",
  publicVapidKey,
  privateVapidKey
);

// Kullanıcıları ve mesajları oda bazında tutmak için:
const kullanicilar = {};
const mesajlar = {}; // 🆕 Oda bazlı mesaj geçmişi

// 👉 Kayıt al: oda + id + abonelik
app.post("/kayit", (req, res) => {
  const { oda, id, subscription } = req.body;

  if (!kullanicilar[oda]) kullanicilar[oda] = {};

  // 🛑 Aynı kullanıcı adı varsa hata döndür
  if (kullanicilar[oda][id]) {
    return res.status(409).json({ error: "Bu kullanıcı adı zaten kullanımda." });
  }

  kullanicilar[oda][id] = subscription;
  res.sendStatus(201);
});

// 👉 Odaya bağlı kullanıcı listesini ver
app.get("/kullanicilar", (req, res) => {
  const oda = req.query.oda;
  if (!oda || !kullanicilar[oda]) return res.json([]);
  res.json(Object.keys(kullanicilar[oda]));
});

// 👉 Push gönder ve mesajı kaydet
app.post("/gonder", async (req, res) => {
  const { oda, hedefID, mesaj } = req.body;

  if (!kullanicilar[oda] || !kullanicilar[oda][hedefID]) {
    return res.status(404).json({ error: "Kullanıcı bulunamadı" });
  }

  const subscription = kullanicilar[oda][hedefID];

  try {
    console.log("📤 Push gönderiliyor:", subscription.endpoint);
    await webpush.sendNotification(subscription, JSON.stringify({
      title: "Yeni Mesaj",
      body: mesaj
    }));

    // 🆕 Mesajı oda bazlı bellekte sakla
    if (!mesajlar[oda]) mesajlar[oda] = [];
    mesajlar[oda].push(mesaj);

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Push gönderme hatası:", err);
    res.sendStatus(500);
  }
});

// 👉 Oda bazlı geçmiş mesajları getir
app.get("/mesajlar", (req, res) => {
  const oda = req.query.oda;
  if (!oda || !mesajlar[oda]) return res.json([]);
  res.json(mesajlar[oda]);
});

app.listen(PORT, () => {
  console.log(`📡 Push chat server çalışıyor: http://localhost:${PORT}`);
});
