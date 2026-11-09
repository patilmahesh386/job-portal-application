const Jobapplication =require("../models/application.modal")

const PostApplication=(jobId, UserId)=>{
 return Jobapplication.create({
  jobId: jobId,
  applicant: UserId,
});
}

const AppliedCandidate = (jobId) => {
  return Jobapplication.find({ jobId }) // Mongoose converts this cleanly now!
    .populate("jobId")
    .populate("applicant");
};

const updateStatus = async (applicationId, status) => {
  return await Jobapplication.findByIdAndUpdate(
    applicationId, 
    { status: status }, 
    { new: true, runValidators: true }
  );
};
const getRecruiterPost=(jobId,userId)=>{
  return Jobapplication.find({jobId}).populate('jobId')
}


const getCandidatesJobs = async (userId) => {
  return await Jobapplication.find({ applicant: userId })
    .populate({
      path: 'jobId',
      model: 'jobTitle' 
    })
    .exec();
};

const deleteCandidatesJobs = async (applicationId) => {
  return await Jobapplication.findByIdAndDelete(applicationId);
};

module.exports={PostApplication ,AppliedCandidate ,getRecruiterPost, getCandidatesJobs, deleteCandidatesJobs , updateStatus }