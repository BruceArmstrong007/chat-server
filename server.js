const express = require("express");
require("dotenv").config();
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");

var app = express();
let server = http
  .createServer(app)
  .listen(process.env.CRNT_PORT || 5000, () => {
    console.log(
      "Server in Running on localhost:" + (process.env.CRNT_PORT || 5000)
    );
  });

var corsOptions = {
  orgin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "*",
};

const resHeaders = require("./middlewares/resHeaders");

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors(corsOptions));
app.use(helmet());
app.use(resHeaders);

//Routes
const UserRoutes = require("./routes/userRoutes");
const AuthRoutes = require("./routes/authRoutes");
const ChatRoutes = require("./routes/chatRoutes");
app.use("/user", UserRoutes);
app.use("/auth", AuthRoutes);
app.use("/chat", ChatRoutes);

app.get("/", async (req, res) => {
  res.status(200).send({ success: true, message: working });
});

const sequelizeDB = require("./db/sequelize");
const chatModel = require("./models/chat");

let io = socketIO(server, {
  cors: {
    origin: "*",

    allowedHeaders: "*",
  },
});

io.on("connection", (socket) => {
  socket.on("join", (data) => {
    socket.join(data.room);
    socket.broadcast.to(data.room).emit("joined", data);
  });
  socket.on("leave", (data) => {
    socket.broadcast.to(data.room).emit("left", data);
    socket.leave(data.room);
  });
  socket.on("message", (data) => {
    socket.join(data.room);
    io.in(data.room).emit("New Message", {
      user: data.user,
      id: data.id,
      message: data.message,
      room: data.room,
    });
    sequelizeDB.sync();
    let Room = chatModel(data.room);
    Room.create(
      {
        id: data.id,
        user: data.user,
        message: data.message,
      },
      { raw: true }
    );
  });
});
