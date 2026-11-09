const repository=require("../repository/userRegister.repository")
const { generateToken, jsonAuthentication} =require('../config/jwt')


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

module.exports = {
  userUpdate,
  getUser,
  getUserById,
  createUser,
  userLogin,
  countUser,
  toggleSaveJobService,
  getUserSavedJobsService,
};