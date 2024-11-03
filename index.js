const WebSocket = require("ws");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const fluxWs = new WebSocket(
  "wss://flux.longerthanthelongest.com/API/GenerateText2ImageWS",
  {
    headers: {
      Authorization: "Basic Z3BwbToxMTE=",
    },
  }
);

const app = express();
const port = 3000;
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("flux", (msg) => {
    io.emit("flux", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

fluxWs.on("open", function open() {
  console.log("Connected to the Flux WebSocket server");
});

fluxWs.on("message", function incoming(data) {
  const message = data.toString();
  try {
    const parsedData = JSON.parse(message);
    io.emit("flux", parsedData);
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }
});

fluxWs.on("close", function close(code, reason) {
  console.log("fluxWs is closed with code: " + code + " reason: " + reason);
});

fluxWs.on("error", function error(err) {
  console.error("WebSocket error:", err);
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);

  app.post("/api/generate", (req, res) => {
    const testMessage = JSON.stringify(req.body);
    fluxWs.send(testMessage, (error) => {
      if (error) {
        console.error("Error sending message:", error);
      } else {
        console.log("Test message sent:", testMessage);
      }
    });
    res.send("done");
  });
});
