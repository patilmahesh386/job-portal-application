import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
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
import { postJob } from "../redux/jobPostSlice";
import { sendNotification } from "../redux/notificationSlice";

const PostJob = () => {
    const router = useRouter();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorModalTitle, setErrorModalTitle] = useState("Validation Error");
    const [validationErrors, setValidationErrors] = useState([]);

    const user = useSelector((state) => state.auth?.user);
    const userId = user?._id;
    const dispatch = useDispatch();

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/src/userinfo");
        }
    };

    const [jobData, setJobData] = useState({
        title: "",
        companyName: user?.companyName || "",
        companyWebsite: user?.companyWebsite || "",
        companyIndustry: user?.companyIndustry || "",
        companySize: user?.companySize || "",
        companyAbout: user?.companyAbout || "",
        jobSummary: "",
        vacancy: "",
        template: "",
        jobLocation: user?.companyLocation || user?.location || "",
        salary: "",
        jobType: "Full-Time",
        experience: "",
        deadline: "", // Stored clean as ISO string format
    });

    const handleChange = (key, value) => {
        setJobData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleJobPost = async () => {
        // Collect detailed user-friendly validation errors
        const errors = [];

        // Job Title validation (must be string, not purely numbers, min 3, max 120)
        const titleTrimmed = String(jobData.title || "").trim();
        const hasLetters = /[a-zA-Z]/.test(titleTrimmed);

        if (!titleTrimmed) {
            errors.push("Job Title is missing. Please enter a job title (e.g. Senior React Developer).");
        } else if (!isNaN(Number(titleTrimmed))) {
            errors.push("Job Title must be a valid text string containing letters, not only numbers.");
        } else if (!hasLetters) {
            errors.push("Job Title must contain alphabetic letters (cannot consist solely of numbers or symbols).");
        } else if (titleTrimmed.length < 3) {
            errors.push("Job Title must be at least 3 characters long.");
        } else if (titleTrimmed.length > 120) {
            errors.push("Job Title cannot exceed 120 characters.");
        }

        // Company Name validation
        const companyNameTrimmed = String(jobData.companyName || "").trim();
        if (!companyNameTrimmed) {
            errors.push("Company / Organization Name is required. Please specify the hiring company.");
        } else if (companyNameTrimmed.length < 2) {
            errors.push("Company Name must be at least 2 characters long.");
        }

        // Company Website validation (Optional, but if given must be valid)
        if (jobData.companyWebsite && jobData.companyWebsite.trim().length > 0) {
            const websiteUrl = jobData.companyWebsite.trim();
            const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/i;
            if (!urlPattern.test(websiteUrl)) {
                errors.push("Company Website must be a valid URL (e.g. https://company.com).");
            }
        }

        if (!jobData.jobSummary?.trim()) {
            errors.push("Job Summary is missing. Please provide a description of responsibilities and requirements.");
        } else if (jobData.jobSummary.trim().length < 10) {
            errors.push("Job Summary is too brief. Please write at least 10 characters.");
        }

        // Vacancy validation
        if (!jobData.vacancy || isNaN(Number(jobData.vacancy)) || Number(jobData.vacancy) < 1 || !Number.isInteger(Number(jobData.vacancy))) {
            errors.push("Vacancy Count is required and must be a valid positive whole number (e.g. 1, 3, 5).");
        }

        // Salary validation (must be number)
        const salaryTrimmed = String(jobData.salary ?? "").trim();
        if (!salaryTrimmed) {
            errors.push("Salary Budget is required. Please enter a valid number (e.g. 600000 or 50000).");
        } else if (isNaN(Number(salaryTrimmed)) || Number(salaryTrimmed) < 0) {
            errors.push("Salary Budget must be a valid non-negative number.");
        }

        // Location validation
        if (!jobData.jobLocation?.trim()) {
            errors.push("Job Location is required. Please specify a location or work mode (e.g. Pune, Maharashtra or Remote).");
        } else if (jobData.jobLocation.trim().length < 2) {
            errors.push("Job Location must be at least 2 characters long.");
        }

        // Experience validation (must be number of years)
        const experienceTrimmed = String(jobData.experience ?? "").trim();
        if (!experienceTrimmed) {
            errors.push("Experience is required. Please enter required years of experience (e.g. 0 for Fresher, 2 for 2 years).");
        } else if (isNaN(Number(experienceTrimmed)) || Number(experienceTrimmed) < 0) {
            errors.push("Experience must be a valid non-negative number of years (e.g. 0, 2, 5).");
        }

        if (!jobData.deadline) {
            errors.push("Application Deadline is required. Tap 'Select application deadline' to choose a date.");
        }

        if (errors.length > 0) {
            setErrorModalTitle("Cannot Publish Job");
            setValidationErrors(errors);
            setErrorModalVisible(true);
            return;
        }

        setLoading(true);
        try {
            let formattedCompanyWebsite = jobData.companyWebsite ? jobData.companyWebsite.trim() : "";
            if (
                formattedCompanyWebsite &&
                !formattedCompanyWebsite.startsWith("http://") &&
                !formattedCompanyWebsite.startsWith("https://")
            ) {
                formattedCompanyWebsite = "https://" + formattedCompanyWebsite;
            }

            const payload = {
                ...jobData,
                companyName: companyNameTrimmed,
                companyWebsite: formattedCompanyWebsite,
                companyIndustry: jobData.companyIndustry ? jobData.companyIndustry.trim() : "",
                companySize: jobData.companySize ? jobData.companySize.trim() : "",
                companyAbout: jobData.companyAbout ? jobData.companyAbout.trim() : "",
                vacancy: Number(jobData.vacancy),
                salary: Number(salaryTrimmed),
                experience: Number(experienceTrimmed),
            };
            const response = await dispatch(postJob(payload)).unwrap();
            console.log("Server Response:", response);

            Toast.show({
                type: "success",
                text1: "Job Posted Successfully 🎉",
                text2: `"${jobData.title}" is now live!`,
            });

            if (userId) {
                dispatch(
                    sendNotification({
                        userId: userId,
                        title: "Job Posted Successfully",
                        body: jobData.title,
                        data: {
                            type: "JOBPOSTED",
                        },
                    })
                );
            }

            setJobData({
                title: "",
                companyName: user?.companyName || "",
                companyWebsite: user?.companyWebsite || "",
                companyIndustry: user?.companyIndustry || "",
                companySize: user?.companySize || "",
                companyAbout: user?.companyAbout || "",
                jobSummary: "",
                vacancy: "",
                template: "",
                jobLocation: user?.companyLocation || user?.location || "",
                salary: "",
                jobType: "Full-Time",
                experience: "",
                deadline: "",
            });
        } catch (error) {
            console.log("Error posting job:", error);
            const rawMessage = typeof error === "string" ? error : error?.message || "Failed to post job.";

            if (
                rawMessage.includes("PayloadTooLargeError") ||
                rawMessage.includes("413") ||
                rawMessage.includes("too large")
            ) {
                setErrorModalTitle("Banner Image Too Large");
                setValidationErrors([
                    "The banner image you attached exceeds the maximum allowed size (limit: 2 MB).",
                    "Please choose a smaller image, crop it, or remove the banner and try again.",
                ]);
            } else if (rawMessage.includes("authority") || rawMessage.includes("403")) {
                setErrorModalTitle("Recruiter Permission Required");
                setValidationErrors([
                    "Your account does not have Recruiter authority to post new jobs.",
                    "Only accounts registered with the 'Recruiter' or 'Admin' role can publish job openings.",
                ]);
            } else {
                setErrorModalTitle("Job Posting Failed");
                setValidationErrors([rawMessage]);
            }

            setErrorModalVisible(true);
        } finally {
            setLoading(false);
        }
    };

    const ImagePick = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                setErrorModalTitle("Permission Required");
                setValidationErrors(["Please allow photo gallery permissions in your device settings to select banner images."]);
                setErrorModalVisible(true);
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.3, // Compressed to produce fast, lightweight payloads
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                const MAX_ALLOWED_BYTES = 2 * 1024 * 1024; // 2 MB limit
                const approxBytes = asset.fileSize || (asset.base64 ? Math.round((asset.base64.length * 3) / 4) : 0);

                if (approxBytes > MAX_ALLOWED_BYTES) {
                    const sizeInMb = (approxBytes / (1024 * 1024)).toFixed(1);
                    setErrorModalTitle("Banner Image Too Large");
                    setValidationErrors([
                        `The selected banner image is ${sizeInMb} MB, which exceeds the 2 MB limit.`,
                        "Please choose a smaller image or crop it before uploading.",
                    ]);
                    setErrorModalVisible(true);
                    return;
                }

                const imageUri = asset.base64
                    ? `data:image/jpeg;base64,${asset.base64}`
                    : asset.uri;
                handleChange("template", imageUri);
            }
        } catch (error) {
            console.log("Error picking banner image:", error);
        }
    };

    // Helper display function to make sure UI handles both strings and local display formats
    const getDeadlineDisplayString = () => {
        if (!jobData.deadline) return "Select application deadline";
        return new Date(jobData.deadline).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const hasBannerError = validationErrors.some(
        (err) => err.toLowerCase().includes("banner") || err.toLowerCase().includes("image")
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
            {/* Top Navigation Bar with Back Button */}
            <View style={styles.navBar}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                    activeOpacity={0.7}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <View style={styles.navTitleWrap}>
                    <Text style={styles.navTitle}>Post a Job</Text>
                    <Text style={styles.navSubtitle}>Publish a new opening for talent</Text>
                </View>
                <View style={{ width: 42 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
            >
                <ScrollView
                    style={styles.outerContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.card}>
                        <Text style={styles.heading}>Post a Job</Text>
                        <Text style={styles.subheading}>Create an opening and reach top candidates</Text>
                        <View style={styles.divider} />

                        {/* Job Title */}
                        <Text style={styles.label}>Job Title *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Senior React Native Developer"
                            placeholderTextColor="#94A3B8"
                            keyboardType="default"
                            autoCapitalize="words"
                            autoCorrect={false}
                            value={jobData.title}
                            onChangeText={(text) => handleChange("title", text)}
                        />
                        <Text style={styles.fieldHelper}>Text string only • e.g. Backend Engineer (min 3 chars)</Text>

                        {/* Template / Graphic Upload Section */}
                        <Text style={styles.label}>Job Branding Template (Optional)</Text>
                        {jobData.template ? (
                            <View style={styles.imagePreviewContainer}>
                                <Image
                                    source={{ uri: jobData.template }}
                                    style={styles.previewImage}
                                    resizeMode="cover"
                                />
                                <Pressable
                                    style={styles.removeImageBadge}
                                    onPress={() => handleChange("template", "")}
                                >
                                    <Ionicons name="close-circle" size={26} color="#EF4444" />
                                </Pressable>
                            </View>
                        ) : null}

                        <Pressable
                            style={({ pressed }) => [
                                styles.secondaryButton,
                                pressed && styles.secondaryButtonPressed,
                            ]}
                            onPress={ImagePick}
                        >
                            <Ionicons
                                name="image-outline"
                                size={18}
                                color="#2563EB"
                                style={styles.buttonIcon}
                            />
                            <Text style={styles.secondaryButtonText}>
                                {jobData.template ? "Change Banner Template" : "Upload Banner Image"}
                            </Text>
                        </Pressable>
                        <Text style={styles.fieldHelper}>Optional promotional banner image (PNG or JPG)</Text>

                        {/* Company Information Section */}
                        <View style={styles.companyCard}>
                            <View style={styles.companyCardHeader}>
                                <View style={styles.companyIconBox}>
                                    <Ionicons name="business" size={18} color="#2563EB" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={styles.companyCardTitle}>Company Information</Text>
                                    <Text style={styles.companyCardSubtitle}>
                                        Displayed on the job card & details page for job seekers
                                    </Text>
                                </View>
                            </View>

                            {/* Company Name */}
                            <Text style={styles.label}>Company / Organization Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Google, Tata Consultancy Services, Startup Inc."
                                placeholderTextColor="#94A3B8"
                                keyboardType="default"
                                autoCapitalize="words"
                                value={jobData.companyName}
                                onChangeText={(text) => handleChange("companyName", text)}
                            />
                            <Text style={styles.fieldHelper}>Official hiring organization name (min 2 chars)</Text>

                            {/* Company Website */}
                            <Text style={styles.label}>Company Website (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. https://www.company.com"
                                placeholderTextColor="#94A3B8"
                                keyboardType="url"
                                autoCapitalize="none"
                                value={jobData.companyWebsite}
                                onChangeText={(text) => handleChange("companyWebsite", text)}
                            />
                            <Text style={styles.fieldHelper}>Website URL or career portal link</Text>

                            {/* Industry & Size Grid */}
                            <View style={styles.inputGridRow}>
                                <View style={styles.flexItem}>
                                    <Text style={styles.label}>Industry (Optional)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. IT & Software"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="default"
                                        autoCapitalize="words"
                                        value={jobData.companyIndustry}
                                        onChangeText={(text) => handleChange("companyIndustry", text)}
                                    />
                                </View>
                                <View style={styles.flexItem}>
                                    <Text style={styles.label}>Company Size (Optional)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. 51-200 emp"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="default"
                                        value={jobData.companySize}
                                        onChangeText={(text) => handleChange("companySize", text)}
                                    />
                                </View>
                            </View>

                            {/* About Company */}
                            <Text style={styles.label}>About the Company (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.multilineInput]}
                                placeholder="Brief overview of the organization, team, products, or culture..."
                                placeholderTextColor="#94A3B8"
                                keyboardType="default"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                value={jobData.companyAbout}
                                onChangeText={(text) => handleChange("companyAbout", text)}
                            />
                            <Text style={styles.fieldHelper}>Helps candidates understand what your company does</Text>
                        </View>

                        {/* Job Summary */}
                        <Text style={styles.label}>Job Summary *</Text>
                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            placeholder="Describe roles, core responsibilities, stack criteria..."
                            placeholderTextColor="#94A3B8"
                            keyboardType="default"
                            value={jobData.jobSummary}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            onChangeText={(text) => handleChange("jobSummary", text)}
                        />
                        <Text style={styles.fieldHelper}>Detailed overview of role requirements (min 10 chars)</Text>

                        {/* Core Metrics Row */}
                        <View style={styles.inputGridRow}>
                            <View style={styles.flexItem}>
                                <Text style={styles.label}>Vacancy Count *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 3"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="number-pad"
                                    value={jobData.vacancy}
                                    onChangeText={(text) => handleChange("vacancy", text)}
                                />
                                <Text style={styles.fieldHelper}>Numbers only (e.g. 1, 3)</Text>
                            </View>
                            <View style={styles.flexItem}>
                                <Text style={styles.label}>Salary Budget (₹) *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 600000"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="number-pad"
                                    value={jobData.salary}
                                    onChangeText={(text) => handleChange("salary", text)}
                                />
                                <Text style={styles.fieldHelper}>Amount in ₹ (numbers only)</Text>
                            </View>
                        </View>

                        {/* Additional Metadata Fields */}
                        <Text style={styles.label}>Job Location *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Pune, Maharashtra (Hybrid)"
                            placeholderTextColor="#94A3B8"
                            keyboardType="default"
                            autoCapitalize="words"
                            value={jobData.jobLocation}
                            onChangeText={(text) => handleChange("jobLocation", text)}
                        />
                        <Text style={styles.fieldHelper}>City / State / Remote</Text>

                        <Text style={styles.label}>Job Type (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Full-Time, Contract, Internship"
                            placeholderTextColor="#94A3B8"
                            keyboardType="default"
                            autoCapitalize="words"
                            value={jobData.jobType}
                            onChangeText={(text) => handleChange("jobType", text)}
                        />
                        <Text style={styles.fieldHelper}>Employment commitment (e.g. Full-Time)</Text>

                        <Text style={styles.label}>Experience Required (in Years) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 2 (or 0 for Fresher)"
                            placeholderTextColor="#94A3B8"
                            keyboardType="number-pad"
                            value={jobData.experience}
                            onChangeText={(text) => handleChange("experience", text)}
                        />
                        <Text style={styles.fieldHelper}>Years of experience • e.g. 0 for Fresher, 2, 5</Text>

                        <Text style={styles.label}>Application Deadline *</Text>
                        <Pressable
                            style={({ pressed }) => [
                                styles.dateSelectorBox,
                                pressed && styles.dateSelectorBoxPressed,
                            ]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons
                                name="calendar-outline"
                                size={18}
                                color="#64748B"
                                style={styles.buttonIcon}
                            />
                            <Text
                                style={[
                                    styles.dateText,
                                    !jobData.deadline && styles.datePlaceholderText,
                                ]}
                            >
                                {getDeadlineDisplayString()}
                            </Text>
                        </Pressable>
                        <Text style={styles.fieldHelper}>Tap to select last date to apply</Text>

                        {showDatePicker && (
                            <DateTimePicker
                                value={jobData.deadline ? new Date(jobData.deadline) : new Date()}
                                mode="date"
                                display="default"
                                minimumDate={new Date()}
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(false);
                                    if (selectedDate) {
                                        handleChange("deadline", selectedDate.toISOString());
                                    }
                                }}
                            />
                        )}

                        <Pressable
                            style={({ pressed }) => [
                                styles.submitButton,
                                loading && styles.submitButtonDisabled,
                                pressed && !loading && styles.submitButtonPressed,
                            ]}
                            onPress={handleJobPost}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Publish Job Post</Text>
                            )}
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Validation & Error Modal */}
            <Modal
                visible={errorModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setErrorModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        {/* Icon Badge */}
                        <View style={styles.modalIconContainer}>
                            <Ionicons name="alert-circle-outline" size={38} color="#EF4444" />
                        </View>

                        {/* Title */}
                        <Text style={styles.modalTitle}>{errorModalTitle}</Text>
                        <Text style={styles.modalSubtitle}>
                            Please review the issue{validationErrors.length > 1 ? "s" : ""} below to correct:
                        </Text>

                        {/* Error List */}
                        <View style={styles.errorListContainer}>
                            {validationErrors.map((err, index) => (
                                <View key={index} style={styles.errorItemRow}>
                                    <Ionicons name="close-circle" size={18} color="#EF4444" style={styles.errorIcon} />
                                    <Text style={styles.errorItemText}>{err}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Quick action: Remove Banner if banner error */}
                        {hasBannerError && jobData.template ? (
                            <TouchableOpacity
                                style={styles.modalActionRemoveBanner}
                                onPress={() => {
                                    handleChange("template", "");
                                    setErrorModalVisible(false);
                                    Toast.show({
                                        type: "info",
                                        text1: "Banner Removed",
                                        text2: "You can now submit or choose a smaller banner image.",
                                    });
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                                <Text style={styles.modalActionRemoveBannerText}>Remove Banner Image</Text>
                            </TouchableOpacity>
                        ) : null}

                        {/* Dismiss Button */}
                        <TouchableOpacity
                            style={styles.modalPrimaryBtn}
                            onPress={() => setErrorModalVisible(false)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.modalPrimaryBtnText}>I'll Fix It</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default PostJob;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    navBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
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
    navTitleWrap: {
        alignItems: "center",
    },
    navTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
    },
    navSubtitle: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 2,
    },
    outerContainer: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 220,
    },
    fieldHelper: {
        fontSize: 11,
        color: "#94A3B8",
        marginTop: 4,
        marginBottom: 10,
        fontWeight: "500",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },
    heading: {
        fontSize: 24,
        fontWeight: "900",
        color: "#1E293B",
        textAlign: "center",
    },
    subheading: {
        fontSize: 13,
        color: "#64748B",
        textAlign: "center",
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: "#E2E8F0",
        marginVertical: 18,
    },
    label: {
        fontSize: 13,
        fontWeight: "700",
        color: "#1E293B",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginTop: 16,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: "#1E293B",
        backgroundColor: "#FFF",
        fontWeight: "500",
    },
    multilineInput: {
        height: 100,
    },
    inputGridRow: {
        flexDirection: "row",
        gap: 12,
    },
    flexItem: {
        flex: 1,
    },
    imagePreviewContainer: {
        position: "relative",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    previewImage: {
        width: "100%",
        height: 140,
        backgroundColor: "#F1F5F9",
    },
    removeImageBadge: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "#FFF",
        borderRadius: 14,
    },
    secondaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "#2563EB",
        borderStyle: "dashed",
        borderRadius: 10,
        paddingVertical: 12,
        backgroundColor: "#EFF6FF",
        marginVertical: 4,
    },
    secondaryButtonPressed: {
        backgroundColor: "#DBEAFE",
        opacity: 0.9,
    },
    secondaryButtonText: {
        color: "#2563EB",
        fontSize: 14,
        fontWeight: "700",
    },
    buttonIcon: {
        marginRight: 6,
    },
    dateSelectorBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: "#FFF",
    },
    dateSelectorBoxPressed: {
        backgroundColor: "#F8FAFC",
    },
    dateText: {
        fontSize: 15,
        color: "#1E293B",
        fontWeight: "500",
    },
    datePlaceholderText: {
        color: "#94A3B8",
    },
    submitButton: {
        backgroundColor: "#2563EB",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 32,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: "#93C5FD",
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonPressed: {
        backgroundColor: "#1D4ED8",
        transform: [{ scale: 0.99 }],
    },
    submitButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.3,
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
        maxWidth: 360,
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
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: "#FEE2E2",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#FECACA",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1E293B",
        textAlign: "center",
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 13,
        color: "#64748B",
        textAlign: "center",
        marginBottom: 16,
    },
    errorListContainer: {
        width: "100%",
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        gap: 8,
    },
    errorItemRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
    },
    errorIcon: {
        marginTop: 2,
    },
    errorItemText: {
        flex: 1,
        fontSize: 13,
        color: "#334155",
        lineHeight: 18,
        fontWeight: "500",
    },
    modalActionRemoveBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FEE2E2",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginBottom: 12,
        width: "100%",
    },
    modalActionRemoveBannerText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#EF4444",
    },
    modalPrimaryBtn: {
        width: "100%",
        backgroundColor: "#2563EB",
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
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

    // Company Information Card
    companyCard: {
        backgroundColor: "#F8FAFC",
        borderWidth: 1.5,
        borderColor: "#BFDBFE",
        borderRadius: 14,
        padding: 16,
        marginVertical: 14,
    },
    companyCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    companyIconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: "#EFF6FF",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#DBEAFE",
    },
    companyCardTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1E293B",
    },
    companyCardSubtitle: {
        fontSize: 11,
        color: "#64748B",
        marginTop: 1,
    },
});
