const service = require("../service/jobPost.service");
const notificationService = require("../service/notification.service");


exports.getPost = async (req, res, next) => {
  try {

    const filter={};
    if(req.query.location){
      filter.title=req.query.location
    }

    const search=req.query.search;
    console.log(search)
    if(search){
      filter.title={
        $regex:search,
        $options:'i'
      }
    }
    
    const response = await service.getPost(filter);
    res.status(200).json(response);
    console.log(response);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
    console.log(error);
    next(error);
  }
};


exports.createPost = async (req, res, next) => {
  try {
    const user=req.user
    if(user.role !== "recruiter" && user.role !== "admin"){
      return res.status(403).json({message:"candidate don't have authority..."})
      console.log("candidate don't have authority for hiring ...")
    }
    const data = {
      ...req.body,
      title: String(req.body.title || "").trim(),
      companyName: req.body.companyName ? String(req.body.companyName).trim() : (user.companyName || ""),
      companyWebsite: req.body.companyWebsite ? String(req.body.companyWebsite).trim() : (user.companyWebsite || ""),
      companyIndustry: req.body.companyIndustry ? String(req.body.companyIndustry).trim() : (user.companyIndustry || ""),
      companySize: req.body.companySize ? String(req.body.companySize).trim() : (user.companySize || ""),
      companyAbout: req.body.companyAbout ? String(req.body.companyAbout).trim() : (user.companyAbout || ""),
      jobLocation: req.body.jobLocation || req.body.location,
      vacancy: Number(req.body.vacancy),
      salary: Number(req.body.salary),
      experience: Number(req.body.experience),
      createBy: user.id,
    };
    const response = await service.createPost(data);

    // Broadcast notification to candidates about the newly posted job
    notificationService
      .notifyCandidatesOnNewJob(response, user)
      .then((resInfo) => {
        console.log("Candidate notification result:", resInfo);
      })
      .catch((err) => {
        console.error("[Job Controller] Candidate notification broadcast error:", err.message);
      });

    res.status(200).json(response);
    console.log(response);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
    console.log(error);
    next(error);
  }
};


exports.getJobsByJobId = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    console.log("Job ID:", jobId);

    const response = await service.getJobsByJobId(jobId);

    res.status(200).json(response);
  } catch (error) {
    console.log("Error occurred during getting job:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


exports.getById=async (req, res, next)=>{
  try{
    const response=await service.getById(req.params.id)
    res.status(200).json(response)
    console.log(response)
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
    console.log(error);
    next(error);
  }
}

exports.updateJob=async (req, res, next)=>{
  try{
    const response=await service.updateJob(req.params.id, req.body)
    res.status(200).json(response)
    console.log(response)

  }catch (error) {
    res.status(500).json({ message: "Internal server error" });
    console.log(error);
    next(error);
  }
}




  