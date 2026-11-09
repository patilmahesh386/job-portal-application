import api from "../api/axios";

export const PostJob = async (data) => {
    const response = await api.post('/jobs', data);
    return response;
}

export const GetJobPost = async (search) => {
    const response = await api.get(`/jobs?search=${search}`)
    return response;
}

export const GetPostedJobs = async (userId) => {
    const response = await api.get(`/jobs/${userId}`)
    return response;
}

export const GetJobDetailByJobId = async (jobId) => {
    const response = await api.get(`/jobs/details/${jobId}`)
    return response;
}

export default function JobPostService() {
    return null;
}