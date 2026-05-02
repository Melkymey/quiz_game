const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔗 CONNECT DB
mongoose.connect("mongodb://127.0.0.1:27017/quizDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(() => console.log("MongoDB gagal, pakai fallback"));

// 📦 SCHEMA
const Question = mongoose.model("Question", {
  question: String,
  correct: String,
  answers: [String]
});

// 📥 TAMBAH SOAL
app.post("/add-question", async (req, res) => {
  try {
    const q = new Question(req.body);
    await q.save();
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// 📤 AMBIL SOAL (HYBRID)
app.get("/questions", async (req, res) => {
  try {
    const data = await Question.aggregate([{ $sample: { size: 5 } }]);

    if (data.length > 0) {
      return res.json(data); // DB
    } else {
      return res.json([]); // fallback ke file
    }
  } catch {
    res.json([]);
  }
});

// 🏆 LEADERBOARD
let scores = [];

app.post("/score", (req, res) => {
  scores.push(req.body);
  res.json({ success: true });
});

app.get("/leaderboard", (req, res) => {
  const top = scores.sort((a,b)=>b.score-a.score).slice(0,10);
  res.json(top);
});

// 👥 MULTIPLAYER
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

server.listen(3000, () => console.log("http://localhost:3000"));
