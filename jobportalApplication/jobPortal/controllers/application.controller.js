const service = require("../service/application.service");

const postApplication = async (req, res, next) => {
  try {
    const jobId = req.params.jobId;
    console.log(jobId);
    const userId = req.user.id;
    if (!userId) {
      console.log("user is not login");
    }
    const response = await service.PostApplication(jobId, userId);
    console.log(response);
    res.status(200).json(response);
  } catch (error) {
    console.log("internal server error",error)
    res.status(500).json({ message: "Internal Server error" });
  }
};


const getAppliedCandidate=async(req, res, next)=>{
  try{
    const {jobId}=req.params;
    const response=await service.AppliedCandidates(jobId)
    console.log(response)

    res.status(200).json(response)

  }catch(error){
    console.log(error)
    res.status(500).json({message:"error occured during getting the aaplicants of this jobs.."}, error)
    next(error)
  }
}

const getCandidatesJobs=async(req,res,next)=>{
  try{
    const userId=req.user.id;
    console.log(userId);
    const response=await service.getCandidatesJobs(userId);
    console.log(response)
    // CORRECT
res.status(200).json({
    success: true,
    message: "successfully fetched candidates jobs",
    data: response
});
  }catch(error){
    console.log("failed to get candidates Jobs", error);
    res.status(500).json({message:"internal server error"})
  }
}


const deleteCandidatesJob = async (req, res, next) => {
    try {
        const { applicationId } = req.params;
        console.log(applicationId)

        const response =
            await service.deleteCandidatesJob(applicationId);
            console.log(response)

        if (!response) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Application deleted successfully",
            data: response,
        });

    } catch (error) {
        console.log("Delete error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const updateStatus=async(req, res, next)=>{
  try{
    const {applicationId}=req.params;
    const user=req.user
    const {status}=req.body  

    if(!user.role === "recruiter"){
      return
    }
    const response =await service.updateStatus(applicationId, status)
    console.log("Status updated successfully")
    res.status(200).json(response)
  }catch(error){
    console.log("error occured during the update status...", error)
    res.status(500).json({message:"Internal server error"})
    next(error)
  }
}

module.exports = { postApplication , getAppliedCandidate, getCandidatesJobs , deleteCandidatesJob, updateStatus};
