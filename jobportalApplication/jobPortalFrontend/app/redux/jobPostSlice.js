import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { GetJobDetailByJobId, GetJobPost, GetPostedJobs, PostJob } from "../service/jobPost";

export const postJob = createAsyncThunk(
    "/job/post", async (data, thunkApi) => {
        console.log("job post api called successfully................", data)
        try {
            const response = await PostJob(data);
            console.log("job post api called successfully................", response.data)
            return response.data;

        } catch (err) {
            console.log("Job post error:", err);
            let errorMsg = "Failed to post job. Please try again.";
            if (err.response?.status === 413 || String(err.response?.data).includes("PayloadTooLargeError")) {
                errorMsg = "PayloadTooLargeError: The uploaded banner image is too large (max 2 MB). Please select a smaller photo or remove the banner.";
            } else if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
            } else if (typeof err.response?.data === "string" && !err.response.data.includes("<html")) {
                errorMsg = err.response.data;
            } else if (err.message) {
                errorMsg = err.message;
            }
            return thunkApi.rejectWithValue(errorMsg);
        }
    }
)

export const getJobPost = createAsyncThunk(
    "job/get", async (search, thunkApi) => {
        try {
            // console.log("search", search)
            const response = await GetJobPost(search);
            // console.log("job get api called successfully................", response.data)
            return response.data;

        } catch (error) {
            console.log("Error during fetch jobs", error)
            return thunkApi.rejectWithValue(error.response?.data || error.message || "Error during fetch jobs")
        }
    }
)


export const getJobsByJobId = createAsyncThunk(
    "/jobs/jobId", async (jobId, thunkApi) => {
        try {
            const response = await GetJobDetailByJobId(jobId);
            return response.data;
        } catch (error) {
            console.log("Error during fetch jobs", error)
            return thunkApi.rejectWithValue(error.response?.data || error.message || "Error during fetch jobs")
        }
    }
)


export const getPostedJobs = createAsyncThunk(
    "/jobs/posted", async (userId, thunkApi) => {
        try {
            const response = await GetPostedJobs(userId);
            console.log("posteddddddd jobs", response.data)
            return response.data;
        } catch (error) {
            console.log("Error during fetch jobs", error)
            return thunkApi.rejectWithValue(error.response?.data || error.message || "Error during fetch jobs")
        }

    }
)

const initialState = {
    job: null,
    savedJobs: [],
    jobByJobId: null,
    myJobs: [],
    jobLoading: false,
    jobError: null
}

const jobSlice = createSlice({
    name: "job",
    initialState,
    reducers: {
        toggleSaveJob: (state, action) => {
            const jobId = typeof action.payload === 'object' ? action.payload?.jobId : action.payload;
            if (!jobId) return;
            const index = state.savedJobs.indexOf(jobId);
            if (index >= 0) {
                state.savedJobs.splice(index, 1);
            } else {
                state.savedJobs.push(jobId);
            }
        },

        addSavedJobs: (state, action) => {
            const jobId = typeof action.payload === 'object' ? action.payload?.jobId : action.payload;
            if (jobId && !state.savedJobs.includes(jobId)) {
                state.savedJobs.push(jobId);
            }
        },

        removeSavedJobs: (state, action) => {
            const jobId = typeof action.payload === 'object' ? action.payload?.jobId : action.payload;
            state.savedJobs = state.savedJobs.filter((id) => id !== jobId);
        }
    },

    extraReducers: (builder) => {
        builder
            .addCase(postJob.fulfilled, (state, action) => {
                const newJob = action.payload?.job || action.payload;
                if (newJob) {
                    if (Array.isArray(state.job)) {
                        state.job = [newJob, ...state.job.filter((j) => j._id !== newJob._id)];
                    } else {
                        state.job = [newJob];
                    }
                    if (Array.isArray(state.myJobs)) {
                        state.myJobs = [newJob, ...state.myJobs.filter((j) => j._id !== newJob._id)];
                    } else {
                        state.myJobs = [newJob];
                    }
                }
                state.jobLoading = false;
                state.jobError = null;
            })
            .addCase(postJob.rejected, (state, action) => {
                state.jobLoading = false;
                state.jobError = action.payload;
            })

            .addCase(postJob.pending, (state, action) => {
                state.jobLoading = true;
                state.jobError = null;
            })

            .addCase(getJobPost.fulfilled, (state, action) => {
                state.job = action.payload;
                state.jobLoading = false;
                state.jobError = null;
            })

            .addCase(getJobPost.rejected, (state, action) => {
                state.jobError = action.payload;
                state.jobLoading = false;
            })

            .addCase(getJobPost.pending, (state) => {
                state.jobLoading = true;
            })

            .addCase(getPostedJobs.fulfilled, (state, action) => {
                state.myJobs = action.payload;
                state.jobLoading = false;
                state.jobError = null;
            })

            .addCase(getPostedJobs.pending, (state) => {
                state.jobLoading = true;
            })

            .addCase(getPostedJobs.rejected, (state, action) => {
                state.jobError = action.payload;
                state.jobLoading = false;
            })

            .addCase(getJobsByJobId.fulfilled, (state, action) => {
                state.jobByJobId = action.payload;
                state.jobLoading = false;
                state.jobError = null;
            })

            .addCase(getJobsByJobId.rejected, (state, action) => {
                state.jobError = action.payload;
                state.jobLoading = false;
            })

            .addCase(getJobsByJobId.pending, (state) => {
                state.jobLoading = true;
            })
    }
})

export const { addSavedJobs, removeSavedJobs, toggleSaveJob } = jobSlice.actions;
export default jobSlice.reducer;


