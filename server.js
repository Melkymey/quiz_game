const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ======================
// CONFIG
// ======================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ======================
// ROUTE AWAL (WAJIB)
// ======================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "splash.html"));
});

// ======================
// CONNECT MONGODB
// ======================
mongoose.connect("mongodb://127.0.0.1:27017/quizDB")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(() => console.log("⚠️ MongoDB gagal, pakai fallback file"));

// ======================
// SCHEMA
// ======================
const Question = mongoose.model("Question", {
  question: String,
  correct: String,
  answers: [String]
});

// ======================
// API TAMBAH SOAL
// ======================
app.post("/add-question", async (req, res) => {
  try {
    const q = new Question(req.body);
    await q.save();
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

// ======================
// API AMBIL SOAL (HYBRID)
// ======================
app.get("/questions", async (req, res) => {
  try {
    const data = await Question.aggregate([{ $sample: { size: 5 } }]);

    if (data.length > 0) {
      return res.json(data); // dari DB
    } else {
      return res.json([]); // fallback ke questions.js
    }
  } catch (err) {
    return res.json([]); // fallback
  }
});

// ======================
// LEADERBOARD (sementara)
// ======================
let scores = [];

app.post("/score", (req, res) => {
  scores.push(req.body);
  res.json({ success: true });
});

app.get("/leaderboard", (req, res) => {
  const top = scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  res.json(top);
});

// ======================
// MULTIPLAYER (PLAYER ONLINE)
// ======================
let players = [];

io.on("connection", (socket) => {

  socket.on("join", (username) => {
    players.push({ id: socket.id, username });
    io.emit("players", players);
  });

  socket.on("disconnect", () => {
    players = players.filter(p => p.id !== socket.id);
    io.emit("players", players);
  });

});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 Server jalan di http://localhost:" + PORT);
});
