require("dotenv").config();

const config = {
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: process.env.DB_SYNCHRONIZE === "true",
    ssl: process.env.DB_SSL === "true",
  },
  line: {
    defaultChannelId: process.env.LINE_CHANNEL_ID || "",
    groupId: process.env.GROUP_ID || "",
  },
  server: {
    port: parseInt(process.env.PORT) || 3006,
  },
};

function get(path) {
  const keys = path.split(".");
  let value = config;
  for (const key of keys) {
    if (value[key] === undefined) return undefined;
    value = value[key];
  }
  return value;
}

module.exports = { ...config, get };
