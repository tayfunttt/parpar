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

const kullanicilar = {};
const mesajlar = {};

app.post("/kayit", (req, res) => {
  const { oda, id, subscription } = req.body;

  if (!kullanicilar[oda]) kullanicilar[oda] = {};
  if (kullanicilar[oda][id]) {
    return res.status(409).json({ error: "Bu kullanıcı adı zaten kullanımda." });
  }

  kullanicilar[oda][id] = subscription;
  res.sendStatus(201);
});

app.get("/kullanicilar", (req, res) => {
  const oda = req.query.oda;
  if (!oda || !kullanicilar[oda]) return res.json([]);
  res.json(Object.keys(kullanicilar[oda]));
});

app.post("/gonder", async (req, res) => {
  const { oda, hedefID, mesaj } = req.body;

  if (!kullanicilar[oda] || !kullanicilar[oda][hedefID]) {
    return res.status(404).json({ error: "Kullanıcı bulunamadı" });
  }

  const subscription = kullanicilar[oda][hedefID];

  try {
    await webpush.sendNotification(subscription, JSON.stringify({
      title: "Yeni Mesaj",
      body: mesaj
    }));

    if (!mesajlar[oda]) mesajlar[oda] = [];
    mesajlar[oda].push(mesaj);

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Push gönderme hatası:", err);
    res.sendStatus(500);
  }
});

app.get("/mesajlar", (req, res) => {
  const oda = req.query.oda;
  if (!oda || !mesajlar[oda]) return res.json([]);
  res.json(mesajlar[oda]);
});

app.listen(PORT, () => {
  console.log(`📡 Push chat server çalışıyor: http://localhost:${PORT}`);
});
