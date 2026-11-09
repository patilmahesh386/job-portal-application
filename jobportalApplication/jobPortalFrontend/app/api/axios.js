import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const api = axios.create({
  // Use 10.0.2.2 for Android Emulator. 
  // If using a physical device, replace with your computer's local IPv4 address (e.g., 192.168.1.5)
  baseURL: "http://10.138.9.241:3000",
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error fetching token from storage", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
