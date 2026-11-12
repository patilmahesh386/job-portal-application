const Jobapplication = require("../models/application.modal");
const User = require("../models/userRegister.modal");
require("../models/jobPost.modal");

const PostApplication = async (jobId, UserId) => {
  const existing = await Jobapplication.findOne({ jobId, applicant: UserId });
  if (existing) {
    const error = new Error("You have already applied for this job");
    error.statusCode = 400;
    throw error;
  }

  let userResume = "";
  try {
    const userDoc = await User.findById(UserId).select("resume");
    if (userDoc?.resume) {
      userResume = userDoc.resume;
    }
  } catch (err) {
    console.log("Could not fetch applicant resume:", err?.message);
  }

  return await Jobapplication.create({
    jobId: jobId,
    applicant: UserId,
    resume: userResume,
    status: "pending",
  });
};

const AppliedCandidate = async (jobId) => {
  const applications = await Jobapplication.find({ jobId })
    .populate("jobId")
    .populate("applicant", "-password")
    .sort({ appliedAt: -1 })
    .lean();

  // Ensure each application provides resume (from application or applicant profile)
  return applications.map((app) => {
    const applicantResume = app.applicant?.resume || "";
    const appResume = app.resume || "";
    const finalResume = appResume || applicantResume;

    return {
      ...app,
      resume: finalResume,
      applicant: app.applicant
        ? {
            ...app.applicant,
            resume: finalResume,
          }
        : null,
    };
  });
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
