const express = require("express");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const publicVapidKey = "BBmkso1ixwQ8On7uqdmz8wNuwHloZMhwoRRWcQKNGvyijIlsbEwZf1-SVl0BqbBvhbRqFUz5_f31eSTHCmAj2ic";
const privateVapidKey = "L93WoCAlXlFyLVk56LhB1PruElgLlxJ7XJN1EENXhng";

webpush.setVapidDetails(
  "mailto:example@yourdomain.org",
  publicVapidKey,
  privateVapidKey
);

// ✅ Tüm kullanıcılar tek alanda
const kullanicilar = {};

// ✅ Kullanıcı kayıt endpointi
app.post("/kayit", (req, res) => {
  const { id, subscription } = req.body;

  if (!id || !subscription) {
    return res.status(400).json({ error: "Eksik bilgi" });
  }

  kullanicilar[id] = subscription;
  return res.sendStatus(201);
});

// ✅ Kayıtlı kullanıcı listesi (test paneli için)
app.get("/kullanicilar", (req, res) => {
  res.json(Object.keys(kullanicilar));
});

// ✅ Mesaj gönderme
app.post("/gonder", async (req, res) => {
  const { hedefID, mesaj } = req.body;

  if (!hedefID || !mesaj) {
    return res.status(400).json({ error: "Eksik bilgi" });
  }

  const subscription = kullanicilar[hedefID];
  if (!subscription) {
    return res.status(404).json({ error: "Hedef kullanıcı bulunamadı" });
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify({
      title: "Yeni Mesaj",
      body: mesaj
    }));

    return res.sendStatus(200);
  } catch (err) {
    console.error("Push gönderme hatası:", err);
    return res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`✅ Push sunucusu çalışıyor: http://localhost:${PORT}`);
});
