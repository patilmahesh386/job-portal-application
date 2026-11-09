const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  template: {
    type: String,
  },
  jobSummary: {
    type: String,
    required: true,
  },
  vacancy: {
    type: Number,
  },
  jobLocation: {
    type: String,
  },
  salary: {
    type: Number,
  },
  jobType: {
    type: String,
  },
  experience: {
    type: Number,
  },
  deadline: {
    type: Date,
  },
  createBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
},
{
  timestamps:true
}
);

const jobTitle = new mongoose.model("jobTitle", JobSchema);
module.exports = jobTitle;
