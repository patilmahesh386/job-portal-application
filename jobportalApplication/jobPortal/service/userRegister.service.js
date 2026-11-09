const repository=require("../repository/userRegister.repository")
const { generateToken, jsonAuthentication} =require('../config/jwt')
const bcrypt = require("bcrypt");
const emailService = require("./email.service");


const createUser= async (data)=>{
  const user= await repository.createUser(data)
  return user
}




const countUser=async (filter)=>{
  const count=await repository.countUser(filter)
  return count;
}

const userLogin = async (email, password) => {
  const user = await repository.userLogin( email );

  if (!user) {
    console.log("user dosn't exist")
    throw new Error("user doesn't exist");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new Error("Invalid User and Password...");
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const token = generateToken(payload);
  console.log(token, user);
  return { token, user };
};


const getUser=(filter, skip, limit)=>{
  return repository.readUser(filter, skip, limit)
}

const getUserById=(id)=>{
  return repository.findById(id);
}

const userUpdate=(id, data)=>{
  return repository.userUpdate(id, data)
}



// Toggle save/unsave state for a job
const toggleSaveJobService = async (userId, jobId) => {
  if (!jobId) {
    throw new Error('Job ID is required');
  }

  const isAlreadySaved = await repository.isJobSaved(userId, jobId);

  let updatedUser;
  let message;

  if (isAlreadySaved) {
    updatedUser = await repository.removeSavedJob(userId, jobId);
    message = 'Job removed from bookmarks';
  } else {
    updatedUser = await repository.addSavedJob(userId, jobId);
    message = 'Job saved to bookmarks';
  }

  return {
    message,
    isSaved: !isAlreadySaved,
    savedJobs: updatedUser.savedJobs,
  };
};

// Fetch all saved jobs for a user
const getUserSavedJobsService = async (userId) => {
  return await repository.getSavedJobsByUserId(userId);
};

// Request Password Reset OTP
const forgotPasswordService = async (email) => {
  if (!email || !email.trim()) {
    throw new Error("Please enter your registered email address.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await repository.findByEmail(normalizedEmail);

  if (!user) {
    throw new Error("No account registered with this email address. Please verify your email.");
  }

  // Generate 6-digit cryptographic-safe OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await repository.setResetPasswordOtp(user._id, otp, expiresAt);

  // Send email via Gmail
  const emailResult = await emailService.sendResetPasswordOtpEmail(
    user.email,
    otp,
    user.name || "User"
  );

  return {
    success: true,
    delivered: emailResult.delivered,
    message: emailResult.message || (emailResult.delivered
      ? "Verification code has been sent to your Gmail address."
      : "Verification code generated and sent."),
    email: user.email,
    previewOtp: emailResult.previewOtp, // Available for development/testing or autofill
  };
};

// Verify OTP
const verifyOtpService = async (email, otp) => {
  if (!email || !otp) {
    throw new Error("Email and verification code are required.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await repository.findByEmail(normalizedEmail);

  if (!user) {
    throw new Error("User account not found.");
  }

  if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
    throw new Error("Invalid verification code. Please check and try again.");
  }

  if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
    throw new Error("Verification code has expired. Please request a new code.");
  }

  return {
    success: true,
    message: "Verification code confirmed successfully.",
  };
};

// Reset Password with OTP Verification
const resetPasswordService = async (email, otp, newPassword) => {
  if (!email || !otp || !newPassword) {
    throw new Error("Email, verification code, and new password are required.");
  }

  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await repository.findByEmail(normalizedEmail);

  if (!user) {
    throw new Error("User account not found.");
  }

  if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
    throw new Error("Invalid verification code. Please check and try again.");
  }

  if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
    throw new Error("Verification code has expired. Please request a new code.");
  }

  // Hash new password using bcrypt
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await repository.updatePasswordAndClearOtp(user._id, hashedPassword);

  // Send confirmation email
  emailService.sendPasswordChangedConfirmationEmail(user.email, user.name);

  return {
    success: true,
    message: "Password updated successfully. You can now login with your new password.",
  };
};

module.exports = {
  userUpdate,
  getUser,
  getUserById,
  createUser,
  userLogin,
  countUser,
  toggleSaveJobService,
  getUserSavedJobsService,
  forgotPasswordService,
  verifyOtpService,
  resetPasswordService,
};