const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");
const webPush = require("web-push");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// VAPID key üretmek için bir kere çalıştır sonra bunları sakla
webPush.setVapidDetails(
  "mailto:you@example.com",
  "BMYLktPLerCw_7_1ucqHoTjuoRq-JNWwRDb0kyRE3A_NqXSk6sssDjCLPJsTaJkfXVZMC2Lvrn_SNGNsgoFfe_Q",  // VAPID public key
  "yS0l3kmTelAEEKIiycpWhi8hgxwFGPKOdfdQ85tEGFU"  // VAPID private key
);

// Kullanıcıların push subscription bilgileri (dosyada tutulabilir)
let subscriptions = {}; // { userId: pushSubscription }
let onlineUsers = {};   // { userId: socket.id }

// Middleware
app.use(express.json());
app.use(express.static("public")); // frontend buradan sunulur

// Push subscription'ı kayıt eden endpoint
app.post("/subscribe", (req, res) => {
  const { userId, subscription } = req.body;
  subscriptions[userId] = subscription;
  fs.writeFileSync("subscriptions.json", JSON.stringify(subscriptions));
  res.status(201).json({ message: "Subscription saved." });
});

// Socket bağlantısı
io.on("connection", (socket) => {
  console.log("Yeni bağlantı:", socket.id);

  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;
    console.log(`${userId} bağlandı`);
  });

  socket.on("sendMessage", ({ from, to, message }) => {
    const msgData = { from, message, timestamp: Date.now() };

    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("receiveMessage", msgData);
    } else {
      // Offline mesajı kaydet
      const filePath = `./log-${to}.json`;
      let log = [];

      if (fs.existsSync(filePath)) {
        log = JSON.parse(fs.readFileSync(filePath));
      }

      log.push(msgData);
      fs.writeFileSync(filePath, JSON.stringify(log));

      // Push bildirimi gönder
      if (subscriptions[to]) {
        const payload = JSON.stringify({
          title: "Yeni mesaj!",
          body: `${from} seni arıyor.`,
        });

        webPush.sendNotification(subscriptions[to], payload).catch((err) => {
          console.error("Push gönderilemedi:", err);
        });
      }
    }
  });

  socket.on("getOfflineMessages", (userId) => {
    const filePath = `./log-${userId}.json`;
    if (fs.existsSync(filePath)) {
      const messages = JSON.parse(fs.readFileSync(filePath));
      socket.emit("offlineMessages", messages);
      fs.unlinkSync(filePath); // Gösterildikten sonra sil
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, id] of Object.entries(onlineUsers)) {
      if (id === socket.id) {
        delete onlineUsers[userId];
        console.log(`${userId} bağlantısı kesildi`);
        break;
      }
    }
  });
});

server.listen(3000, () => {
  console.log("Server 3000 portunda çalışıyor");
});
