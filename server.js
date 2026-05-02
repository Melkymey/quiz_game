const express = require("express");
const cors = require("cors");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔐 DATA SEMENTARA (ganti DB nanti)
let users = [];
let scores = [];
let players = [];

// LOGIN
app.post("/login", (req, res) => {
  const { username } = req.body;

  let user = users.find(u => u.username === username);
  if (!user) {
    user = { username };
    users.push(user);
  }

  res.json(user);
});

// SIMPAN SCORE
app.post("/score", (req, res) => {
  const { username, score } = req.body;
  scores.push({ username, score });
  res.json({ success: true });
});

// LEADERBOARD
app.get("/leaderboard", (req, res) => {
  const top = scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  res.json(top);
});

// API SOAL
app.get("/questions", async (req, res) => {
  try {
    const response = await axios.get(
      "https://opentdb.com/api.php?amount=5&type=multiple"
    );
    res.json(response.data.results);
  } catch (err) {
    res.status(500).json({ error: "Gagal ambil soal" });
  }
});

// MULTIPLAYER BASIC
io.on("connection", (socket) => {
  console.log("Player connect:", socket.id);

  socket.on("join", (username) => {
    players.push({ id: socket.id, username });
    io.emit("players", players);
  });

  socket.on("disconnect", () => {
    players = players.filter(p => p.id !== socket.id);
    io.emit("players", players);
  });
});

// START SERVER
const PORT = 3000;
server.listen(PORT, () => {
  console.log("Server jalan di http://localhost:" + PORT);
});
