import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function _layout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#4e6db0ff" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "blue",
          tabBarInactiveTintColor: "gray",
        }}
      >
        {/* Home */}
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="home-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* About */}
        <Tabs.Screen
          name="about"
          options={{
            title: "About",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="information-circle-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* My Applications */}
        <Tabs.Screen
          name="myapplication"
          options={{
            title: "Applications",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="briefcase-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* Saved Jobs */}
        <Tabs.Screen
          name="savedjobs"
          options={{
            title: "Saved",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="bookmark-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />

      </Tabs>
    </>
  );
}