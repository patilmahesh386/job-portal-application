const service=require('../service/userRegister.service');
const {  generateToken, jsonAuthentication} =require('../config/jwt')


exports.createUser = async (req, res, next) => {
  try {
    const response = await service.createUser(req.body);

    const payload = {
      id: response._id,
      email: response.email,
      role: response.role
    };

    const token = generateToken(payload);
    console.log(token)

    res.status(201).json({
      user: response,
      token
    });
    console.log(response)
    console.log(token)

  } catch (error) {
    next(error);
    console.log(error)
  }
};

exports.loginUser=async(req, res, next)=>{
  try{
    const {email, password}=req.body;
    const response=await service.userLogin(email, password)
    res.status(200).json(response)
    console.log(response);
  
  }catch(err){
    res.status(500).json({message:"Internal server error..."})
    next(err)
    console.log("error occured during the login")
  }
}

exports.getUser=async(req, res, next)=>{
  try{
    const page=Number(req.query.page) || 1;
    const limit=Number(req.query.limit) || 3;
    const skip=(page - 1) * limit;

    const filter={}
    if(req.query.location){
      filter.location=req.query.location
    }
    const totalUsers= await service.countUser(filter);

    const response=await  service.getUser(filter, skip, limit);

    res.json({
      currentPage:page,
      totalPages:Math.ceil(totalUsers/limit),
      totalUsers,
      response
    })

  }catch(err){
    console.log("error occured during getting documents...")
    next(err)
  }
}

exports.getUserById=async(req, res, next)=>{
  try{
    const response=await service.getUserById(req.params.id)
      res.status(200).json(response);
  }catch(err){
    next(err)
  }
}

exports.updateUser = async (req, res, next) => {
  try {
    const response = await service.userUpdate(req.params.id, req.body);

    console.log("Updated User:", response);

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

exports.toggleSaveJob = async (req, res) => {
  try {
    const userId = req.user._id; // Extracted from auth middleware
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required',
      });
    }

    const result = await service.toggleSaveJobService(userId, jobId);

    return res.status(200).json({
      success: true,
      message: result.message,
      isSaved: result.isSaved,
      savedJobs: result.savedJobs,
    });
  } catch (error) {
    console.error('Error in toggleSaveJob:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// GET /api/users/saved-jobs
exports.getSavedJobs = async (req, res) => {
  try {
    const userId = req.user._id;
    const savedJobs = await service.getUserSavedJobsService(userId);

    return res.status(200).json({
      success: true,
      data: savedJobs,
    });
  } catch (error) {
    console.error('Error in getSavedJobs:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// POST /user/forgot-password - Send 6-digit OTP code to Gmail
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await service.forgotPasswordService(email);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in forgotPassword:", error.message);
    const statusCode = error.message.includes("No account") ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to process forgot password request.",
    });
  }
};

// POST /user/verify-otp - Verify 6-digit code
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await service.verifyOtpService(email, otp);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in verifyOtp:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to verify code.",
    });
  }
};

// POST /user/reset-password - Update password with valid OTP
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await service.resetPasswordService(email, otp, newPassword);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in resetPassword:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to reset password.",
    });
  }
};

