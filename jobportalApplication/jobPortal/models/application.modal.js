const mongoose = require("mongoose");

const ApplicationSchema = mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "jobTitle",
    required: true,
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: [
      "pending",
      "reviewed",
      "rejected",
      "approved",
      "Pending",
      "Reviewed",
      "Rejected",
      "Approved",
    ],
    default: "pending",
    lowercase: true,
    trim: true,
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
});

const Jobapplication = mongoose.model("Jobapplication", ApplicationSchema);
module.exports = Jobapplication;
