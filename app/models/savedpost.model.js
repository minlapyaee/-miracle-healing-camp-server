const mongoose = require("mongoose");

const { Schema } = mongoose;

const savedPostSchema = new Schema({
  created_by: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
  post_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Post",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SavedPost", savedPostSchema);
