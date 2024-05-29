import http from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import { ExpressPeerServer } from "peer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
const PORT = 3001;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.get("/hello", (req, res) => {
  res.send("Hello World");
});

app.use("/peerjs", peerServer); // specify the path for PeerServer (to use for frontend)

io.on("connection", (socket) => {
  console.log("A client connected");

  socket.on("message", (data) => {
    console.log(`Received message from ${socket.id} `, data);
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

server.listen(PORT, () => {
  console.log("Server running on port 3001");
});
