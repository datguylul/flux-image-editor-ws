const WebSocket = require("ws");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { log } = require("console");

const app = express();
const port = 8000;
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server);

const fluxGenerateRequest = {
  negativeprompt: "",
  controlnetpreviewonly: false,
  debugregionalprompting: false,
  model: "flux1-dev-fp8",
  images: "1",
  seed: "-1",
  steps: "20",
  cfgscale: "7",
  aspectratio: "1:1",
  width: "1024",
  height: "1024",
  zeronegative: false,
  seamlesstileable: "false",
  initimagecreativity: "0.6",
  initimageresettonorm: "0",
  maskblur: "4",
  maskgrow: "0",
  initimagerecompositemask: true,
  useinpaintingencode: false,
  batchsize: "1",
  saveintermediateimages: false,
  donotsave: false,
  nopreviews: false,
  internalbackendtype: "Any",
  noseedincrement: false,
  personalnote: "",
  modelspecificenhancements: true,
  regionalobjectcleanupfactor: "0",
  maskcompositeunthresholded: false,
  savesegmentmask: false,
  gligenmodel: "None",
  cascadelatentcompression: "32",
  removebackground: false,
  shiftedlatentaverageinit: false,
  automaticvae: true,
  presets: [],
};

io.sockets.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  let fluxWs = null;

  socket.on("flux-msg", (msg) => {
    io.to(socket.id).emit("flux-msg", msg);
  });

  socket.on("flux-connect", () => {
    try {
      fluxWs = new WebSocket(
        "wss://flux.longerthanthelongest.com/API/GenerateText2ImageWS",
        {
          headers: {
            Authorization: "Basic Z3BwbToxMTE=",
          },
        }
      );

      fluxWs.on("open", function open() {
        console.log("Connected to the Flux WebSocket server");
        io.to(socket.id).emit("flux-connect", true);
      });

      fluxWs.on("message", function incoming(data) {
        const message = data.toString();
        try {
          const parsedData = JSON.parse(message);
          io.to(socket.id).emit("flux-msg", parsedData);
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      });

      fluxWs.on("close", function close(code, reason) {
        console.log("fluxWs is closed:", code, reason);
      });

      io.to(socket.id).emit("flux-connect", true);
    } catch (error) {
      io.to(socket.id).emit("flux-connect", false);
    }
  });

  socket.on("flux-generate", (msg) => {
    try {
      const params = JSON.parse(msg);
      const request = {
        ...fluxGenerateRequest,
        session_id: params.session_id,
        prompt: params.prompt,
      };

      fluxWs.send(JSON.stringify(request), (err) => {
        console.log("err", err);
      });
      io.to(socket.id).emit("flux-generate", true);
    } catch (error) {
      console.log("error", error);

      io.to(socket.id).emit("flux-generate", false);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    fluxWs = null;
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
