import { configureStore } from "@reduxjs/toolkit";
import appliedJobReducer from "./redux/appliedJobs";
import jobReducer from "./redux/jobPostSlice";
import notificationReducer from "./redux/notificationSlice";
import registerReducer from "./redux/userRegisterSlice";

const store = configureStore({
  reducer: {
    auth: registerReducer,
    job: jobReducer,
    appliedJobs: appliedJobReducer,
    notification: notificationReducer
  },
});
export default store;
