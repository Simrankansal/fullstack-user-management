/** Users subscribed to task updates (watchers). */
const mongoose = require("mongoose");

const taskWatcherSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

taskWatcherSchema.index({ task: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("TaskWatcher", taskWatcherSchema);
