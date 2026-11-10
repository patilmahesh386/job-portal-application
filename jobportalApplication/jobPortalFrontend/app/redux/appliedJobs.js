import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import AppliedJobService from "../service/appliedJobs";

export const applyJob = createAsyncThunk(
    "auth/apply", async (jobId, thunkApi) => {
        try {
            const response = await AppliedJobService.applyForJobs(jobId);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || (typeof error.response?.data === "string" ? error.response.data : "Failed to apply");
            return thunkApi.rejectWithValue(message);
        }
    }
);

export const getAllAppliedJobs = createAsyncThunk(
    "auth/getAllAppliedJobs", async (jobId, thunkApi) => {
        try {
            const response = await AppliedJobService.getAllAppliedJobs(jobId);
            return response.data;
        } catch (error) {
            return thunkApi.rejectWithValue(error.response?.data || "Failed to fetch applied jobs");
        }
    }
);

export const CandidatesJobs = createAsyncThunk(
    "jobs/candidatesJobs", async (userId, thunkApi) => {
        try {
            const response = await AppliedJobService.getCandidatesJobs(userId);
            return response.data.data;
        } catch (error) {
            return thunkApi.rejectWithValue(error.response?.data || "Failed to get candidates data");
        }
    }
);

export const deleteCandidateJobs = createAsyncThunk(
    "jobs/deleteCandidateJobs",
    async (applicationId, thunkApi) => {
        try {
            const response = await AppliedJobService.deleteCandidateJobs(applicationId);
            return { applicationId, data: response.data };
        } catch (error) {
            return thunkApi.rejectWithValue(
                error.response?.data || "Failed to delete job"
            );
        }
    }
);

export const updateApplicationStatus = createAsyncThunk(
    "jobs/updateApplicationStatus",
    async ({ applicationId, status }, thunkApi) => {
        try {
            const response = await AppliedJobService.updateApplicationStatus(applicationId, status);
            return {
                applicationId,
                status,
                data: response.data,
            };
        } catch (error) {
            return thunkApi.rejectWithValue(
                error.response?.data || "Failed to update status"
            );
        }
    }
);

const initialState = {
    candidatesJobs: [],
    appliedJob: [], // FIX 1: Initialized as empty array so FlatList doesn't crash
    loading: false,
    updatingStatus: false, // FIX 2: Separate loading flag for background status updates
    error: null,
};

const appliedJobSlice = createSlice({
    name: "appliedJobs",
    initialState,
    reducers: {
        setAllAppliedJob(state, action) {
            state.appliedJob = action.payload;
        },
        clearError(state) {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Apply Job
            .addCase(applyJob.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(applyJob.fulfilled, (state, action) => {
                state.loading = false;
            })
            .addCase(applyJob.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Get All Applied Jobs
            .addCase(getAllAppliedJobs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllAppliedJobs.fulfilled, (state, action) => {
                state.loading = false;
                state.appliedJob = action.payload;
            })
            .addCase(getAllAppliedJobs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Candidates Jobs
            .addCase(CandidatesJobs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(CandidatesJobs.fulfilled, (state, action) => {
                state.loading = false;
                state.candidatesJobs = action.payload;
            })
            .addCase(CandidatesJobs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete Candidate Job
            .addCase(deleteCandidateJobs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteCandidateJobs.fulfilled, (state, action) => {
                state.loading = false;
                state.candidatesJobs = state.candidatesJobs.filter(
                    (item) => item.jobId?._id !== action.payload.applicationId
                );
            })
            .addCase(deleteCandidateJobs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // FIX 3: Update Application Status
            .addCase(updateApplicationStatus.pending, (state) => {
                state.updatingStatus = true;
                // Don't set main state.error here to avoid crashing entire view
            })
            .addCase(updateApplicationStatus.fulfilled, (state, action) => {
                state.updatingStatus = false;

                // Update specific candidate item in list dynamically
                if (Array.isArray(state.appliedJob)) {
                    state.appliedJob = state.appliedJob.map((item) =>
                        item._id === action.payload.applicationId
                            ? { ...item, status: action.payload.status }
                            : item
                    );
                }
            })
            .addCase(updateApplicationStatus.rejected, (state, action) => {
                state.updatingStatus = false;
                // Optional: set a separate updateError or manage in component directly via .unwrap()
            });
    }
});

export const { setAllAppliedJob, clearError } = appliedJobSlice.actions;
export default appliedJobSlice.reducer;