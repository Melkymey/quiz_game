const express = require("express");
const cors = require("cors");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

let scores = [];
let players = [];

// API SOAL
app.get("/questions", async (req, res) => {
  try {
    const r = await axios.get("https://opentdb.com/api.php?amount=5&type=multiple");
    res.json(r.data.results);
  } catch {
    res.status(500).json({ error: "API error" });
  }
});

// SIMPAN SCORE
app.post("/score", (req, res) => {
  scores.push(req.body);
  res.json({ success: true });
});

// LEADERBOARD
app.get("/leaderboard", (req, res) => {
  const top = scores.sort((a,b)=>b.score-a.score).slice(0,10);
  res.json(top);
});

// MULTIPLAYER BASIC
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
