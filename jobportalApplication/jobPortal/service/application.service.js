const repository=require("../repository/application.repository")


const PostApplication=async(jobId, userId)=>{
  return await repository.PostApplication(jobId, userId);
}

const AppliedCandidates = async (jobId) => {
  return await repository.AppliedCandidate(jobId);
};

const getRecruiterPost=async(jobId, userId)=>{
  return await repository.AppliedCandidates(jobId ,userId)
}

const getCandidatesJobs=async(userId)=>{
  return await repository.getCandidatesJobs(userId)
}

const deleteCandidatesJob = async (applicationId) => {
  return await repository.deleteCandidatesJobs(applicationId);
};

const updateStatus=async(applicationId, status)=>{
return await repository.updateStatus(applicationId,status)
}


module.exports={PostApplication ,AppliedCandidates, getCandidatesJobs, deleteCandidatesJob, updateStatus }