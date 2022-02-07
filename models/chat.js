const { DataTypes, Model } = require("sequelize");
const sequelizeDB = require("../db/sequelize");

module.exports = function (roomName) {
  sequelizeDB.sync();
  return sequelizeDB.define(
    roomName,
    {
      user: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        unique: true,
        allowNull: false,
      },
    },
    { timestamps: true }
  );
};
