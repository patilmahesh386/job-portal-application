const User = require("../models/userRegister.modal");

const createUser = (data) => {
  return User.create(data);
};

const countUser = (filter) => {
  return User.countDocuments(filter);
};

const readUser = (filter, skip, limit) => {
  return User.find(filter).skip(skip).limit(limit);
};

const userLogin = (email) => {
  return User.findOne({ email });
};

const findById = (id) => {
  return User.findById(id);
};

const userUpdate = (id, data) => {
  return User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

const isJobSaved = async (userId, jobId) => {
  const user = await User.findOne({ _id: userId, savedJobs: jobId });
  return !!user;
};

const addSavedJob = async (userId, jobId) => {
  return User.findByIdAndUpdate(
    userId,
    { $addToSet: { savedJobs: jobId } },
    { new: true }
  );
};

const removeSavedJob = async (userId, jobId) => {
  return User.findByIdAndUpdate(
    userId,
    { $pull: { savedJobs: jobId } },
    { new: true }
  );
};

const getSavedJobsByUserId = async (userId) => {
  const user = await User.findById(userId).populate("savedJobs");
  return user ? user.savedJobs : [];
};

module.exports = {
  userUpdate,
  findById,
  readUser,
  createUser,
  userLogin,
  countUser,
  isJobSaved,
  addSavedJob,
  removeSavedJob,
  getSavedJobsByUserId,
};
