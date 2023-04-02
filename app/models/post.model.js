const mongoose = require("mongoose");

const { Schema } = mongoose;

const postSchema = new Schema({
  title: {
    type: String,
  },
  content: {
    type: String,
  },
  permalink: {
    type: String,
  },
  type: {
    type: String,
    required: true,
  },
  created_by: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Post", postSchema);
