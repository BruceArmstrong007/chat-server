const express = require("express");
require("dotenv").config();
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");

// const session = require("express-session");
// const SessionStore = require("express-session-sequelize")(session.Store);

const PORT = process.env.CRNT_PORT || 5000;
var app = express();
let server = http.createServer(app).listen(PORT, () => {
  console.log("Server in Running on localhost:" + PORT);
});

app.use(cookieParser());

// const sequelizeSessionStore = new SessionStore({
//   db: sequelizeDB,
// });

var corsOptions = {
  orgin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Origin",
    "Access-Control-Allow-Origin",
  ],
  credentials: true,
};

// var sessionOptions = {
//   secret: process.env.SESSION_SECRET,
//   key: process.env.SESSION_KEY,
//   resave: false,
//   saveUninitialized: true,
//   store: sequelizeSessionStore,
//   cookie: {
//     path: "/",
//     httpOnly: true,
//     maxAge: 1000 * 60 * 60 * 24,
//     sameSite: "none",
//   },
// };

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors(corsOptions));
//app.use(session(sessionOptions));
//app.use(resHeaders);
//app.use(helmet());

//Routes
const UserRoutes = require("./routes/userRoutes");
const AuthRoutes = require("./routes/authRoutes");
const ChatRoutes = require("./routes/chatRoutes");
app.use("/user", UserRoutes);
app.use("/auth", AuthRoutes);
app.use("/chat", ChatRoutes);

const sequelizeDB = require("./db/sequelize");
const chatModel = require("./models/chat");

let io = socketIO(server, {
  cors: {
    origin: "*",
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
