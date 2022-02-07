const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    storage: "./db.sqlite3",
    dialect: "sqlite",
  }
);

module.exports = sequelize;
