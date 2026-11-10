const service = require("../service/application.service");

const postApplication = async (req, res, next) => {
  try {
    const jobId = req.params.jobId;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Please login to apply for jobs" });
    }
    const response = await service.PostApplication(jobId, userId);
    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: response,
    });
  } catch (error) {
    console.log("postApplication error:", error.message || error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || "Internal Server error" });
  }
};

const getAppliedCandidate = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const response = await service.AppliedCandidates(jobId);
    console.log(`Fetched ${response?.length || 0} applicants for job ${jobId}`);
    return res.status(200).json(response);
  } catch (error) {
    console.log("getAppliedCandidate error:", error);
    return res.status(500).json({ message: "Error fetching applicants for this job" });
  }
};

const getCandidatesJobs = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.params.userId;
    const response = await service.getCandidatesJobs(userId);
    return res.status(200).json({
      success: true,
      message: "Successfully fetched candidate's jobs",
      data: response,
    });
  } catch (error) {
    console.log("failed to get candidates Jobs", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteCandidatesJob = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const response = await service.deleteCandidatesJob(applicationId);

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application deleted successfully",
      data: response,
    });
  } catch (error) {
    console.log("Delete error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const user = req.user;
    const { status } = req.body;

    if (user?.role !== "recruiter") {
      return res.status(403).json({ message: "Only recruiters can update application status" });
    }
    const response = await service.updateStatus(applicationId, status);
    console.log("Status updated successfully");
    return res.status(200).json(response);
  } catch (error) {
    console.log("error occurred during update status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  postApplication,
  getAppliedCandidate,
  getCandidatesJobs,
  deleteCandidatesJob,
  updateStatus,
};
