import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router"; // 👈 useRouter import karein
import { useEffect } from "react";
import Toast from "react-native-toast-message";
import { Provider, useDispatch, useSelector } from "react-redux";
import { setUser } from "./redux/userRegisterSlice";
import Store from "./store";

import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from "./utils/registerPushNotifications";

function RootLayoutInner() {
  const dispatch = useDispatch();
  const router = useRouter(); // 👈 Hook instance use karein

  const user = useSelector((state) => state.auth?.user);

  useEffect(() => {
    const restoreUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        if (userJson) {
          const storedUser = JSON.parse(userJson);
          dispatch(setUser(storedUser));
        }
      } catch (e) {
        console.log("Failed to restore user from storage", e);
      }
    };
    restoreUser();
  }, [dispatch]);

  useEffect(() => {
    if (!user?._id) return;

    registerForPushNotificationsAsync(dispatch, user._id);

    const handleNotificationNavigation = (customData) => {
      console.log("🔥 Notification Clicked Data:", customData);

      if (customData?.type === "PROFILE") {
        console.log("Navigating to Profile route...");
        setTimeout(() => {
          router.push("/src/profile");
        }, 150);
      }
      if (customData?.type === "JOBPOSTED") {
        console.log("Navigating to Jobs route...");
        setTimeout(() => {
          router.push("/src/jobs");
        }, 150);
      }
    };

    const cleanupListeners = setupNotificationListeners(
      dispatch,
      (customData) => {
        handleNotificationNavigation(customData);
      }
    );

    // Initial check (When app was closed/killed)
    const checkInitialNotification = async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (!response) return;

        const customData = response.notification.request.content.data;
        console.log("🔥 App Opened from Killed State Data:", customData);

        handleNotificationNavigation(customData);
      } catch (error) {
        console.log("Error getting initial notification:", error);
      }
    };

    checkInitialNotification();

    return () => {
      cleanupListeners();
    };
  }, [user?._id, dispatch]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast visibilityTime={3000} autoHide={true} topOffset={30} />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={Store}>
      <RootLayoutInner />
    </Provider>
  );
}