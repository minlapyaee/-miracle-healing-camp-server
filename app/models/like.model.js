const mongoose = require("mongoose");

const { Schema } = mongoose;

const likeSchema = new Schema({
  post_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Comment",
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

module.exports = mongoose.model("Like", likeSchema);
