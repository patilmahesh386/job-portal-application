const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  // Company Information for this job
  companyName: {
    type: String,
    default: "",
    trim: true,
  },
  companyWebsite: {
    type: String,
    default: "",
    trim: true,
  },
  companyIndustry: {
    type: String,
    default: "",
    trim: true,
  },
  companySize: {
    type: String,
    default: "",
    trim: true,
  },
  companyAbout: {
    type: String,
    default: "",
    trim: true,
  },
  companyLogo: {
    type: String,
    default: "",
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
