import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { useDispatch } from "react-redux";
import { Register } from "../redux/userRegisterSlice";

export default function RegisterScreen() {
    const dispatch = useDispatch();
    const router = useRouter();

    const [name, setname] = useState("");
    const [age, setAge] = useState("");
    const [email, setEmail] = useState("");
    const [gender, setGender] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState("candidate");
    const [profileImage, setProfileImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showLargeImageModal, setShowLargeImageModal] = useState(false);
    const [selectedImageSize, setSelectedImageSize] = useState("");

    const pickImage = async () => {
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
                quality: 0.3,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                const MAX_ALLOWED_BYTES = 2 * 1024 * 1024; // 2 MB limit

                // Calculate estimated file size in bytes
                const approxBytes = asset.fileSize || (asset.base64 ? Math.round((asset.base64.length * 3) / 4) : 0);

                if (approxBytes > MAX_ALLOWED_BYTES) {
                    const sizeInMb = (approxBytes / (1024 * 1024)).toFixed(1);
                    setSelectedImageSize(`${sizeInMb} MB`);
                    setShowLargeImageModal(true);
                    return;
                }

                const base64Image = asset.base64
                    ? `data:image/jpeg;base64,${asset.base64}`
                    : asset.uri;
                setProfileImage(base64Image);
            }
        } catch (error) {
            console.log("Error picking image:", error);
            Alert.alert("Error", "Could not select image. Please try again.");
        }
    };

    const handleRemoveImage = () => {
        setProfileImage(null);
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            Alert.alert("Validation Error", "Please enter your name.");
            return;
        }
        if (!age.trim() || isNaN(Number(age)) || Number(age) < 18) {
            Alert.alert("Validation Error", "Please enter a valid age (18 or older).");
            return;
        }
        if (!email.trim()) {
            Alert.alert("Validation Error", "Please enter your email.");
            return;
        }
        if (!gender.trim()) {
            Alert.alert("Validation Error", "Please select or enter your gender.");
            return;
        }
        if (!password || password.length < 6) {
            Alert.alert(
                "Validation Error",
                "Password must be at least 6 characters long."
            );
            return;
        }

        setLoading(true);
        const data = {
            name: name.trim(),
            age: Number(age),
            email: email.trim(),
            gender: gender.toLowerCase().trim(),
            password,
            role,
            profileImage: profileImage || "",
        };

        try {
            const res = await dispatch(Register(data)).unwrap();
            Alert.alert("Success", "Registration successful!");

            await AsyncStorage.setItem("token", res.token);
            await AsyncStorage.setItem("user", JSON.stringify(res.user || res));

            setname("");
            setAge("");
            setEmail("");
            setGender("");
            setPassword("");
            setRole("candidate");
            setProfileImage(null);

            router.replace("/(tabs)/home");
        } catch (err) {
            console.log("Registration error:", err);
            Alert.alert(
                "Registration Failed",
                typeof err === "string"
                    ? err
                    : err?.message || "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.heading}>Create Account ✨</Text>
                        <Text style={styles.subheading}>
                            Join JobPortal to find jobs or hire talent
                        </Text>
                    </View>

                    {/* Registration Card */}
                    <View style={styles.card}>
                        {/* Profile Photo Selector */}
                        <View style={styles.imageSection}>
                            <TouchableOpacity
                                style={styles.imageContainer}
                                onPress={pickImage}
                                activeOpacity={0.8}
                                accessibilityLabel="Select profile picture"
                            >
                                {profileImage ? (
                                    <Image
                                        source={{ uri: profileImage }}
                                        style={styles.profileImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.placeholderContainer}>
                                        <Ionicons name="person" size={54} color="#94A3B8" />
                                    </View>
                                )}
                                <View style={styles.cameraBadge}>
                                    <Ionicons
                                        name={profileImage ? "camera" : "add"}
                                        size={18}
                                        color="#FFFFFF"
                                    />
                                </View>
                            </TouchableOpacity>

                            {/* Image Actions */}
                            {profileImage ? (
                                <View style={styles.imageActionsRow}>
                                    <TouchableOpacity
                                        style={styles.imageActionButton}
                                        onPress={pickImage}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="camera-outline" size={16} color="#2563EB" />
                                        <Text style={styles.imageActionText}>Change</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.imageActionButton, styles.imageDeleteButton]}
                                        onPress={handleRemoveImage}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                        <Text style={[styles.imageActionText, styles.imageDeleteText]}>
                                            Remove
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={styles.imageHelperText}>
                                    Tap to upload your profile photo
                                </Text>
                            )}
                        </View>

                        {/* Name Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="person-outline"
                                    size={18}
                                    color="#6B7280"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    placeholder="Enter your full name (e.g. John Doe)"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setname}
                                />
                            </View>
                        </View>

                        {/* Age Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Age</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={18}
                                    color="#6B7280"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    placeholder="Enter your age (e.g. 25)"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={age}
                                    onChangeText={setAge}
                                />
                            </View>
                        </View>

                        {/* Email Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="mail-outline"
                                    size={18}
                                    color="#6B7280"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    placeholder="Enter your email address (e.g. name@example.com)"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.input}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>

                        {/* Gender Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Gender</Text>
                            {/* Gender Quick Select Chips */}
                            <View style={styles.genderChipsRow}>
                                {["male", "female", "other"].map((g) => {
                                    const isSelected = gender.toLowerCase() === g;
                                    return (
                                        <TouchableOpacity
                                            key={g}
                                            style={[
                                                styles.genderChip,
                                                isSelected && styles.genderChipSelected,
                                            ]}
                                            onPress={() => setGender(g)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.genderChipText,
                                                    isSelected && styles.genderChipTextSelected,
                                                ]}
                                            >
                                                {g.charAt(0).toUpperCase() + g.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <View style={[styles.inputWrapper, { marginTop: 8 }]}>
                                <Ionicons
                                    name="male-female-outline"
                                    size={18}
                                    color="#6B7280"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    placeholder="Or type gender (Male, Female, Other)"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.input}
                                    value={gender}
                                    onChangeText={setGender}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        {/* Password Field with Eye Button */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={18}
                                    color="#6B7280"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    placeholder="Create password (min 6 characters)"
                                    placeholderTextColor="#9CA3AF"
                                    style={[styles.input, styles.passwordInput]}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword((prev) => !prev)}
                                    style={styles.eyeButton}
                                    activeOpacity={0.7}
                                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#6B7280"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Role Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Register as</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={role}
                                    onValueChange={(itemValue) => setRole(itemValue)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Candidate (Looking for jobs)" value="candidate" />
                                    <Picker.Item label="Recruiter (Hiring talent)" value="recruiter" />
                                </Picker>
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Text style={styles.submitButtonText}>Create Account</Text>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Footer: Login Link */}
                        <View style={styles.footerRow}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity
                                onPress={() => router.push("/src/login")}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.loginLink}>Sign In Here</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Image Too Large Modal */}
            <Modal
                visible={showLargeImageModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLargeImageModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        {/* Warning Icon Badge */}
                        <View style={styles.modalIconContainer}>
                            <Ionicons name="images-outline" size={36} color="#EF4444" />
                        </View>

                        {/* Title */}
                        <Text style={styles.modalTitle}>Image Is Too Large</Text>

                        {/* Message */}
                        <Text style={styles.modalMessage}>
                            The selected photo exceeds the maximum allowed size (max 2 MB).
                            Please select a smaller photo or crop it before uploading.
                        </Text>

                        {/* Size Details */}
                        {selectedImageSize ? (
                            <View style={styles.modalSizeBadge}>
                                <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
                                <Text style={styles.modalSizeText}>
                                    Selected size: {selectedImageSize}
                                </Text>
                            </View>
                        ) : null}

                        {/* Modal Action Buttons */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalPrimaryBtn}
                                onPress={() => {
                                    setShowLargeImageModal(false);
                                    setTimeout(() => pickImage(), 350);
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="camera-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                <Text style={styles.modalPrimaryBtnText}>Choose Another</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalSecondaryBtn}
                                onPress={() => setShowLargeImageModal(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F3F6FB",
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    header: {
        alignItems: "center",
        marginBottom: 20,
    },
    heading: {
        fontSize: 26,
        fontWeight: "bold",
        textAlign: "center",
        color: "#1E293B",
        marginBottom: 6,
    },
    subheading: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 22,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    imageSection: {
        alignItems: "center",
        marginBottom: 20,
    },
    imageContainer: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        borderColor: "#2563EB",
        backgroundColor: "#F1F5F9",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    profileImage: {
        width: 104,
        height: 104,
        borderRadius: 52,
    },
    placeholderContainer: {
        width: "100%",
        height: "100%",
        borderRadius: 55,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F1F5F9",
    },
    cameraBadge: {
        position: "absolute",
        bottom: 2,
        right: 2,
        backgroundColor: "#2563EB",
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2.5,
        borderColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    imageActionsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginTop: 10,
    },
    imageActionButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: "#EFF6FF",
        borderWidth: 1,
        borderColor: "#DBEAFE",
    },
    imageActionText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#2563EB",
    },
    imageDeleteButton: {
        backgroundColor: "#FEF2F2",
        borderColor: "#FEE2E2",
    },
    imageDeleteText: {
        color: "#EF4444",
    },
    imageHelperText: {
        fontSize: 13,
        color: "#64748B",
        marginTop: 8,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#334155",
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: "#1E293B",
    },
    passwordInput: {
        paddingRight: 8,
    },
    eyeButton: {
        padding: 6,
    },
    genderChipsRow: {
        flexDirection: "row",
        gap: 10,
    },
    genderChip: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "transparent",
    },
    genderChipSelected: {
        backgroundColor: "#EFF6FF",
        borderColor: "#2563EB",
    },
    genderChipText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#64748B",
    },
    genderChipTextSelected: {
        color: "#2563EB",
    },
    pickerContainer: {
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        backgroundColor: "#F8FAFC",
        overflow: "hidden",
    },
    picker: {
        height: 50,
        color: "#1E293B",
    },
    submitButton: {
        backgroundColor: "#2563EB",
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },
    submitButtonDisabled: {
        backgroundColor: "#93C5FD",
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    submitButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    footerRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
    },
    footerText: {
        fontSize: 14,
        color: "#64748B",
    },
    loginLink: {
        fontSize: 14,
        fontWeight: "700",
        color: "#2563EB",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    modalCard: {
        width: "100%",
        maxWidth: 340,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    modalIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#FEE2E2",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#FECACA",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1E293B",
        textAlign: "center",
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 14,
    },
    modalSizeBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: "#FEE2E2",
    },
    modalSizeText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#DC2626",
    },
    modalActions: {
        width: "100%",
        gap: 10,
    },
    modalPrimaryBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2563EB",
        paddingVertical: 13,
        borderRadius: 12,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    modalPrimaryBtnText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    modalSecondaryBtn: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F1F5F9",
    },
    modalSecondaryBtnText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#64748B",
    },
});
