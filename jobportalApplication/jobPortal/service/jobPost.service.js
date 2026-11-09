const repository = require("../repository/jobPost.repository");
const { generateToken, jsonAuthentication } = require("../config/jwt");

const getPost = async(filter) => {
  return await  repository.getPost(filter);
};

const getById = (id) => {
  return repository.getById(id);
};

const createPost = (data) => {
  return repository.createPost(data);
};

const getJobsByJobId=async(jobId)=>{
  return await repository.getJobByJobId(jobId)
}


const updateJob = (id, data) => {
  return repository.updateJob(id, data);
};


module.exports = { updateJob, createPost, getById, getPost , getJobsByJobId };
