const Jobapplication = require("../models/application.modal");

const PostApplication = async (jobId, UserId) => {
  const existing = await Jobapplication.findOne({ jobId, applicant: UserId });
  if (existing) {
    const error = new Error("You have already applied for this job");
    error.statusCode = 400;
    throw error;
  }

  return await Jobapplication.create({
    jobId: jobId,
    applicant: UserId,
    status: "pending",
  });
};

const AppliedCandidate = (jobId) => {
  return Jobapplication.find({ jobId })
    .populate("jobId")
    .populate("applicant", "-password")
    .sort({ appliedAt: -1 });
};

const updateStatus = async (applicationId, status) => {
  const normalizedStatus = (status || "").toLowerCase().trim();
  return await Jobapplication.findByIdAndUpdate(
    applicationId,
    { status: normalizedStatus },
    { new: true, runValidators: true }
  );
};

const getRecruiterPost = (jobId, userId) => {
  return Jobapplication.find({ jobId }).populate("jobId");
};

const getCandidatesJobs = async (userId) => {
  return await Jobapplication.find({ applicant: userId })
    .populate({
      path: "jobId",
      model: "jobTitle",
    })
    .sort({ appliedAt: -1 })
    .exec();
};

const deleteCandidatesJobs = async (applicationId) => {
  return await Jobapplication.findByIdAndDelete(applicationId);
};

module.exports = {
  PostApplication,
  AppliedCandidate,
  getRecruiterPost,
  getCandidatesJobs,
  deleteCandidatesJobs,
  updateStatus,
};
