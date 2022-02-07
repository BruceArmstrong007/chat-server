const { DataTypes, Model } = require("sequelize");
const sequelizeDB = require("../db/sequelize");

module.exports = function (userName) {
  sequelizeDB.sync();
  return sequelizeDB.define(userName, {
    friends: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    requestsSent: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    requestsRecieved: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },{timestamps: false});
};
