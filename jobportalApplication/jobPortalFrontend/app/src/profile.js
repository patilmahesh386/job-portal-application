import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import api from "../api/axios";

// Safely probe for native ExpoDocumentPicker without throwing if not linked
let ExpoDocumentPickerModule = null;
try {
  const { requireOptionalNativeModule } = require("expo-modules-core");
  if (requireOptionalNativeModule && requireOptionalNativeModule("ExpoDocumentPicker")) {
    ExpoDocumentPickerModule = require("expo-document-picker");
  }
} catch (_) {
  ExpoDocumentPickerModule = null;
}

// Safely probe for native ExpoFileSystem
let FileSystemModule = null;
try {
  FileSystemModule = require("expo-file-system");
} catch (_) {
  FileSystemModule = null;
}

// Helpers to identify file types and links
const isBase64File = (val) => typeof val === "string" && val.startsWith("data:");
const isUrlLink = (val) =>
  typeof val === "string" &&
  /^(https?:\/\/|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i.test(val.trim());
const isGoogleDriveUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  return /^(https?:\/\/)?(drive\.google\.com|docs\.google\.com)\/.+$/i.test(trimmed);
};
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import { sendNotification } from "../redux/notificationSlice";
import { setUser, updateProfile } from "../redux/userRegisterSlice";

const MAX_IMAGE_BYTES = 2.8 * 1024 * 1024; // ~2MB raw / ~2.8MB base64

const Profile = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?._id;
  const dispatch = useDispatch();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [imageTooLargeModalVisible, setImageTooLargeModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [resumeName, setResumeName] = useState(() => {
    if (user?.resume) {
      if (user.resume.startsWith("data:application/pdf")) {
        return "Resume.pdf";
      } else if (user.resume.startsWith("data:image")) {
        return "Resume_Scan.jpg";
      } else if (user.resume.startsWith("data:")) {
        return "Resume_Document";
      } else if (user.resume.startsWith("http")) {
        const parts = user.resume.split("/");
        return parts[parts.length - 1] || "Resume_Link";
      }
    }
    return "";
  });
  const [resumeSize, setResumeSize] = useState("");

  const [profile, setProfile] = useState({
    name: user?.name || "",
    age: user?.age ? String(user.age) : "",
    email: user?.email || "",
    gender: user?.gender || "",
    role: user?.role || "",
    phone: user?.phone || "",
    location: user?.location || "",
    bio: user?.bio || "",
    skills: user?.skills?.join(", ") || "",
    degree: user?.education?.[0]?.degree || "",
    college: user?.education?.[0]?.college || "",
    year: user?.education?.[0]?.year ? String(user?.education?.[0]?.year) : "",
    company: user?.experience?.[0]?.company || "",
    position: user?.experience?.[0]?.position || "",
    duration: user?.experience?.[0]?.duration || (user?.experience?.[0]?.years ? String(user?.experience?.[0]?.years) : ""),
    resume: user?.resume || "",
    profileImage: user?.profileImage || "",
  });

  // Sync state if Redux user state updates
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        age: user.age ? String(user.age) : "",
        email: user.email || "",
        gender: user.gender || "",
        role: user.role || "",
        phone: user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
        skills: user.skills?.join(", ") || "",
        degree: user.education?.[0]?.degree || "",
        college: user.education?.[0]?.college || "",
        year: user.education?.[0]?.year ? String(user.education?.[0]?.year) : "",
        company: user.experience?.[0]?.company || "",
        position: user.experience?.[0]?.position || "",
        duration: user.experience?.[0]?.duration || (user.experience?.[0]?.years ? String(user.experience?.[0]?.years) : ""),
        resume: user.resume || "",
        profileImage: user.profileImage || "",
      });

      if (user.resume) {
        if (user.resume.startsWith("data:application/pdf")) {
          setResumeName("Resume.pdf");
        } else if (user.resume.startsWith("data:image")) {
          setResumeName("Resume_Scan.jpg");
        } else if (user.resume.startsWith("data:")) {
          setResumeName("Resume_Document");
        } else if (user.resume.startsWith("http")) {
          const parts = user.resume.split("/");
          setResumeName(parts[parts.length - 1] || "Resume_Link");
        }
      }
    }
  }, [user]);

  const handleChange = (key, value) => {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant photo gallery access to select a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3, // keep base64 payload light and performant
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (asset.base64 && asset.base64.length > MAX_IMAGE_BYTES) {
          setImageTooLargeModalVisible(true);
          return;
        }

        const base64Image = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;

        handleChange("profileImage", base64Image);
        Toast.show({
          type: "info",
          text1: "Profile Photo Selected",
          text2: "Tap 'Save & Update Profile' at the bottom to apply.",
        });
      }
    } catch (err) {
      console.log("Error selecting photo:", err);
      Alert.alert("Error", "Could not select the photo. Please try again.");
    }
  };

  const handleRemovePhoto = () => {
    handleChange("profileImage", "");
    Toast.show({
      type: "info",
      text1: "Profile Photo Removed",
      text2: "Tap 'Save & Update Profile' at the bottom to apply.",
    });
  };

  const handleAvatarPress = () => {
    if (profile.profileImage) {
      setImageModalVisible(true);
    } else {
      pickImage();
    }
  };

  // Pick resume file directly from device storage (PDF / DOC)
  const handlePickResumeFile = async () => {
    // 1. Web browser environment
    if (Platform.OS === "web") {
      try {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".pdf,.doc,.docx,application/pdf,image/*";
        input.onchange = (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            handleChange("resume", reader.result);
            setResumeName(file.name);
            setResumeSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
            Toast.show({
              type: "success",
              text1: "Resume File Attached",
              text2: `${file.name} attached. Tap Save & Update Profile.`,
            });
          };
          reader.readAsDataURL(file);
        };
        input.click();
        return;
      } catch (err) {
        console.log("Web file input error:", err);
      }
    }

    // 2. Native ExpoDocumentPicker if native module exists
    if (ExpoDocumentPickerModule && typeof ExpoDocumentPickerModule.getDocumentAsync === "function") {
      try {
        const result = await ExpoDocumentPickerModule.getDocumentAsync({
          type: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/*",
            "*/*",
          ],
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          let base64 = "";
          if (FileSystemModule?.readAsStringAsync) {
            try {
              base64 = await FileSystemModule.readAsStringAsync(file.uri, {
                encoding: FileSystemModule.EncodingType.Base64,
              });
            } catch (fsErr) {
              console.log("Error reading file base64:", fsErr);
            }
          }

          const mime =
            file.mimeType ||
            (file.name?.endsWith(".pdf") ? "application/pdf" : "application/octet-stream");
          const fileUri = base64 ? `data:${mime};base64,${base64}` : file.uri;
          handleChange("resume", fileUri);
          setResumeName(file.name || "Resume.pdf");
          if (file.size) {
            setResumeSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
          }
          if (userId && fileUri) {
            try {
              const res = await api.put(`/user/profile/${userId}`, { resume: fileUri });
              const updated = res.data?.user || res.data;
              if (updated) {
                dispatch(setUser(updated));
                await AsyncStorage.setItem("user", JSON.stringify(updated));
              }
            } catch (saveErr) {
              console.log("Auto-save resume error:", saveErr?.message);
            }
          }
          Toast.show({
            type: "success",
            text1: "Resume File Attached",
            text2: `${file.name || "Document"} attached and saved to profile.`,
          });
          return;
        }
      } catch (docErr) {
        console.log("Native document picker error:", docErr);
      }
    }

    // 3. Fallback: Launch in-app file chooser modal without needing ExpoDocumentPicker native module
    try {
      const rawBaseUrl = api.defaults?.baseURL || "http://10.138.9.241:3000";
      const redirectUri = Linking.createURL("resume-uploaded");
      const uploadUrl = `${rawBaseUrl}/upload-resume?userId=${userId || ""}&redirect=${encodeURIComponent(redirectUri)}`;

      const res = await WebBrowser.openAuthSessionAsync(uploadUrl, redirectUri);
      if (res && res.type === "success" && res.url) {
        const parsed = Linking.parse(res.url);
        const fileName = parsed.queryParams?.fileName || "Resume.pdf";
        const fileSize = parsed.queryParams?.fileSize;
        setResumeName(fileName);
        if (fileSize) {
          const mb = (Number(fileSize) / (1024 * 1024)).toFixed(2);
          setResumeSize(`${mb} MB`);
        }
        // Sync updated profile with backend
        if (userId) {
          const userRes = await api.get(`/user/${userId}`);
          const userData = userRes.data?.user || userRes.data;
          if (userData) {
            dispatch(setUser(userData));
            await AsyncStorage.setItem("user", JSON.stringify(userData));
            handleChange("resume", userData.resume || "");
          }
        }
        Toast.show({
          type: "success",
          text1: "Resume Uploaded Successfully",
          text2: `${fileName} attached to profile.`,
        });
      }
    } catch (browserErr) {
      console.log("Error launching file chooser:", browserErr);
      Alert.alert(
        "File Upload",
        "Could not launch file chooser. You can also paste a Google Drive link below."
      );
    }
  };

  // Pick resume image/scan from photo gallery
  const handlePickResumeFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant photo gallery access to select your resume document."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mime = asset.mimeType || "image/jpeg";
        const base64Data = asset.base64 ? `data:${mime};base64,${asset.base64}` : asset.uri;
        handleChange("resume", base64Data);
        setResumeName(asset.fileName || "Resume_Document.jpg");
        if (asset.fileSize) {
          setResumeSize(`${(asset.fileSize / (1024 * 1024)).toFixed(2)} MB`);
        }
        if (userId && base64Data) {
          try {
            const res = await api.put(`/user/profile/${userId}`, { resume: base64Data });
            const updated = res.data?.user || res.data;
            if (updated) {
              dispatch(setUser(updated));
              await AsyncStorage.setItem("user", JSON.stringify(updated));
            }
          } catch (saveErr) {
            console.log("Auto-save resume image error:", saveErr?.message);
          }
        }
        Toast.show({
          type: "success",
          text1: "Resume Document Attached",
          text2: "Resume image attached and saved to profile.",
        });
      }
    } catch (err) {
      console.log("Error selecting resume image:", err);
      Alert.alert("Error", "Could not select the document. Please try again.");
    }
  };

  // Preview or open resume
  const handlePreviewResume = async () => {
    const rawResume = profile.resume?.trim();
    if (!rawResume) {
      Alert.alert("No Resume", "No resume has been uploaded yet.");
      return;
    }

    // Direct Web / Google Drive URL
    if (!rawResume.startsWith("data:")) {
      let url = rawResume;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert("Cannot Open Link", `Unable to open this link in your browser:\n${url}`);
        }
      } catch (err) {
        Alert.alert("Link Error", "Could not open resume link. Please check the URL.");
      }
      return;
    }

    // Base64 file format in web
    if (Platform.OS === "web") {
      try {
        window.open(rawResume, "_blank");
        return;
      } catch (_) {}
    }

    // Direct browser preview via backend endpoint
    if (userId) {
      const rawBaseUrl = api.defaults?.baseURL || "http://10.138.9.241:3000";
      const resumeUrl = `${rawBaseUrl}/user/${userId}/resume`;
      try {
        await WebBrowser.openBrowserAsync(resumeUrl);
        return;
      } catch (browserErr) {
        console.log("WebBrowser failed, trying cached file:", browserErr);
      }
    }

    // Base64 file in native mobile: write to cache and open
    if (FileSystemModule?.cacheDirectory && FileSystemModule?.writeAsStringAsync) {
      try {
        const mimeMatch = rawResume.match(/^data:([^;]+);base64,/);
        const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
        let ext = "pdf";
        if (mime.includes("pdf")) ext = "pdf";
        else if (mime.includes("png")) ext = "png";
        else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
        else if (mime.includes("word") || mime.includes("docx")) ext = "docx";
        else if (mime.includes("msword")) ext = "doc";

        const base64Content = rawResume.replace(/^data:[^;]+;base64,/, "");
        const cacheUri = `${FileSystemModule.cacheDirectory}my_resume_${Date.now()}.${ext}`;
        await FileSystemModule.writeAsStringAsync(cacheUri, base64Content, {
          encoding: FileSystemModule.EncodingType.Base64,
        });

        const canOpen = await Linking.canOpenURL(cacheUri);
        if (canOpen) {
          await Linking.openURL(cacheUri);
          return;
        }
      } catch (err) {
        console.log("Error opening cached resume:", err);
      }
    }

    Alert.alert(
      "Resume File Attached",
      `Your resume document (${resumeName || "Resume file"}) is securely stored with your profile.`
    );
  };

  const handleRemoveResume = () => {
    Alert.alert(
      "Remove Resume",
      "Are you sure you want to remove your attached resume document?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            handleChange("resume", "");
            setResumeName("");
            setResumeSize("");
            if (userId) {
              try {
                const res = await api.put(`/user/profile/${userId}`, { resume: "" });
                const updated = res.data?.user || res.data;
                if (updated) {
                  dispatch(setUser(updated));
                  await AsyncStorage.setItem("user", JSON.stringify(updated));
                }
              } catch (e) {
                console.log("Error removing resume on server:", e);
              }
            }
            Toast.show({
              type: "info",
              text1: "Resume Removed",
              text2: "Your resume document was removed.",
            });
          },
        },
      ]
    );
  };

  // Comprehensive Frontend Validations
  const validateForm = () => {
    const errors = [];

    // 1. Full Name
    if (!profile.name || profile.name.trim().length < 2) {
      errors.push({
        field: "Full Name",
        message: "Full name is required (minimum 2 characters).",
      });
    }

    // 2. Age (Platform requires min: 18)
    const ageNum = Number(profile.age);
    if (!profile.age || isNaN(ageNum)) {
      errors.push({
        field: "Age",
        message: "Age is required and must be a valid number.",
      });
    } else if (ageNum < 18) {
      errors.push({
        field: "Age",
        message: "Age must be at least 18 years old.",
      });
    } else if (ageNum > 100) {
      errors.push({
        field: "Age",
        message: "Please enter a realistic age between 18 and 100.",
      });
    }

    // 3. Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profile.email || !emailRegex.test(profile.email.trim())) {
      errors.push({
        field: "Email Address",
        message: "Please provide a valid email (e.g., name@example.com).",
      });
    }

    // 4. Gender (Must be male, female, or other)
    const normalizedGender = profile.gender?.trim().toLowerCase();
    if (!normalizedGender || !["male", "female", "other"].includes(normalizedGender)) {
      errors.push({
        field: "Gender",
        message: "Please select Male, Female, or Other.",
      });
    }

    // 5. Role (Candidate or Recruiter)
    const normalizedRole = profile.role?.trim().toLowerCase();
    if (!normalizedRole || !["candidate", "recruiter", "admin"].includes(normalizedRole)) {
      errors.push({
        field: "Role",
        message: "Please choose whether you are a Candidate or Recruiter.",
      });
    }

    // 6. Phone (Optional, but if given must be valid)
    if (profile.phone && profile.phone.trim().length > 0) {
      const digitsOnly = profile.phone.replace(/[\s\-()+]/g, "");
      if (digitsOnly.length < 10 || digitsOnly.length > 15 || !/^\d+$/.test(digitsOnly)) {
        errors.push({
          field: "Phone Number",
          message: "Phone number should be 10 to 15 digits (e.g. 9876543210).",
        });
      }
    }

    // 7. Graduation Year (Optional, but if given must be 4 digits)
    if (profile.year && profile.year.trim().length > 0) {
      const yearNum = Number(profile.year.trim());
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1950 || yearNum > currentYear + 10) {
        errors.push({
          field: "Graduation Year",
          message: `Graduation year must be a 4-digit year between 1950 and ${currentYear + 10}.`,
        });
      }
    }

    // 8. Resume validation (File format or valid link accepted)
    if (profile.resume && profile.resume.trim().length > 0) {
      const rawResume = profile.resume.trim();
      const isFile = isBase64File(rawResume);
      const isUrl = isUrlLink(rawResume) || isGoogleDriveUrl(rawResume);
      if (!isFile && !isUrl) {
        errors.push({
          field: "Resume Document",
          message:
            "Please attach a valid resume file (PDF, DOC, Image) or provide a valid link.",
        });
      }
    }

    return errors;
  };

  const submitHandler = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setValidationModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      const normalizedGender = profile.gender.trim().toLowerCase();
      const normalizedRole = profile.role.trim().toLowerCase();

      let formattedResume = profile.resume ? profile.resume.trim() : "";
      if (
        formattedResume &&
        !formattedResume.startsWith("data:") &&
        !formattedResume.startsWith("http://") &&
        !formattedResume.startsWith("https://")
      ) {
        formattedResume = "https://" + formattedResume;
      }

      const data = {
        name: profile.name.trim(),
        age: Number(profile.age),
        email: profile.email.trim().toLowerCase(),
        gender: normalizedGender,
        role: normalizedRole,
        phone: profile.phone ? profile.phone.trim() : "",
        location: profile.location ? profile.location.trim() : "",
        bio: profile.bio ? profile.bio.trim() : "",
        skills: profile.skills
          ? profile.skills
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        education: (profile.degree || profile.college || profile.year)
          ? [
              {
                degree: profile.degree ? profile.degree.trim() : "",
                college: profile.college ? profile.college.trim() : "",
                year: profile.year ? Number(profile.year) : undefined,
              },
            ]
          : [],
        experience: (profile.company || profile.position || profile.duration)
          ? [
              {
                company: profile.company ? profile.company.trim() : "",
                position: profile.position ? profile.position.trim() : "",
                duration: profile.duration ? profile.duration.trim() : "",
                years: !isNaN(Number(profile.duration))
                  ? Number(profile.duration)
                  : undefined,
              },
            ]
          : [],
        resume: formattedResume,
        profileImage: profile.profileImage || "",
      };

      const res = await dispatch(updateProfile({ data, userId })).unwrap();
      const updatedUser = res?.user || res;

      if (updatedUser) {
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        dispatch(setUser(updatedUser));
      }

      await dispatch(
        sendNotification({
          userId,
          title: "Profile Updated Successfully 🎉",
          body: "Your profile details have been saved.",
          data: {
            type: "PROFILE",
            userId,
          },
        })
      );

      Toast.show({
        type: "success",
        text1: "Profile Updated 🎉",
        text2: "Your details have been successfully saved.",
      });
    } catch (error) {
      console.error("Profile update failed:", error);
      const errorMsg =
        typeof error === "string"
          ? error
          : error?.message || "Profile couldn't be updated. Please try again.";

      Toast.show({
        type: "error",
        text1: "Profile Update Failed",
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/src/userinfo");
    }
  };

  if (!user || !userId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>My Profile</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
          <Text style={styles.errorHeading}>User Not Found</Text>
          <Text style={styles.errorSubtext}>Please log in to view and edit your profile.</Text>
          <TouchableOpacity
            style={styles.loginRedirectBtn}
            onPress={() => router.replace("/src/login")}
          >
            <Text style={styles.loginRedirectText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Parse skill tags for live preview
  const parsedSkills = profile.skills
    ? profile.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your career profile & details</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={true}
        >
          {/* Avatar & Photo Card (Profile Photo is managed exclusively here) */}
          <View style={styles.avatarCard}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={handleAvatarPress}
              activeOpacity={0.85}
              accessibilityLabel={profile.profileImage ? "View profile photo" : "Upload profile photo"}
            >
              {profile.profileImage ? (
                <Image
                  source={{ uri: profile.profileImage }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.cameraBadge}
                onPress={pickImage}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Change profile photo"
              >
                <Ionicons name="camera" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </TouchableOpacity>

            <View style={styles.avatarActions}>
              <TouchableOpacity
                style={styles.changePhotoBtn}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="image-outline" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                <Text style={styles.changePhotoText}>
                  {profile.profileImage ? "Change Photo" : "Upload Photo"}
                </Text>
              </TouchableOpacity>

              {Boolean(profile.profileImage) && (
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={handleRemovePhoto}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={15} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.removePhotoText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.avatarHint}>
              {profile.profileImage
                ? "Tap photo to view full size • JPG or PNG"
                : "JPG or PNG • Recommended under 2 MB"}
            </Text>
          </View>

          {/* SECTION 1: Personal Information */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBadge}>
                <Ionicons name="person-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Full Name <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter your full name (e.g. John Doe)"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={profile.name}
                  onChangeText={(text) => handleChange("name", text)}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Age */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Age <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.inputWrap}>
                <Ionicons name="calendar-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter age (e.g. 24, min 18)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={3}
                  value={profile.age}
                  onChangeText={(text) => handleChange("age", text)}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Email Address <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter email address (e.g. john@example.com)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={profile.email}
                  onChangeText={(text) => handleChange("email", text)}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="call-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="10-digit mobile number (e.g. 9876543210)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={15}
                  value={profile.phone}
                  onChangeText={(text) => handleChange("phone", text)}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Gender Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Gender <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.chipsRow}>
                {["male", "female", "other"].map((g) => {
                  const isSelected = profile.gender?.toLowerCase() === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, isSelected && styles.activeChip]}
                      onPress={() => handleChange("gender", g)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={
                          g === "male" ? "man-outline" : g === "female" ? "woman-outline" : "transgender-outline"
                        }
                        size={16}
                        color={isSelected ? "#FFFFFF" : "#475569"}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* SECTION 2: Professional Profile */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBadge}>
                <Ionicons name="briefcase-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>Professional Details</Text>
            </View>

            {/* Role Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Account Role <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.chipsRow}>
                {[
                  { key: "candidate", label: "Candidate", icon: "person-outline" },
                  { key: "recruiter", label: "Recruiter", icon: "business-outline" },
                ].map((r) => {
                  const isSelected = profile.role?.toLowerCase() === r.key;
                  return (
                    <TouchableOpacity
                      key={r.key}
                      style={[styles.chip, isSelected && styles.activeChip]}
                      onPress={() => handleChange("role", r.key)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={r.icon}
                        size={16}
                        color={isSelected ? "#FFFFFF" : "#475569"}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Location */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Current Location</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="location-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="City, State or Country (e.g. Mumbai, India)"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  value={profile.location}
                  onChangeText={(text) => handleChange("location", text)}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Bio */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Professional Bio</Text>
              <View style={[styles.inputWrap, styles.textAreaWrap]}>
                <TextInput
                  placeholder="Tell recruiters about yourself, key career accomplishments, passions, and goals..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  value={profile.bio}
                  onChangeText={(text) => handleChange("bio", text)}
                  style={[styles.input, styles.textAreaInput]}
                />
              </View>
            </View>

            {/* Skills */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Key Skills</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="code-slash-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="e.g. React Native, Node.js, MongoDB, TypeScript"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  value={profile.skills}
                  onChangeText={(text) => handleChange("skills", text)}
                  style={styles.input}
                />
              </View>
              <Text style={styles.fieldHelper}>Separate multiple skills with commas</Text>

              {parsedSkills.length > 0 && (
                <View style={styles.skillBadgesWrap}>
                  {parsedSkills.map((skill, index) => (
                    <View key={index} style={styles.skillBadge}>
                      <Text style={styles.skillBadgeText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* SECTION 3: Education */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBadge}>
                <Ionicons name="school-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>Education</Text>
            </View>

            {/* Degree */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Degree / Qualification</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="ribbon-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="e.g. B.Tech in Computer Science / BCA"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  value={profile.degree}
                  onChangeText={(text) => handleChange("degree", text)}
                  style={styles.input}
                />
              </View>
            </View>

            {/* College */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>College / University</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="school" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="e.g. University of Mumbai / Stanford"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  value={profile.college}
                  onChangeText={(text) => handleChange("college", text)}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Passing Year */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Graduation Year</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="time-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="4-digit year (e.g. 2024)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={4}
                  value={profile.year}
                  onChangeText={(text) => handleChange("year", text)}
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          {/* SECTION 4: Experience */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBadge}>
                <Ionicons name="business-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>Work Experience</Text>
            </View>

            {/* Company */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Company / Organization</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="business" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="e.g. Google, Infosys, Startup Inc."
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  value={profile.company}
                  onChangeText={(text) => handleChange("company", text)}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Position */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Job Title / Role</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="id-card-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="e.g. Senior Frontend Engineer"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  value={profile.position}
                  onChangeText={(text) => handleChange("position", text)}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Duration */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Duration / Experience</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="hourglass-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="e.g. 2 years (or 2022 - 2024)"
                  placeholderTextColor="#9CA3AF"
                  value={profile.duration}
                  onChangeText={(text) => handleChange("duration", text)}
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          {/* SECTION 5: Resume / CV Documents */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBadge}>
                <Ionicons name="document-text-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>Resume / CV Documents</Text>
            </View>

            <Text style={styles.resumeSectionIntro}>
              Upload your resume document so recruiters can evaluate your background when you apply for jobs.
            </Text>

            {Boolean(profile.resume) ? (
              /* Attached Resume Card */
              <View style={styles.attachedCard}>
                <View style={styles.attachedHeader}>
                  <View
                    style={[
                      styles.fileIconBadge,
                      profile.resume.startsWith("data:image")
                        ? styles.fileIconBadgeImage
                        : profile.resume.startsWith("data:application/pdf") || resumeName?.toLowerCase().endsWith(".pdf")
                        ? styles.fileIconBadgePdf
                        : styles.fileIconBadgeGeneric,
                    ]}
                  >
                    <Ionicons
                      name={
                        profile.resume.startsWith("data:image")
                          ? "image"
                          : profile.resume.startsWith("data:application/pdf") || resumeName?.toLowerCase().endsWith(".pdf")
                          ? "document-text"
                          : profile.resume.startsWith("data:")
                          ? "document"
                          : "link"
                      }
                      size={26}
                      color={
                        profile.resume.startsWith("data:image")
                          ? "#7C3AED"
                          : profile.resume.startsWith("data:application/pdf") || resumeName?.toLowerCase().endsWith(".pdf")
                          ? "#DC2626"
                          : "#2563EB"
                      }
                    />
                  </View>

                  <View style={styles.fileDetails}>
                    <Text style={styles.fileTitle} numberOfLines={1}>
                      {resumeName ||
                        (profile.resume.startsWith("data:application/pdf")
                          ? "Resume.pdf"
                          : profile.resume.startsWith("data:image")
                          ? "Resume_Scan.jpg"
                          : profile.resume.startsWith("data:")
                          ? "Resume_Document"
                          : "Resume_Link")}
                    </Text>
                    <View style={styles.fileMetaRow}>
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={13} color="#16A34A" style={{ marginRight: 3 }} />
                        <Text style={styles.verifiedText}>File Attached</Text>
                      </View>
                      {Boolean(resumeSize) && (
                        <Text style={styles.fileSizeText}>• {resumeSize}</Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.iconRemoveBtn}
                    onPress={handleRemoveResume}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Remove resume"
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Primary Action Buttons */}
                <View style={styles.attachedActions}>
                  <TouchableOpacity
                    style={styles.btnPreview}
                    onPress={handlePreviewResume}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="eye-outline" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                    <Text style={styles.btnPreviewText}>View / Preview</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnReplace}
                    onPress={handlePickResumeFile}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="repeat-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.btnReplaceText}>Replace File</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Upload Options when no file is attached */
              <View style={styles.uploadContainer}>
                {/* 2 Clean Cards for Choosing Files */}
                <View style={styles.uploadCardsRow}>
                  {/* Option 1: Device File Chooser */}
                  <TouchableOpacity
                    style={styles.uploadActionCard}
                    onPress={handlePickResumeFile}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.actionIconCircle, { backgroundColor: "#EFF6FF" }]}>
                      <Ionicons name="document-text" size={26} color="#2563EB" />
                    </View>
                    <Text style={styles.actionCardTitle}>Choose Document</Text>
                    <Text style={styles.actionCardSubtitle}>PDF, Word (.doc/.docx)</Text>
                    <View style={styles.actionPill}>
                      <Ionicons name="folder-open-outline" size={13} color="#2563EB" style={{ marginRight: 4 }} />
                      <Text style={styles.actionPillText}>Browse Files</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Option 2: Photo / Gallery Chooser */}
                  <TouchableOpacity
                    style={styles.uploadActionCard}
                    onPress={handlePickResumeFromGallery}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.actionIconCircle, { backgroundColor: "#F5F3FF" }]}>
                      <Ionicons name="image" size={26} color="#7C3AED" />
                    </View>
                    <Text style={styles.actionCardTitle}>Photo / Scan</Text>
                    <Text style={styles.actionCardSubtitle}>JPG, PNG image files</Text>
                    <View style={[styles.actionPill, { backgroundColor: "#EDE9FE" }]}>
                      <Ionicons name="images-outline" size={13} color="#7C3AED" style={{ marginRight: 4 }} />
                      <Text style={[styles.actionPillText, { color: "#7C3AED" }]}>From Gallery</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Subtle Divider */}
                <View style={styles.orDividerRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR PASTE LINK</Text>
                  <View style={styles.orLine} />
                </View>

                {/* Link input */}
                <View style={styles.linkFieldWrap}>
                  <Text style={styles.fieldLabel}>Google Drive or Public Resume URL</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="link-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      placeholder="https://drive.google.com/file/d/... or website"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="url"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={profile.resume}
                      onChangeText={(text) => {
                        handleChange("resume", text.trim());
                        if (text.trim()) setResumeName("Resume_Link");
                      }}
                      style={styles.input}
                    />
                    {Boolean(profile.resume) && (
                      <TouchableOpacity
                        onPress={() => {
                          handleChange("resume", "");
                          setResumeName("");
                        }}
                        style={{ padding: 6 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.formatNotes}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#16A34A" style={{ marginRight: 5 }} />
                  <Text style={styles.formatNotesText}>
                    Supports PDF, DOC, DOCX, JPG, PNG • Max size 5 MB
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={submitHandler}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={[styles.submitText, { marginLeft: 10 }]}>Saving Profile...</Text>
              </View>
            ) : (
              <View style={styles.loadingRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitText}>Save & Update Profile</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Generous bottom padding to ensure effortless scrolling past end */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Validation Error Modal */}
      <Modal
        visible={validationModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setValidationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.alertIconCircle}>
                <Ionicons name="alert-circle" size={32} color="#F59E0B" />
              </View>
              <Text style={styles.modalTitle}>Profile Needs Attention</Text>
              <Text style={styles.modalSubtitle}>
                Please resolve the following required details before saving:
              </Text>
            </View>

            <ScrollView style={styles.errorScrollView} showsVerticalScrollIndicator={false}>
              {validationErrors.map((err, idx) => (
                <View key={idx} style={styles.errorItem}>
                  <View style={styles.errorBullet} />
                  <View style={styles.errorTextWrap}>
                    <Text style={styles.errorFieldName}>{err.field}</Text>
                    <Text style={styles.errorMessage}>{err.message}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setValidationModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Got it, I'll Fix It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Too Large Modal */}
      <Modal
        visible={imageTooLargeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageTooLargeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={[styles.alertIconCircle, { backgroundColor: "#FEE2E2" }]}>
                <Ionicons name="image" size={32} color="#EF4444" />
              </View>
              <Text style={styles.modalTitle}>Image Is Too Large</Text>
              <Text style={styles.modalSubtitle}>
                The selected photo exceeds the 2 MB limit. Please select a smaller photo or take a new picture.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: "#EF4444" }]}
              onPress={() => setImageTooLargeModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Choose Another Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full-Screen Profile Image Viewer Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageViewerOverlay}>
          {/* Header Bar */}
          <SafeAreaView style={styles.imageViewerHeader} edges={["top"]}>
            <TouchableOpacity
              style={styles.imageViewerCloseBtn}
              onPress={() => setImageModalVisible(false)}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              accessibilityLabel="Close photo view"
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.imageViewerTitleWrap}>
              <Text style={styles.imageViewerTitle} numberOfLines={1}>
                {profile.name || "Profile Photo"}
              </Text>
              <Text style={styles.imageViewerSubtitle}>Profile Picture</Text>
            </View>
            <View style={{ width: 44 }} />
          </SafeAreaView>

          {/* Centered Large Photo */}
          <View style={styles.imageViewerBody}>
            {profile.profileImage ? (
              <Image
                source={{ uri: profile.profileImage }}
                style={styles.imageViewerFullImage}
                resizeMode="contain"
              />
            ) : null}
          </View>

          {/* Bottom Actions */}
          <SafeAreaView style={styles.imageViewerFooter} edges={["bottom"]}>
            <TouchableOpacity
              style={styles.imageViewerChangeBtn}
              onPress={() => {
                setImageModalVisible(false);
                setTimeout(pickImage, 350);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.imageViewerChangeText}>Change Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageViewerDismissBtn}
              onPress={() => setImageModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.imageViewerDismissText}>Close</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  keyboardAvoid: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleWrap: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 140, // High bottom padding ensures smooth scrolling past the bottom button
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  errorHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  loginRedirectBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  loginRedirectText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },

  // Avatar Card
  avatarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#E2E8F0",
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#DBEAFE",
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "700",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2563EB",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 3,
  },
  avatarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  changePhotoText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "600",
  },
  removePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  removePhotoText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
  },
  avatarHint: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  // Field Groups & Inputs
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },
  asterisk: {
    color: "#EF4444",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: "#0F172A",
  },
  clearBtn: {
    padding: 4,
  },
  fieldHelper: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    paddingLeft: 2,
  },
  textAreaWrap: {
    alignItems: "flex-start",
    paddingTop: 8,
    paddingBottom: 8,
  },
  textAreaInput: {
    height: 85,
    textAlignVertical: "top",
  },

  // Chips (Gender & Role)
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  activeChip: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  activeChipText: {
    color: "#FFFFFF",
  },

  // Skill Badges
  skillBadgesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  skillBadge: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1D4ED8",
  },

  // Submit Button
  submitButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 40,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  alertIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  errorScrollView: {
    maxHeight: 200,
    marginVertical: 12,
  },
  errorItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFBEB",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  errorBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F59E0B",
    marginTop: 6,
    marginRight: 8,
  },
  errorTextWrap: {
    flex: 1,
  },
  errorFieldName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
  },
  errorMessage: {
    fontSize: 12,
    color: "#B45309",
    marginTop: 2,
    lineHeight: 16,
  },
  modalBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  modalBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  // SECTION 5: Resume / CV Documents Styles
  resumeSectionIntro: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 14,
    lineHeight: 18,
  },

  // Attached Document Card
  attachedCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 14,
  },
  attachedHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  fileIconBadgePdf: {
    backgroundColor: "#FEE2E2",
  },
  fileIconBadgeImage: {
    backgroundColor: "#EDE9FE",
  },
  fileIconBadgeGeneric: {
    backgroundColor: "#EFF6FF",
  },
  fileDetails: {
    flex: 1,
    marginHorizontal: 12,
  },
  fileTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 3,
  },
  fileMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
  },
  fileSizeText: {
    fontSize: 11,
    color: "#64748B",
    marginLeft: 6,
  },
  iconRemoveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    justifyContent: "center",
    alignItems: "center",
  },
  attachedActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  btnPreview: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnPreviewText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },
  btnReplace: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnReplaceText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },

  // Upload Container & Action Cards
  uploadContainer: {
    width: "100%",
  },
  uploadCardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  uploadActionCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
    textAlign: "center",
  },
  actionCardSubtitle: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 10,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },

  // Divider
  orDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },

  // Link Field
  linkFieldWrap: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
  },

  // Notes
  formatNotes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginTop: 4,
  },
  formatNotesText: {
    fontSize: 11,
    color: "#166534",
    fontWeight: "500",
  },

  // Full-Screen Image Viewer Modal
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "space-between",
  },
  imageViewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  imageViewerCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerTitleWrap: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 12,
  },
  imageViewerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  imageViewerSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 2,
  },
  imageViewerBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  imageViewerFullImage: {
    width: "100%",
    height: "85%",
    borderRadius: 16,
  },
  imageViewerFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    justifyContent: "center",
  },
  imageViewerChangeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
  },
  imageViewerChangeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  imageViewerDismissBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingVertical: 14,
    borderRadius: 12,
  },
  imageViewerDismissText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
