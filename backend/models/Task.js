/** Task on a project board with priority, labels, assignee, due date. */
const mongoose = require("mongoose");
const {
  TASK_STATUSES,
  TASK_PRIORITIES,
} = require("../constants/taskConstants");

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "todo",
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: "medium",
    },
    labels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TaskLabel",
      },
    ],
    dueDate: { type: Date },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
