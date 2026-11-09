import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
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
import { useDispatch } from "react-redux";
import {
    forgotPassword,
    login,
    resetPassword,
} from "../redux/userRegisterSlice";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const router = useRouter();

    // Forgot Password Flow States
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1 = Request Code, 2 = Enter Code & New Password
    const [forgotEmail, setForgotEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Countdown timer for code resend
    useEffect(() => {
        let timer = null;
        if (resendCooldown > 0) {
            timer = setInterval(() => {
                setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [resendCooldown]);

    const openForgotPasswordModal = () => {
        setForgotEmail(email.trim());
        setOtpCode("");
        setNewPassword("");
        setConfirmPassword("");
        setForgotStep(1);
        setShowForgotModal(true);
    };

    const handleSendResetCode = async () => {
        const trimmedEmail = forgotEmail.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!trimmedEmail) {
            Toast.show({
                type: "error",
                text1: "Email Required",
                text2: "Please enter your registered email address.",
            });
            return;
        }

        if (!emailRegex.test(trimmedEmail)) {
            Toast.show({
                type: "error",
                text1: "Invalid Email",
                text2: "Please enter a valid email address.",
            });
            return;
        }

        setForgotLoading(true);
        try {
            const res = await dispatch(forgotPassword({ email: trimmedEmail })).unwrap();
            Toast.show({
                type: "success",
                text1: "Code Sent via Gmail 📧",
                text2: res.message || "Please check your inbox or spam folder.",
            });
            setForgotStep(2);
            setResendCooldown(60);
        } catch (err) {
            Toast.show({
                type: "error",
                text1: "Request Failed",
                text2: typeof err === "string" ? err : "Could not send reset code. Please verify email.",
            });
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0 || forgotLoading) return;
        await handleSendResetCode();
    };

    const handleUpdatePassword = async () => {
        const trimmedOtp = otpCode.trim();

        if (!trimmedOtp || trimmedOtp.length < 4) {
            Toast.show({
                type: "error",
                text1: "Invalid Code",
                text2: "Please enter the 6-digit verification code from your Gmail.",
            });
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            Toast.show({
                type: "error",
                text1: "Password Too Short",
                text2: "New password must be at least 6 characters long.",
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.show({
                type: "error",
                text1: "Passwords Do Not Match",
                text2: "Confirm password must match the new password.",
            });
            return;
        }

        setForgotLoading(true);
        try {
            const res = await dispatch(
                resetPassword({
                    email: forgotEmail.trim(),
                    otp: trimmedOtp,
                    newPassword,
                })
            ).unwrap();

            Toast.show({
                type: "success",
                text1: "Password Updated 🎉",
                text2: "Your password has been changed. Please sign in with your new password.",
            });

            // Pre-fill email on login screen and close modal
            setEmail(forgotEmail.trim());
            setPassword("");
            setShowForgotModal(false);
            setForgotStep(1);
            setOtpCode("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            Toast.show({
                type: "error",
                text1: "Reset Failed",
                text2: typeof err === "string" ? err : "Failed to reset password. Please verify your code.",
            });
        } finally {
            setForgotLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            Toast.show({
                type: "error",
                text1: "Validation Error",
                text2: "Please enter both email and password",
            });
            return;
        }

        setLoading(true);
        const data = {
            email: email.trim(),
            password,
        };

        try {
            const response = await dispatch(login(data)).unwrap();

            console.log("Login success", response);
            Toast.show({
                type: "success",
                text1: "Login Successfully",
            });

            await AsyncStorage.setItem("token", response.token);
            await AsyncStorage.setItem("user", JSON.stringify(response.user));
            setEmail("");
            setPassword("");
            router.replace("/(tabs)/home");
        } catch (error) {
            console.log(error);
            Toast.show({
                type: "error",
                text1: "Login Failed",
                text2: typeof error === "string" ? error : "Incorrect Email or Password",
            });
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
                    {/* Header Branding */}
                    <View style={styles.header}>
                        <View style={styles.logoBadge}>
                            <Ionicons name="briefcase" size={34} color="#2563EB" />
                        </View>
                        <Text style={styles.title}>Welcome Back 👋</Text>
                        <Text style={styles.subtitle}>Sign in to your Job Portal account</Text>
                    </View>

                    {/* Login Card */}
                    <View style={styles.card}>
                        {/* Email Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="mail-outline"
                                    size={20}
                                    color="#6B7280"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    placeholder="Enter your email address"
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

                        {/* Password Field with Eye Button */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color="#6B7280"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    placeholder="Enter your password"
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
                                        size={22}
                                        color="#6B7280"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Forgot Password Link */}
                        <View style={styles.forgotPasswordRow}>
                            <TouchableOpacity
                                onPress={openForgotPasswordModal}
                                activeOpacity={0.7}
                                accessibilityLabel="Forgot password"
                            >
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Text style={styles.loginButtonText}>Sign In</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Footer: Register link */}
                        <View style={styles.footerRow}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity
                                onPress={() => router.push("/src/register")}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.registerLink}>Register Here</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Forgot Password Modal */}
            <Modal
                visible={showForgotModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowForgotModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalBackdrop}>
                        <View style={styles.modalCard}>
                            {/* Modal Header */}
                            <View style={styles.modalHeaderRow}>
                                <View style={styles.modalIconWrap}>
                                    <Ionicons
                                        name={forgotStep === 1 ? "mail-outline" : "key-outline"}
                                        size={22}
                                        color="#2563EB"
                                    />
                                </View>
                                <View style={styles.modalHeaderTitles}>
                                    <Text style={styles.modalTitle}>
                                        {forgotStep === 1 ? "Forgot Password" : "Reset Password"}
                                    </Text>
                                    <Text style={styles.modalSubtitle}>
                                        {forgotStep === 1
                                            ? "Enter your email to receive a Gmail verification code"
                                            : "Enter the 6-digit code and choose a new password"}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setShowForgotModal(false)}
                                    style={styles.modalCloseButton}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    accessibilityLabel="Close dialog"
                                >
                                    <Ionicons name="close" size={22} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            {forgotStep === 1 ? (
                                /* STEP 1: Enter Email */
                                <View style={styles.modalBody}>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>Registered Email Address</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons
                                                name="mail-outline"
                                                size={20}
                                                color="#6B7280"
                                                style={styles.inputIcon}
                                            />
                                            <TextInput
                                                placeholder="e.g. name@gmail.com"
                                                placeholderTextColor="#9CA3AF"
                                                style={styles.input}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                value={forgotEmail}
                                                onChangeText={setForgotEmail}
                                            />
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.primaryModalBtn, forgotLoading && styles.btnDisabled]}
                                        onPress={handleSendResetCode}
                                        disabled={forgotLoading}
                                        activeOpacity={0.8}
                                    >
                                        {forgotLoading ? (
                                            <ActivityIndicator color="#FFFFFF" size="small" />
                                        ) : (
                                            <View style={styles.buttonContent}>
                                                <Text style={styles.primaryModalBtnText}>
                                                    Send Verification Code
                                                </Text>
                                                <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                /* STEP 2: Enter OTP & New Password */
                                <View style={styles.modalBody}>
                                    {/* Email indicator badge */}
                                    <View style={styles.emailPillWrap}>
                                        <Ionicons name="mail" size={14} color="#2563EB" style={{ marginRight: 6 }} />
                                        <Text style={styles.emailPillText} numberOfLines={1}>
                                            Code sent to {forgotEmail}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setForgotStep(1)}
                                            style={styles.changeEmailLink}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.changeEmailLinkText}>Change</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* 6-digit OTP code */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>6-Digit Verification Code</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons
                                                name="shield-checkmark-outline"
                                                size={20}
                                                color="#6B7280"
                                                style={styles.inputIcon}
                                            />
                                            <TextInput
                                                placeholder="123456"
                                                placeholderTextColor="#9CA3AF"
                                                style={[styles.input, styles.otpInput]}
                                                keyboardType="number-pad"
                                                maxLength={6}
                                                value={otpCode}
                                                onChangeText={setOtpCode}
                                            />
                                        </View>
                                        <Text style={styles.fieldHint}>
                                            Check your Gmail inbox or spam folder for the code.
                                        </Text>
                                    </View>

                                    {/* New Password */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>New Password</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons
                                                name="lock-closed-outline"
                                                size={20}
                                                color="#6B7280"
                                                style={styles.inputIcon}
                                            />
                                            <TextInput
                                                placeholder="Minimum 6 characters"
                                                placeholderTextColor="#9CA3AF"
                                                style={[styles.input, styles.passwordInput]}
                                                secureTextEntry={!showNewPassword}
                                                autoCapitalize="none"
                                                value={newPassword}
                                                onChangeText={setNewPassword}
                                            />
                                            <TouchableOpacity
                                                onPress={() => setShowNewPassword((prev) => !prev)}
                                                style={styles.eyeButton}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons
                                                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                                                    size={20}
                                                    color="#6B7280"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Confirm New Password */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>Confirm New Password</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons
                                                name="lock-closed-outline"
                                                size={20}
                                                color="#6B7280"
                                                style={styles.inputIcon}
                                            />
                                            <TextInput
                                                placeholder="Re-enter your new password"
                                                placeholderTextColor="#9CA3AF"
                                                style={[styles.input, styles.passwordInput]}
                                                secureTextEntry={!showConfirmPassword}
                                                autoCapitalize="none"
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                            />
                                            <TouchableOpacity
                                                onPress={() => setShowConfirmPassword((prev) => !prev)}
                                                style={styles.eyeButton}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons
                                                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                                    size={20}
                                                    color="#6B7280"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Submit button */}
                                    <TouchableOpacity
                                        style={[styles.primaryModalBtn, forgotLoading && styles.btnDisabled]}
                                        onPress={handleUpdatePassword}
                                        disabled={forgotLoading}
                                        activeOpacity={0.8}
                                    >
                                        {forgotLoading ? (
                                            <ActivityIndicator color="#FFFFFF" size="small" />
                                        ) : (
                                            <View style={styles.buttonContent}>
                                                <Text style={styles.primaryModalBtnText}>Update Password</Text>
                                                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    {/* Resend link */}
                                    <View style={styles.resendRow}>
                                        <Text style={styles.resendPrompt}>Didn't receive code? </Text>
                                        <TouchableOpacity
                                            onPress={handleResendCode}
                                            disabled={resendCooldown > 0 || forgotLoading}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.resendLink,
                                                    resendCooldown > 0 && styles.resendLinkDisabled,
                                                ]}
                                            >
                                                {resendCooldown > 0
                                                    ? `Resend in ${resendCooldown}s`
                                                    : "Resend Code"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

export default Login;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F3F6FB",
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    header: {
        alignItems: "center",
        marginBottom: 24,
    },
    logoBadge: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: "#EFF6FF",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#DBEAFE",
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: "#1E293B",
        textAlign: "center",
        marginBottom: 6,
    },
    subtitle: {
        textAlign: "center",
        color: "#64748B",
        fontSize: 14,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    inputContainer: {
        marginBottom: 18,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
        color: "#334155",
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
        paddingVertical: 13,
        fontSize: 15,
        color: "#1E293B",
    },
    passwordInput: {
        paddingRight: 8,
    },
    eyeButton: {
        padding: 6,
    },
    loginButton: {
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
    loginButtonDisabled: {
        backgroundColor: "#93C5FD",
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    loginButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    footerRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22,
    },
    footerText: {
        fontSize: 14,
        color: "#64748B",
    },
    registerLink: {
        fontSize: 14,
        fontWeight: "700",
        color: "#2563EB",
    },
    forgotPasswordRow: {
        alignItems: "flex-end",
        marginTop: 2,
        marginBottom: 16,
    },
    forgotPasswordText: {
        color: "#2563EB",
        fontSize: 13,
        fontWeight: "600",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    modalBackdrop: {
        width: "100%",
        maxWidth: 420,
    },
    modalCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 22,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeaderRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    modalIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#EFF6FF",
        borderWidth: 1,
        borderColor: "#DBEAFE",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    modalHeaderTitles: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
    },
    modalSubtitle: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 2,
        lineHeight: 17,
    },
    modalCloseButton: {
        padding: 4,
        marginLeft: 8,
    },
    modalBody: {
        width: "100%",
    },
    emailPillWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EFF6FF",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 9,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    emailPillText: {
        flex: 1,
        fontSize: 12,
        color: "#1E40AF",
        fontWeight: "600",
    },
    changeEmailLink: {
        paddingLeft: 8,
    },
    changeEmailLinkText: {
        fontSize: 12,
        color: "#2563EB",
        fontWeight: "700",
    },
    otpInput: {
        letterSpacing: 6,
        fontWeight: "700",
        fontSize: 18,
        textAlign: "center",
    },
    fieldHint: {
        fontSize: 11,
        color: "#64748B",
        marginTop: 4,
        fontWeight: "500",
    },
    primaryModalBtn: {
        backgroundColor: "#2563EB",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },
    btnDisabled: {
        backgroundColor: "#93C5FD",
        shadowOpacity: 0,
        elevation: 0,
    },
    primaryModalBtnText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
    resendRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
    },
    resendPrompt: {
        fontSize: 13,
        color: "#64748B",
    },
    resendLink: {
        fontSize: 13,
        color: "#2563EB",
        fontWeight: "700",
    },
    resendLinkDisabled: {
        color: "#94A3B8",
    },
});
