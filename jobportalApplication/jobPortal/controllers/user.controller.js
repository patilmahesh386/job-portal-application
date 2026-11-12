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

// GET /user/:id/resume - Direct download or in-browser view of candidate resume
exports.getUserResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await service.getUserById(id);

    if (!user || !user.resume || !user.resume.trim()) {
      res.setHeader("Content-Type", "text/html");
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>No Resume Found</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #F8FAFC; color: #1E293B; text-align: center; padding: 20px; box-sizing: border-box; }
            .card { background: #FFFFFF; border-radius: 16px; padding: 32px 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); max-width: 400px; width: 100%; border: 1px solid #E2E8F0; }
            .icon { font-size: 48px; margin-bottom: 12px; }
            h2 { font-size: 20px; font-weight: 700; color: #0F172A; margin-bottom: 8px; }
            p { font-size: 14px; color: #64748B; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">📄</div>
            <h2>No Resume Attached</h2>
            <p>This candidate has not uploaded a CV or resume document yet.</p>
          </div>
        </body>
        </html>
      `);
    }

    const resume = user.resume.trim();

    // 1. Direct Web or Google Drive link
    if (!resume.startsWith("data:")) {
      let targetUrl = resume;
      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        targetUrl = "https://" + targetUrl;
      }
      return res.redirect(targetUrl);
    }

    // 2. Base64 file format (PDF, Word DOC, Images, etc.)
    const match = resume.match(/^data:([^;]+);base64,(.+)$/s);
    if (!match) {
      return res.status(400).send("Invalid base64 resume format");
    }

    const mime = match[1] || "application/pdf";
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");

    let ext = "pdf";
    if (mime.includes("pdf")) ext = "pdf";
    else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
    else if (mime.includes("png")) ext = "png";
    else if (mime.includes("word") || mime.includes("docx")) ext = "docx";
    else if (mime.includes("msword")) ext = "doc";

    const candidateName = (user.name || "Candidate").replace(/[^a-zA-Z0-9]/g, "_");
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `inline; filename="${candidateName}_Resume.${ext}"`);
    res.setHeader("Content-Length", buffer.length);
    return res.send(buffer);
  } catch (err) {
    console.error("Error serving resume:", err);
    return res.status(500).send("Error loading resume");
  }
};


