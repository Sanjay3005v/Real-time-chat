const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const users = {}; // { socketId: { id, username, avatar } }

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("new user", ({ username, avatar }) => {
    users[socket.id] = { id: socket.id, username, avatar };
    io.emit("system message", ` ${username} joined`);
    io.emit("user list", Object.values(users));
  });

  socket.on("chat message", (msg) => {
    const user = users[socket.id];
    if (!user) return;
    io.emit("chat message", {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5), // unique id per message
      username: user.username,
      avatar: user.avatar,
      text: msg.text,
      time: new Date().toISOString(),
      replyTo: msg.replyTo || null,
    });
  });

  socket.on("edit user", ({ username, avatar }) => {
    if (!username || typeof username !== "string") return;
    const user = users[socket.id];
    if (!user) return;

    const oldName = user.username;
    const newName = username.trim();
    
    users[socket.id].username = newName;
    users[socket.id].avatar = avatar;

    io.emit("system message", ` ${oldName} is now ${newName}`);
    io.emit("user list", Object.values(users));
  });

  // Typing indicator events
  socket.on("typing", () => {
    const user = users[socket.id];
    if (!user) return;
    const username = user.username || "Someone";
    socket.broadcast.emit("typing", { username });
  });
  socket.on("stop typing", () => {
    socket.broadcast.emit("stop typing");
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      delete users[socket.id];
      io.emit("system message", `❌ ${user.username} left`);
      io.emit("user list", Object.values(users));
    }
  });
});

server.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});