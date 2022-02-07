const express = require("express");
const Joi = require("joi");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

const sequelizeDB = require("./../db/sequelize");
const authModel = require("./../models/auth");
const userModel = require("./../models/user");

const Router = express.Router();

const Rschema = Joi.object({
  username: Joi.string().min(8).max(20).required(),
  password: Joi.string().min(8).max(50).required(),
  rpassword: Joi.ref("password"),
  name: Joi.string().min(2).max(20).required(),
});

const Nschema = Joi.object({
  username: Joi.string().min(8).max(20).required(),
  password: Joi.string().min(8).max(50).required(),
  rpassword: Joi.ref("password"),
});

const Lschema = Joi.object({
  username: Joi.string().min(8).max(20).required(),
  password: Joi.string().min(8).max(50).required(),
});

Router.post("/register", async (req, res) => {
  var { error } = Rschema.validate(req.body);
  if (error)
    return res
      .status(200)
      .json({ success: false, message: error.details[0].message, payload: [] });
  bcrypt.genSalt(10, (err, salt) => {
    if (err)
      return res
        .status(200)
        .json({ success: false, message: "Error" + err, payload: [] });
    sequelizeDB.sync();
    return bcrypt.hash(req.body.password, salt).then((hashPassword) => {
      return authModel
        .create({
          userName: req.body.username,
          password: hashPassword,
          name: req.body.name,
        })
        .then(() => {
          let User = userModel(req.body.username);
          return res
            .status(200)
            .json({ success: true, message: "User Added", payload: [] });
        })
        .catch((err) => {
          return res.status(200).json({
            success: false,
            message: "Error while registering User [" + err + "]",
            payload: [],
          });
        });
    });
  });
});

Router.post("/login", async (req, res) => {
  var { error } = Lschema.validate(req.body);
  if (error)
    return res
      .status(200)
      .json({ success: false, message: error.details[0].message, payload: [] });
  await sequelizeDB.sync();
  authModel
    .findOne({
      where: {
        userName: req.body.username,
      },
    })
    .then((login) => {
      bcrypt.compare(req.body.password, login.password).then((result) => {
        if (result === false) {
          return res.status(200).json({
            success: false,
            message: "In-Valid Credentials",
            payload: [],
          });
        }
        var token = jwt.sign({ _id: login.id }, process.env.TOKEN_SECRET, {
          expiresIn: 60 * 60 * 24,
        });
        let User = userModel(req.body.username);
        let table = User.findAll({
          raw: true,
          attributes: ["friends", "requestsSent", "requestsRecieved"],
        }).then((result) => {
          console.log(result);
          let friends = [],
            requestsSent = [],
            requestsRecieved = [];
          for (let i = 0; i < result.length; i++) {
            if (result[i].friends != null) friends.push(result[i].friends);
            if (result[i].requestsSent != null)
              requestsSent.push(result[i].requestsSent);
            if (result[i].requestsRecieved != null)
              requestsRecieved.push(result[i].requestsRecieved);
          }
          let state = {
            isloggedIn: true,
            verification: token,
            user: {
              id: login.id,
              username: login.userName,
              name: login.name,
              details: {
                friends: friends,
                requestsSent: requestsSent,
                requestsRecieved: requestsRecieved,
                find: [],
              },
            },
          };
          return res.status(200).json({
            success: true,
            message: "Login Successful",
            payload: [{ state }],
          });
        });
      });
    })
    .catch((err) => {
      return res.status(200).json({
        success: false,
        message: "Error while logging in User [" + err + "]",
        payload: [],
      });
    });
});

Router.post("/reset-password", async (req, res) => {
  const { error } = Nschema.validate(req.body);
  if (error)
    return res
      .status(200)
      .json({ success: false, message: error.details[0].message, payload: [] });
  bcrypt.genSalt(10, (err, salt) => {
    if (err)
      return res
        .status(200)
        .json({ success: false, message: "Error" + err, payload: [] });
    return bcrypt.hash(req.body.password, salt).then((hashPassword) => {
      sequelizeDB.sync();
      return authModel
        .update(
          { password: hashPassword },
          {
            where: {
              userName: req.body.username,
            },
          }
        )
        .then((user) => {
          return res
            .status(200)
            .json({ success: true, message: "User Updated", payload: [] });
        })
        .catch((err) => {
          return res.status(200).json({
            success: false,
            message:
              "Error while updating Password [" + err.errors[0].message + "]",
            payload: [],
          });
        });
    });
  });
});

Router.post("/logout", async (req, res) => {
  // res.clearCookie("auth-token");
  // req.session.destroy(function (err) {});
  res
    .status(200)
    .json({ success: true, message: "Successfully Loggedout", payload: [] });
});

module.exports = Router;
