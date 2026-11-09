import api from "../api/axios";

const applyForJobs = async (jobId) => {
    return api.post(`/jobs/apply/${jobId}`)
}

const getAllAppliedJobs = async (jobId) => {
    return api.get(`/jobs/apply/${jobId}`)
}

const getCandidatesJobs = async (userId) => {
    return api.get(`/jobs/applied/${userId}`)
}

const deleteCandidateJobs = async (applicationId) => {
    return api.delete(`/jobs/candidates/${applicationId}`)
}

const updateApplicationStatus = async (applicationId, status) => {
    return api.put(`/jobs/updatestatus/${applicationId}`, { status });
};

export default { applyForJobs, getAllAppliedJobs, getCandidatesJobs, deleteCandidateJobs, updateApplicationStatus }
