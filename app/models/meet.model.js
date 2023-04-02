const mongoose = require("mongoose");

const { Schema } = mongoose;

const meetSchema = new Schema({
  user_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
  join_url: {
    type: String
  },
  host_id: {
    type: String
  },
  password: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Meet", meetSchema);
