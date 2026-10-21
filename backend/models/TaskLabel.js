/** Project-scoped labels/tags for tasks. */
const mongoose = require("mongoose");

const taskLabelSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#6c757d", trim: true },
  },
  { timestamps: true }
);

taskLabelSchema.index({ project: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("TaskLabel", taskLabelSchema);
