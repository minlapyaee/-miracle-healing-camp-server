const mongoose = require("mongoose");

const { Schema } = mongoose;

const userAudit = new Schema({
  user_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
  created_by: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
  reason: {
    type: String,
  },
  createdAt: {
    type: Date,
    immutable: true, // it will not let it change anymore
    default: () => Date.now(),
  },
});

module.exports = mongoose.model("UserAudit", userAudit);
