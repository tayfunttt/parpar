const express = require("express");
const bodyParser = require("body-parser");
const webpush = require("web-push");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const kullanicilar = {}; // Kullanıcı verileri burada tutulur

// VAPID anahtarları (senin gönderdiklerinle)
const publicKey = "BKkVIG7cKX5koqIJqDeYl03C4Dp3CegbcB-q7vN8r_rFqOBgvuHEj3YlHPo3as7TXDsiMek_5Zjo2lWfS43q6WQ";
const privateKey = "oFezt6FfCNmK2O2pAZI2aI0ZKLNCCSGqEnBLKrDbyNc";

webpush.setVapidDetails(
  "mailto:example@example.com",
  publicKey,
  privateKey
);

// ✅ KULLANICI KAYDI
app.post("/kayit", (req, res) => {
  const { id, ad, subscription } = req.body;
  if (!id || !subscription) {
    return res.status(400).json({ error: "Eksik veri" });
  }
  kullanicilar[id] = { ad, subscription };
  res.send("✅ Kullanıcı kaydedildi");
});

// ✅ BİLDİRİM GÖNDER
app.post("/gonder", (req, res) => {
  const { hedefID, mesaj } = req.body;
  const hedef = kullanicilar[hedefID];

  if (!hedef || !hedef.subscription) {
    return res.status(404).json({ error: "Kullanıcı bulunamadı." });
  }

  const payload = JSON.stringify({ mesaj });

  webpush.sendNotification(hedef.subscription, payload)
    .then(() => res.send("📨 Bildirim gönderildi"))
    .catch(err => {
      console.error("❌ Bildirim hatası:", err);
      res.status(500).json({ error: "Bildirim gönderilemedi" });
    });
});

// ✅ KULLANICILARI LİSTELE (YENİ)
app.get("/kullanicilar", (req, res) => {
  const ozet = {};
  for (const [id, user] of Object.entries(kullanicilar)) {
    ozet[id] = { ad: user.ad || "Bilinmiyor" };
  }
  res.json(ozet);
});

// (İsteğe bağlı) Tüm kullanıcıları temizle
app.delete("/kullanicilar", (req, res) => {
  Object.keys(kullanicilar).forEach(k => delete kullanicilar[k]);
  res.send("🚫 Tüm kullanıcılar silindi.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
});
