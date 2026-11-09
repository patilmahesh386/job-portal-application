const mongoose = require("mongoose");

const ApplicationSchema = mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "jobTitle",
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'rejected', 'approved'],
    default: "Pending",
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },

});


const Jobapplication=mongoose.model("Jobapplication", ApplicationSchema)
module.exports=Jobapplication;

