import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import { applyJob } from "../redux/appliedJobs";
import { getJobsByJobId, toggleSaveJob } from "../redux/jobPostSlice";
import { sendNotification } from "../redux/notificationSlice";

const JobInformation = () => {
    const { jobId } = useLocalSearchParams();
    const router = useRouter();
    const dispatch = useDispatch();

    const user = useSelector((state) => state.auth?.user);
    const job = useSelector((state) => state.job?.jobByJobId);
    const loading = useSelector((state) => state.job?.jobLoading);
    const savedJobs = useSelector((state) => state.job?.savedJobs || []);
    const isJobSaved = savedJobs.includes(jobId);

    const [applying, setApplying] = useState(false);
    const [profileWarningVisible, setProfileWarningVisible] = useState(false);
    const [missingFields, setMissingFields] = useState([]);

    useEffect(() => {
        if (jobId) {
            dispatch(getJobsByJobId(jobId));
        }
    }, [dispatch, jobId]);

    const isGoogleDriveUrl = (url) => {
        if (!url || typeof url !== "string") return false;
        const trimmed = url.trim();
        return /^(https?:\/\/)?(drive\.google\.com|docs\.google\.com)\/.+$/i.test(trimmed);
    };

    const getCandidateMissingFields = (currentUser) => {
        const missing = [];
        if (!currentUser) return missing;

        // 1. Resume Document / File
        const hasResume = Boolean(
            currentUser.resume &&
            typeof currentUser.resume === "string" &&
            currentUser.resume.trim().length > 0
        );
        if (!hasResume) {
            missing.push({
                field: "Resume Document",
                description: "Upload your resume (PDF/DOC) or attach a link so recruiters can evaluate your background.",
                icon: "document-text-outline",
            });
        }

        // 2. Phone Number
        if (!currentUser.phone || (typeof currentUser.phone === "string" && !currentUser.phone.trim())) {
            missing.push({
                field: "Phone Number",
                description: "Add a valid contact number for interview callbacks and updates.",
                icon: "call-outline",
            });
        }

        // 3. Technical Skills
        const hasSkills = Array.isArray(currentUser.skills) && currentUser.skills.some((s) => typeof s === "string" && s.trim().length > 0);
        if (!hasSkills) {
            missing.push({
                field: "Key Skills",
                description: "List your key skills and competencies (e.g., React, Java, Design).",
                icon: "sparkles-outline",
            });
        }

        // 4. Education
        const firstEdu = currentUser.education?.[0];
        const hasEducation = firstEdu && ((firstEdu.degree && firstEdu.degree.trim()) || (firstEdu.college && firstEdu.college.trim()));
        if (!hasEducation) {
            missing.push({
                field: "Education Details",
                description: "Enter your degree, college, and graduation year.",
                icon: "school-outline",
            });
        }

        return missing;
    };

    const handleApply = () => {
        if (!user || !user._id) {
            Toast.show({
                type: "error",
                text1: "Login Required",
                text2: "Please log in to apply for this job.",
            });
            return;
        }

        if (user.role === "recruiter") {
            Toast.show({
                type: "error",
                text1: "Recruiter Account",
                text2: "Recruiter accounts cannot apply for job openings.",
            });
            return;
        }

        // Check for missing candidate information and give warning
        const missing = getCandidateMissingFields(user);
        if (missing.length > 0) {
            setMissingFields(missing);
            setProfileWarningVisible(true);
            return;
        }

        executeApply();
    };

    const executeApply = async () => {
        setApplying(true);
        try {
            await dispatch(applyJob(jobId)).unwrap();
            Toast.show({
                type: "success",
                text1: "Application Submitted 🎉",
                text2: `You have successfully applied for ${job?.title || "this job"}.`,
            });

            dispatch(
                sendNotification({
                    userId: user._id,
                    title: "Applied For Job 🎉",
                    body: `You have successfully applied for ${job?.title || "a job"}.`,
                    data: {
                        type: "JOB",
                        userId: user._id,
                    },
                })
            );
        } catch (err) {
            console.log("Error applying for job:", err);
            const errorMsg = typeof err === "string" ? err : (err?.message || "Could not submit application. Please try again.");
            Toast.show({
                type: "error",
                text1: "Application Failed",
                text2: errorMsg,
            });
        } finally {
            setApplying(false);
        }
    };

    const handleToggleSave = () => {
        if (!jobId) return;
        dispatch(toggleSaveJob(jobId));
        Toast.show({
            type: "success",
            text1: isJobSaved ? "Removed from Bookmarks" : "Saved to Bookmarks 🎉",
            text2: isJobSaved ? "Job removed from your saved list" : "Job added to your saved list",
        });
    };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)/home");
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this job opening on JobPortal: ${job?.title || "Job Opening"} in ${job?.jobLocation || "India"}. Salary: ₹${job?.salary || "Competitive"}.`,
            });
        } catch (error) {
            console.log("Share error:", error);
        }
    };

    if (loading && !job) {
        return (
            <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
                <View style={styles.navBar}>
                    <TouchableOpacity
                        style={styles.navIconBtn}
                        onPress={handleBack}
                        activeOpacity={0.7}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        accessibilityLabel="Go back"
                    >
                        <Ionicons name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.navTitle} numberOfLines={1}>
                        Job Details
                    </Text>
                    <View style={{ width: 44 }} />
                </View>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Loading job information...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!job && !loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
                <View style={styles.navBar}>
                    <TouchableOpacity
                        style={styles.navIconBtn}
                        onPress={handleBack}
                        activeOpacity={0.7}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        accessibilityLabel="Go back"
                    >
                        <Ionicons name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.navTitle} numberOfLines={1}>
                        Job Details
                    </Text>
                    <View style={{ width: 44 }} />
                </View>
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={56} color="#94A3B8" />
                    <Text style={styles.notFoundTitle}>Job Not Found</Text>
                    <Text style={styles.notFoundSubtitle}>This job post may have expired or been removed.</Text>
                    <TouchableOpacity
                        style={styles.backHomeBtn}
                        onPress={handleBack}
                    >
                        <Text style={styles.backHomeBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const formattedSalary =
        job?.salary != null && job?.salary !== ""
            ? typeof job.salary === "number"
                ? `₹ ${job.salary.toLocaleString("en-IN")}`
                : `₹ ${job.salary}`
            : "Competitive";

    const formattedExperience =
        job?.experience !== undefined && job?.experience !== null && job?.experience !== ""
            ? Number(job.experience) === 0
                ? "Fresher"
                : `${job.experience} Yrs Exp`
            : "Not Specified";

    const formattedDeadline = job?.deadline
        ? new Date(job.deadline).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
          })
        : "Open Until Filled";

    const formattedDate = job?.createdAt
        ? new Date(job.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
          })
        : null;

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
            {/* Header Navigation Bar */}
            <View style={styles.navBar}>
                <TouchableOpacity
                    style={styles.navIconBtn}
                    onPress={handleBack}
                    activeOpacity={0.7}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.navTitle} numberOfLines={1}>
                    Job Details
                </Text>
                <TouchableOpacity
                    style={styles.navIconBtn}
                    onPress={handleShare}
                    activeOpacity={0.7}
                    accessibilityLabel="Share Job"
                >
                    <Ionicons name="share-social-outline" size={20} color="#0F172A" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Banner Image */}
                {job?.template ? (
                    <View style={styles.bannerWrapper}>
                        <Image
                            source={{ uri: job.template }}
                            style={styles.jobBanner}
                            resizeMode="cover"
                        />
                    </View>
                ) : null}

                {/* Main Job Header Card */}
                <View style={styles.headerCard}>
                    <View style={styles.companyBadgeRow}>
                        <View style={styles.companyIconBox}>
                            <Ionicons name="briefcase" size={22} color="#2563EB" />
                        </View>
                        <View style={styles.companyTextWrap}>
                            <Text style={styles.companyName}>
                                {job?.companyName || job?.createBy?.companyName || job?.createBy?.name || "Verified Hiring Partner"}
                            </Text>
                            {formattedDate && (
                                <Text style={styles.postedOnText}>Posted on {formattedDate}</Text>
                            )}
                        </View>
                    </View>

                    <Text style={styles.jobTitle}>{job?.title}</Text>

                    {/* Chips Row: Location, Job Type */}
                    <View style={styles.chipsRow}>
                        {Boolean(job?.jobLocation || job?.location) && (
                            <View style={styles.badgePill}>
                                <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                                <Text style={styles.badgePillText}>{job?.jobLocation || job?.location}</Text>
                            </View>
                        )}
                        <View style={[styles.badgePill, styles.jobTypePill]}>
                            <Ionicons name="time-outline" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                            <Text style={[styles.badgePillText, styles.jobTypePillText]}>
                                {job?.jobType || "Full-Time"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Key Metrics 4-Box Grid */}
                <View style={styles.metricsGrid}>
                    {/* Salary Box */}
                    <View style={[styles.metricCard, styles.salaryBox]}>
                        <View style={[styles.metricIconWrap, { backgroundColor: "#DCFCE7" }]}>
                            <Ionicons name="cash-outline" size={18} color="#16A34A" />
                        </View>
                        <Text style={styles.metricLabel}>OFFERED SALARY</Text>
                        <Text style={[styles.metricValue, { color: "#16A34A" }]} numberOfLines={1}>
                            {formattedSalary}
                        </Text>
                    </View>

                    {/* Experience Box */}
                    <View style={[styles.metricCard, styles.experienceBox]}>
                        <View style={[styles.metricIconWrap, { backgroundColor: "#FEF3C7" }]}>
                            <Ionicons name="ribbon-outline" size={18} color="#D97706" />
                        </View>
                        <Text style={styles.metricLabel}>EXPERIENCE</Text>
                        <Text style={[styles.metricValue, { color: "#D97706" }]} numberOfLines={1}>
                            {formattedExperience}
                        </Text>
                    </View>

                    {/* Vacancy Box */}
                    <View style={[styles.metricCard, styles.vacancyBox]}>
                        <View style={[styles.metricIconWrap, { backgroundColor: "#EFF6FF" }]}>
                            <Ionicons name="people-outline" size={18} color="#2563EB" />
                        </View>
                        <Text style={styles.metricLabel}>OPENINGS</Text>
                        <Text style={[styles.metricValue, { color: "#2563EB" }]} numberOfLines={1}>
                            {job?.vacancy ? `${job.vacancy} ${job.vacancy === 1 ? "Opening" : "Openings"}` : "1 Opening"}
                        </Text>
                    </View>

                    {/* Deadline Box */}
                    <View style={[styles.metricCard, styles.deadlineBox]}>
                        <View style={[styles.metricIconWrap, { backgroundColor: "#FFE4E6" }]}>
                            <Ionicons name="calendar-outline" size={18} color="#E11D48" />
                        </View>
                        <Text style={styles.metricLabel}>APPLY BEFORE</Text>
                        <Text style={[styles.metricValue, { color: "#E11D48" }]} numberOfLines={1}>
                            {formattedDeadline}
                        </Text>
                    </View>
                </View>

                {/* Job Summary / Description Card */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="document-text-outline" size={20} color="#2563EB" style={{ marginRight: 8 }} />
                        <Text style={styles.sectionTitle}>About the Role & Summary</Text>
                    </View>
                    <Text style={styles.summaryBody}>
                        {job?.jobSummary || "No description provided for this opening."}
                    </Text>
                </View>

                {/* Additional Role Details Card */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="information-circle-outline" size={20} color="#2563EB" style={{ marginRight: 8 }} />
                        <Text style={styles.sectionTitle}>Overview & Requirements</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Job Location</Text>
                        <Text style={styles.detailValue}>{job?.jobLocation || job?.location || "Not Specified"}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Employment Type</Text>
                        <Text style={styles.detailValue}>{job?.jobType || "Full-Time"}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Min Experience</Text>
                        <Text style={styles.detailValue}>{formattedExperience}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Vacancies</Text>
                        <Text style={styles.detailValue}>{job?.vacancy || 1} Position(s)</Text>
                    </View>
                    <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                        <Text style={styles.detailLabel}>Application Deadline</Text>
                        <Text style={[styles.detailValue, { color: "#E11D48", fontWeight: "700" }]}>
                            {formattedDeadline}
                        </Text>
                    </View>
                </View>

                {/* About the Hiring Company Card */}
                {(job?.companyName || job?.createBy?.companyName || job?.companyAbout || job?.createBy?.companyAbout) && (
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="business-outline" size={20} color="#2563EB" style={{ marginRight: 8 }} />
                            <Text style={styles.sectionTitle}>About the Company</Text>
                        </View>

                        <View style={styles.companyOverviewBox}>
                            <View style={styles.companyOverviewHeader}>
                                <View style={styles.companyLogoBadge}>
                                    <Ionicons name="business" size={22} color="#2563EB" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.companyOverviewName}>
                                        {job?.companyName || job?.createBy?.companyName || "Hiring Partner"}
                                    </Text>
                                    {Boolean(job?.companyIndustry || job?.createBy?.companyIndustry) && (
                                        <Text style={styles.companyOverviewIndustry}>
                                            {job?.companyIndustry || job?.createBy?.companyIndustry}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {Boolean(job?.companyAbout || job?.createBy?.companyAbout) && (
                                <Text style={styles.companyAboutText}>
                                    {job?.companyAbout || job?.createBy?.companyAbout}
                                </Text>
                            )}

                            {/* Company Meta Pills */}
                            <View style={styles.companyMetaPillsRow}>
                                {Boolean(job?.companySize || job?.createBy?.companySize) && (
                                    <View style={styles.companyMetaPill}>
                                        <Ionicons name="people-outline" size={13} color="#475569" style={{ marginRight: 4 }} />
                                        <Text style={styles.companyMetaPillText}>
                                            {job?.companySize || job?.createBy?.companySize} emp
                                        </Text>
                                    </View>
                                )}
                                {Boolean(job?.jobLocation || job?.companyLocation || job?.createBy?.companyLocation) && (
                                    <View style={styles.companyMetaPill}>
                                        <Ionicons name="location-outline" size={13} color="#475569" style={{ marginRight: 4 }} />
                                        <Text style={styles.companyMetaPillText}>
                                            {job?.jobLocation || job?.companyLocation || job?.createBy?.companyLocation}
                                        </Text>
                                    </View>
                                )}
                                {Boolean(job?.createBy?.name) && (
                                    <View style={styles.companyMetaPill}>
                                        <Ionicons name="person-outline" size={13} color="#475569" style={{ marginRight: 4 }} />
                                        <Text style={styles.companyMetaPillText}>
                                            Posted by {job.createBy.name}
                                            {job.createBy.designation ? ` (${job.createBy.designation})` : ""}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Website Link Button */}
                            {Boolean(job?.companyWebsite || job?.createBy?.companyWebsite) && (
                                <TouchableOpacity
                                    style={styles.websiteBtn}
                                    onPress={() => {
                                        const url = job?.companyWebsite || job?.createBy?.companyWebsite;
                                        if (url) {
                                            Linking.openURL(url.startsWith("http") ? url : `https://${url}`);
                                        }
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="globe-outline" size={15} color="#2563EB" style={{ marginRight: 6 }} />
                                    <Text style={styles.websiteBtnText}>Visit Company Website</Text>
                                    <Ionicons name="open-outline" size={14} color="#2563EB" style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Safety & Advisory Notice */}
                <View style={styles.noticeCard}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#16A34A" style={{ marginRight: 8 }} />
                    <Text style={styles.noticeText}>
                        JobPortal verified listing. Never share financial details or pay fees for job offers.
                    </Text>
                </View>

                {/* Bottom space so content scrolls past sticky bar */}
                <View style={{ height: 90 }} />
            </ScrollView>

            {/* Bottom Fixed Action Bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.bookmarkButton, isJobSaved && styles.bookmarkButtonActive]}
                    onPress={handleToggleSave}
                    activeOpacity={0.7}
                    accessibilityLabel={isJobSaved ? "Remove from bookmarks" : "Bookmark Job"}
                >
                    <Ionicons
                        name={isJobSaved ? "bookmark" : "bookmark-outline"}
                        size={22}
                        color={isJobSaved ? "#2563EB" : "#64748B"}
                    />
                </TouchableOpacity>

                <Pressable
                    style={({ pressed }) => [
                        styles.applyButton,
                        applying && styles.applyButtonDisabled,
                        pressed && !applying && styles.applyButtonPressed,
                    ]}
                    onPress={handleApply}
                    disabled={applying}
                >
                    {applying ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <View style={styles.applyBtnContent}>
                            <Ionicons name="paper-plane" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text style={styles.applyButtonText}>Apply For Position</Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* Incomplete Candidate Profile Warning Modal */}
            <Modal
                visible={profileWarningVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setProfileWarningVisible(false)}
            >
                <View style={styles.warningModalOverlay}>
                    <View style={styles.warningModalContent}>
                        {/* Modal Header */}
                        <View style={styles.warningModalHeader}>
                            <View style={styles.warningIconCircle}>
                                <Ionicons name="warning-outline" size={32} color="#D97706" />
                            </View>
                            <Text style={styles.warningModalTitle}>Complete Candidate Profile</Text>
                            <Text style={styles.warningModalSubtitle}>
                                Recruiters require your candidate details to review your application. Please fill in the following information:
                            </Text>
                        </View>

                        {/* List of Missing Fields */}
                        <ScrollView style={styles.missingFieldsScrollView} showsVerticalScrollIndicator={false}>
                            {missingFields.map((item, index) => (
                                <View key={index} style={styles.missingFieldCard}>
                                    <View style={styles.missingFieldIconBox}>
                                        <Ionicons name={item.icon} size={18} color="#D97706" />
                                    </View>
                                    <View style={styles.missingFieldTextBox}>
                                        <Text style={styles.missingFieldName}>{item.field}</Text>
                                        <Text style={styles.missingFieldDesc}>{item.description}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Action Buttons */}
                        <View style={styles.warningModalActions}>
                            <TouchableOpacity
                                style={styles.completeProfileBtn}
                                onPress={() => {
                                    setProfileWarningVisible(false);
                                    router.push("/src/profile");
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="person-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                <Text style={styles.completeProfileBtnText}>Fill Candidate Info Now</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.applyAnywayBtn}
                                onPress={() => {
                                    setProfileWarningVisible(false);
                                    executeApply();
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.applyAnywayBtnText}>Continue & Apply Anyway</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelWarningBtn}
                                onPress={() => setProfileWarningVisible(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelWarningBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default JobInformation;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#F8FAFC",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#64748B",
    },
    notFoundTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0F172A",
        marginTop: 14,
    },
    notFoundSubtitle: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
        marginTop: 6,
        marginBottom: 20,
    },
    backHomeBtn: {
        backgroundColor: "#2563EB",
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 10,
    },
    backHomeBtnText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 14,
    },

    // Nav Bar
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
    navIconBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#F1F5F9",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        justifyContent: "center",
        alignItems: "center",
    },
    navTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#0F172A",
        flex: 1,
        textAlign: "center",
        marginHorizontal: 12,
    },

    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 14,
    },

    // Hero Banner
    bannerWrapper: {
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#E2E8F0",
    },
    jobBanner: {
        width: "100%",
        height: 190,
    },

    // Main Header Card
    headerCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    companyBadgeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    companyIconBox: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: "#EFF6FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    companyTextWrap: {
        flex: 1,
    },
    companyName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1E293B",
    },
    postedOnText: {
        fontSize: 11,
        color: "#94A3B8",
        marginTop: 2,
    },
    jobTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#0F172A",
        lineHeight: 28,
        marginBottom: 12,
    },
    chipsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    badgePill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F1F5F9",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    badgePillText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#475569",
    },
    jobTypePill: {
        backgroundColor: "#EFF6FF",
        borderColor: "#BFDBFE",
    },
    jobTypePillText: {
        color: "#2563EB",
    },

    // Metrics 4-Box Grid
    metricsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 14,
    },
    metricCard: {
        width: "48.5%",
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    salaryBox: {},
    experienceBox: {},
    vacancyBox: {},
    deadlineBox: {},
    metricIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    metricLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "#64748B",
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    metricValue: {
        fontSize: 14,
        fontWeight: "800",
    },

    // Section Cards
    sectionCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0F172A",
    },
    summaryBody: {
        fontSize: 14,
        color: "#334155",
        lineHeight: 22,
    },

    // Overview Table Rows
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    detailLabel: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: "500",
    },
    detailValue: {
        fontSize: 13,
        color: "#0F172A",
        fontWeight: "600",
        maxWidth: "60%",
        textAlign: "right",
    },

    // Safety Notice
    noticeCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
    },
    noticeText: {
        flex: 1,
        fontSize: 11,
        color: "#166534",
        lineHeight: 16,
    },

    // Bottom Sticky Bar
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 10,
    },
    bookmarkButton: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: "#F1F5F9",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        justifyContent: "center",
        alignItems: "center",
    },
    bookmarkButtonActive: {
        backgroundColor: "#EFF6FF",
        borderColor: "#BFDBFE",
    },
    applyButton: {
        flex: 1,
        height: 50,
        backgroundColor: "#2563EB",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },
    applyButtonPressed: {
        backgroundColor: "#1D4ED8",
        opacity: 0.9,
    },
    applyButtonDisabled: {
        opacity: 0.7,
    },
    applyBtnContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    applyButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },

    // About the Company Styles
    companyOverviewBox: {
        backgroundColor: "#F8FAFC",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    companyOverviewHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    companyLogoBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#EFF6FF",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#DBEAFE",
    },
    companyOverviewName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
    },
    companyOverviewIndustry: {
        fontSize: 12,
        color: "#2563EB",
        fontWeight: "600",
        marginTop: 2,
    },
    companyAboutText: {
        fontSize: 14,
        color: "#475569",
        lineHeight: 20,
        marginBottom: 12,
    },
    companyMetaPillsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 12,
    },
    companyMetaPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    companyMetaPillText: {
        fontSize: 11,
        color: "#475569",
        fontWeight: "500",
    },
    websiteBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EFF6FF",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    websiteBtnText: {
        fontSize: 13,
        color: "#2563EB",
        fontWeight: "600",
    },

    // Incomplete Profile Warning Modal Styles
    warningModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    warningModalContent: {
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 22,
        width: "100%",
        maxWidth: 420,
        maxHeight: "84%",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
    },
    warningModalHeader: {
        alignItems: "center",
        marginBottom: 14,
    },
    warningIconCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: "#FEF3C7",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
        borderWidth: 2,
        borderColor: "#FDE68A",
    },
    warningModalTitle: {
        fontSize: 19,
        fontWeight: "800",
        color: "#0F172A",
        textAlign: "center",
        marginBottom: 6,
    },
    warningModalSubtitle: {
        fontSize: 13,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 18,
        paddingHorizontal: 8,
    },
    missingFieldsScrollView: {
        maxHeight: 220,
        marginVertical: 10,
    },
    missingFieldCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#FFFBEB",
        borderWidth: 1,
        borderColor: "#FDE68A",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    missingFieldIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: "#FEF3C7",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        marginTop: 2,
    },
    missingFieldTextBox: {
        flex: 1,
    },
    missingFieldName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#92400E",
        marginBottom: 2,
    },
    missingFieldDesc: {
        fontSize: 12,
        color: "#B45309",
        lineHeight: 16,
    },
    warningModalActions: {
        marginTop: 12,
        gap: 8,
    },
    completeProfileBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2563EB",
        paddingVertical: 13,
        borderRadius: 12,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    completeProfileBtnText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
    applyAnywayBtn: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        paddingVertical: 11,
        borderRadius: 12,
    },
    applyAnywayBtnText: {
        color: "#475569",
        fontSize: 13,
        fontWeight: "600",
    },
    cancelWarningBtn: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
    },
    cancelWarningBtnText: {
        color: "#94A3B8",
        fontSize: 13,
        fontWeight: "600",
    },
});
