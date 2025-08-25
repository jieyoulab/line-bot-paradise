const { DataSource } = require("typeorm");
const config = require("../config");
const LineChannel = require("./entities/LineChannel");

const dataSource = new DataSource({
  type: "postgres",
  host: config.get("db.host"),
  port: config.get("db.port"),
  username: config.get("db.username"),
  password: config.get("db.password"),
  database: config.get("db.database"),
  synchronize: config.get("db.synchronize"),
  ssl: config.get("db.ssl"),
  entities: [LineChannel],
  retryAttempts: 10,
  retryDelay: 2000,
});

module.exports = { dataSource };
