require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const net = require("net");

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const marketplaceRoutes = require("./routes/marketplace.routes");
const lostFoundRoutes = require("./routes/lostfound.routes");
const resourcesRoutes = require("./routes/resources.routes");
const chatRoutes = require("./routes/chat.routes");
const pointsRoutes = require("./routes/points.routes");
const notificationsRoutes = require("./routes/notifications.routes");

const app = express();
const preferredPort = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "REWARE CampusCycle" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/lostfound", lostFoundRoutes);
app.use("/api/resources", resourcesRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/points", pointsRoutes);
app.use("/api/notifications", notificationsRoutes);

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const server = http.createServer(app);

server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});

function findFreePort(startPort, maxTries) {
  return new Promise((resolve, reject) => {
    let port = startPort;
    let tries = 0;

    function probe() {
      if (tries >= maxTries) {
        reject(new Error(`No free port between ${startPort} and ${startPort + maxTries - 1}`));
        return;
      }
      const tester = net.createServer();
      tester.unref();
      tester.once("error", (err) => {
        tester.close();
        if (err.code === "EADDRINUSE") {
          tries++;
          port++;
          probe();
        } else {
          reject(err);
        }
      });
      tester.once("listening", () => {
        tester.close(() => resolve(port));
      });
      tester.listen(port);
    }

    probe();
  });
}

(async () => {
  try {
    const port = await findFreePort(preferredPort, 30);
    server.listen(port, () => {
      const url = `http://localhost:${port}`;
      console.log("");
      console.log("================================================");
      console.log(`  REWARE is running — open this in your browser:`);
      console.log(`  ${url}`);
      console.log("================================================");
      console.log("");
      if (port !== preferredPort) {
        console.log(`  Note: Port ${preferredPort} was busy, so ${port} was used instead.`);
        console.log("");
      }
      console.log("  Keep THIS window open while you use the site.");
      console.log("  Test: " + url + "/api/health  should show {\"ok\":true,...}");
      console.log("");
    });
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }
})();
