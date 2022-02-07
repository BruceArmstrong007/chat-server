const express = require("express");

const verify = require("./../middlewares/tokenVerification");
const sequelizeDB = require("./../db/sequelize");
const authModel = require("./../models/auth");
const userModel = require("./../models/user");
const chatModel = require("./../models/chat");

const Router = express.Router();

Router.post("/fetch", verify, async (req, res) => {
  await sequelizeDB.sync();
  let room = req.body.room;
  let friends = {};
  let roomModel = chatModel(room);
  roomModel
    .findAll({
      raw: true,
      attributes: ["id", "user", "message"],
    })
    .then((items) => {
      friends[room] = items;

      console.log(friends);
      return res.status(200).json({
        success: true,
        message: "User Fetched",
        payload: [{ friend: friends }],
      });
    });
});

module.exports = Router;
