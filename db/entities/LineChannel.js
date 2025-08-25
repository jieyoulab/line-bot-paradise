const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "LineChannel",
  tableName: "line_channels",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    channel_id: {
      type: String,
      unique: true,
    },
    access_token: {
      type: String,
    },
    channel_secret: {
      type: String,
    },
    created_at: {
      type: "timestamp",
      createDate: true,
    },
  },
});
