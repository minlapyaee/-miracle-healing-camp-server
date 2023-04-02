const mongoose = require("mongoose");

const { Schema } = mongoose;

const classSchema = new Schema({
  created_by: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
  class_name: {
    type: String,
    required: [true, "Class Name not provided."],
  },
  google_form_link: {
    type: String,
    required: [true, "Google Form Link not provided."],
  },
  duration: {
    type: String,
  },
  createdAt: {
    type: Date,
    immutable: true, // it will not let it change anymore
    default: () => Date.now(),
  },
});

module.exports = mongoose.model("Class", classSchema);
