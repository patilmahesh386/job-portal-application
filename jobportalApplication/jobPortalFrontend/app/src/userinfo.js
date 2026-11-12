import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import { logout, setUser, updateProfile } from "../redux/userRegisterSlice";

export default function UserInfo() {
    const user = useSelector((state) => state.auth.user);
    const router = useRouter();
    const dispatch = useDispatch();
    const [imageLoading, setImageLoading] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);

    const handleAvatarPress = () => {
        if (user?.profileImage) {
            setImageModalVisible(true);
        } else {
            handlePickAndChangePhoto();
        }
    };

    useEffect(() => {
        const foregroundSubscription = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log("🔔 Foreground Notification Received:", notification);
            }
        );

        // 2. Listener for notification tap response
        const responseSubscription = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                console.log(
                    "👉 User tapped notification:",
                    response.notification.request.content.data
                );
            }
        );

        return () => {
            foregroundSubscription.remove();
            responseSubscription.remove();
        };
    }, []);

    const handlePickAndChangePhoto = async () => {
        if (!user?._id) {
            Alert.alert("Notice", "User ID not found. Please log in again.");
            return;
        }

        try {
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert(
                    "Permission Required",
                    "Please allow gallery access to select a profile photo."
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setImageLoading(true);
                const asset = result.assets[0];
                const base64Image = asset.base64
                    ? `data:image/jpeg;base64,${asset.base64}`
                    : asset.uri;

                const res = await dispatch(
                    updateProfile({
                        data: { profileImage: base64Image },
                        userId: user._id,
                    })
                ).unwrap();

                const updatedUser = res?.user || res;
                if (updatedUser) {
                    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
                    dispatch(setUser(updatedUser));
                }

                Toast.show({
                    type: "success",
                    text1: "Profile Photo Updated 🎉",
                });
            }
        } catch (err) {
            console.log("Error changing photo:", err);
            Toast.show({
                type: "error",
                text1: "Failed to update profile photo",
            });
        } finally {
            setImageLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("user");
            dispatch(logout());
            console.log("User successfully logged out");
            router.replace("/src/login");
        } catch (error) {
            console.log("Error occurred in logout method: ", error);
        }
    };

    const isRecruiterOrAdmin = user?.role === "recruiter" || user?.role === "admin";

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Header Section */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.avatarWrapper}
                    onPress={handleAvatarPress}
                    activeOpacity={0.85}
                    disabled={imageLoading}
                    accessibilityLabel={user?.profileImage ? "View profile photo" : "Change profile photo"}
                >
                    <View style={styles.avatarContainer}>
                        {imageLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : user?.profileImage ? (
                            <Image
                                source={{ uri: user.profileImage }}
                                style={styles.avatarImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <Text style={styles.avatarText}>
                                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.cameraBadge}
                        onPress={handlePickAndChangePhoto}
                        activeOpacity={0.8}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        disabled={imageLoading}
                        accessibilityLabel="Change photo"
                    >
                        <Ionicons name="camera" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handlePickAndChangePhoto}
                    activeOpacity={0.7}
                    style={styles.changePhotoBtn}
                    disabled={imageLoading}
                >
                    <Text style={styles.changePhotoText}>
                        {imageLoading ? "Updating photo..." : "Tap to change photo"}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.greeting}>Welcome back,</Text>
                <Text style={styles.userName}>{user?.name || "User"}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{user?.role || "Member"}</Text>
                </View>
            </View>

            {/* Menu Options Section */}
            <View style={styles.menuGroup}>
                <Text style={styles.sectionTitle}>Account & Activities</Text>

                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.7}
                    onPress={() => router.push("/src/profile")}
                >
                    <View>
                        <Text style={styles.cardTitle}>My Profile</Text>
                        <Text style={styles.cardSubtitle}>Manage personal details and contact info</Text>
                    </View>
                </TouchableOpacity>

                {isRecruiterOrAdmin && (
                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.7}
                        onPress={() => router.push("/src/postJob")}
                    >
                        <View>
                            <Text style={styles.cardTitle}>Post a New Job</Text>
                            <Text style={styles.cardSubtitle}>Find talent by publishing new openings</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {isRecruiterOrAdmin && (
                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.7}
                        onPress={() => router.push("/src/postedJobs")}
                    >
                        <View>
                            <Text style={styles.cardTitle}>Your Posted Jobs</Text>
                            <Text style={styles.cardSubtitle}>Track listings and incoming applications</Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                style={styles.logoutButton}
                activeOpacity={0.8}
                onPress={handleLogout}
            >
                <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>

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
                                {user?.name || "Profile Photo"}
                            </Text>
                            <Text style={styles.imageViewerSubtitle}>Profile Picture</Text>
                        </View>
                        <View style={{ width: 44 }} />
                    </SafeAreaView>

                    {/* Centered Large Photo */}
                    <View style={styles.imageViewerBody}>
                        {user?.profileImage ? (
                            <Image
                                source={{ uri: user.profileImage }}
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
                                setTimeout(handlePickAndChangePhoto, 350);
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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    contentContainer: {
        paddingHorizontal: 24,
        paddingTop: 50,
        paddingBottom: 40,
    },
    header: {
        alignItems: "center",
        marginBottom: 32,
    },
    avatarWrapper: {
        position: "relative",
        marginBottom: 8,
    },
    avatarContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: "#6366F1",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderWidth: 3,
        borderColor: "#E0E7FF",
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarImage: {
        width: 88,
        height: 88,
        borderRadius: 44,
    },
    avatarText: {
        color: "#FFFFFF",
        fontSize: 34,
        fontWeight: "700",
    },
    cameraBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#2563EB",
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFFFFF",
        elevation: 3,
    },
    changePhotoBtn: {
        marginBottom: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    changePhotoText: {
        fontSize: 12,
        color: "#2563EB",
        fontWeight: "600",
    },
    greeting: {
        fontSize: 16,
        color: "#64748B",
        fontWeight: "500",
    },
    userName: {
        fontSize: 26,
        fontWeight: "700",
        color: "#0F172A",
        marginTop: 2,
    },
    roleBadge: {
        marginTop: 8,
        backgroundColor: "#EEF2F6",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    roleText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    menuGroup: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#94A3B8",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 16,
        paddingLeft: 4,
    },
    card: {
        backgroundColor: "#FFFFFF",
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: "#1E293B",
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: "#64748B",
    },
    logoutButton: {
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FEE2E2",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#EF4444",
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
        backgroundColor: "#6366F1",
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
