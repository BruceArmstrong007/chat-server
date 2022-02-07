const express = require("express");

const verify = require("./../middlewares/tokenVerification");
const sequelizeDB = require("./../db/sequelize");
const authModel = require("./../models/auth");
const userModel = require("./../models/user");
const chatModel = require("./../models/chat");

const Router = express.Router();

Router.post("/fetch", verify, async (req, res) => {
  await sequelizeDB.sync();
  authModel
    .findOne({
      where: {
        userName: req.body.username,
      },
    })
    .then((result) => {
      let User = userModel(req.body.username);
      let table = User.findAll({
        raw: true,
        attributes: ["friends", "requestsSent", "requestsRecieved"],
      }).then((data) => {
        let friends = [],
          requestsSent = [],
          requestsRecieved = [];
        for (let i = 0; i < data.length; i++) {
          if (data[i].friends != null) friends.push(data[i].friends);
          if (data[i].requestsSent != null)
            requestsSent.push(data[i].requestsSent);
          if (data[i].requestsRecieved != null)
            requestsRecieved.push(data[i].requestsRecieved);
        }
        let state = {
          id: result.id,
          username: result.userName,
          name: result.name,
          details: {
            friends: friends,
            requestsSent: requestsSent,
            requestsRecieved: requestsRecieved,
            find: [],
          },
        };
        return res.status(200).json({
          success: true,
          message: "User Fetched",
          payload: [{ user: state }],
        });
      });
    })
    .catch((err) => {
      return res.status(200).json({
        success: false,
        message: "User Fetch Failed :" + err,
        payload: [],
      });
    });
});

Router.post("/find", verify, async (req, res) => {
  await sequelizeDB.sync();
  authModel
    .findAll({
      attributes: ["id", "name", "userName"],
      where: {
        userName: req.body.username,
      },
    })
    .then((result) => {
      return res.status(200).json({
        success: true,
        message: "Users Found",
        payload: [{ find: result }],
      });
    })
    .catch((err) => {
      return res.status(200).json({
        success: false,
        message: "Users Find Failed :" + err,
        payload: [],
      });
    });
});

Router.post("/add", verify, async (req, res) => {
  let User = userModel(req.body.username);
  User.create(
    {
      requestsSent: req.body.friend,
    },
    { fields: ["requestsSent"] }
  )
    .then(() => {
      let User = userModel(req.body.friend);
      return User.create(
        {
          requestsRecieved: req.body.username,
        },
        { fields: ["requestsRecieved"] }
      )
        .then(() => {
          return res.status(200).json({
            success: true,
            message: "Friend Request Sent",
            payload: [{ request: req.body.friend }],
          });
        })
        .catch((err) => {
          console.log(err);
          return res.status(200).json({
            success: false,
            message: "Failed to Send Friend Request",
            payload: [],
          });
        });
    })
    .catch((err) => {
      console.log(err);
      return res.status(200).json({
        success: false,
        message: "Failed to Send Friend Request",
        payload: [],
      });
    });
});

Router.post("/undo", verify, async (req, res) => {
  let User = userModel(req.body.username);
  User.update(
    {
      requestsSent: null,
    },
    { where: { requestsSent: req.body.friend } }
  )
    .then(() => {
      let User = userModel(req.body.friend);
      User.update(
        {
          requestsRecieved: null,
        },
        { where: { requestsRecieved: req.body.username } }
      )
        .then(() => {
          return res.status(200).json({
            success: true,
            message: "Remove Successful",
            payload: [{ user: req.body.username, friend: req.body.friend }],
          });
        })
        .catch((err) => {
          console.log(err);
          return res.status(200).json({
            success: false,
            message: "Failed to Remove Friend Request",
            payload: [],
          });
        });
    })
    .catch((err) => {
      console.log(err);
      return res.status(200).json({
        success: false,
        message: "Failed to Remove Friend Request",
        payload: [],
      });
    });
});

Router.post("/accept", verify, async (req, res) => {
  let User = userModel(req.body.username);
  User.create(
    {
      friends: req.body.friend,
    },
    { fields: ["friends"] }
  );
  User.update(
    {
      requestsRecieved: null,
    },
    { where: { requestsRecieved: req.body.friend } }
  )
    .then(() => {
      let User = userModel(req.body.friend);
      User.create(
        {
          friends: req.body.username,
        },
        { fields: ["friends"] }
      );
      User.update(
        {
          requestsSent: null,
        },
        { where: { requestsSent: req.body.username } }
      )
        .then(() => {
          let roomName = [req.body.friend, req.body.username].sort().toString();
          chatModel(roomName);
          return res.status(200).json({
            success: true,
            message: "Friend Request Accepted",
            payload: [{ friend: req.body.friend }],
          });
        })
        .catch((err) => {
          console.log(err);
          return res.status(200).json({
            success: false,
            message: "Failed to Accept Friend Request",
            payload: [],
          });
        });
    })
    .catch((err) => {
      console.log(err);
      return res.status(200).json({
        success: false,
        message: "Failed to Accept Friend Request",
        payload: [],
      });
    });
});

Router.post("/remove", verify, async (req, res) => {
  let User = userModel(req.body.username);
  User.update(
    {
      friends: null,
    },
    { where: { friends: req.body.friend } }
  )
    .then(() => {
      let User = userModel(req.body.friend);
      User.update(
        {
          friends: null,
        },
        { where: { friends: req.body.username } }
      )
        .then(() => {
          let roomName = [req.body.friend, req.body.username].sort().toString();
          chatModel(roomName).drop();
          return res.status(200).json({
            success: true,
            message: "Friend Removed",
            payload: [{ friend: req.body.friend }],
          });
        })
        .catch((err) => {
          console.log(err);
          return res.status(200).json({
            success: false,
            message: "Failed to Remove Friend",
            payload: [],
          });
        });
    })
    .catch((err) => {
      console.log(err);
      return res.status(200).json({
        success: false,
        message: "Failed to Remove Friend",
        payload: [],
      });
    });
});

module.exports = Router;
