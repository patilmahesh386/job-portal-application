const jobpost = require('../models/jobPost.modal');

const getPost = (filter) => {
  return jobpost.find(filter).sort({ createdAt: -1 });
};

const createPost = (data) => {
  return jobpost.create(data);
};

const getById = (id) => {
  return jobpost.find({ createBy: id }).sort({ createdAt: -1 });
};

const getJobByJobId = (jobId) => {
  return jobpost.findOne({ _id: jobId });
};

const updateJob = (id, data) => {
  return jobpost.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

module.exports = { getPost, createPost, getById, updateJob, getJobByJobId };
