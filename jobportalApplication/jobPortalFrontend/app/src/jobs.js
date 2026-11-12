import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import { applyJob } from "../redux/appliedJobs";
import { addSavedJobs, getJobPost, toggleSaveJob } from "../redux/jobPostSlice";
import { sendNotification } from "../redux/notificationSlice";

const Jobs = () => {
    const user = useSelector((state) => state.auth.user);
    const userId = user?._id;
    const router = useRouter();
    const [search, setSearch] = useState('');
    const dispatch = useDispatch();

    const [profileWarningVisible, setProfileWarningVisible] = useState(false);
    const [missingFields, setMissingFields] = useState([]);
    const [pendingJobId, setPendingJobId] = useState(null);

    const { job, jobLoading } = useSelector((state) => state.job);
    const savedJobs = useSelector((state) => state.job?.savedJobs || []);

    useEffect(() => {
        dispatch(getJobPost(''));
    }, []);

    const handleSearch = () => {
        dispatch(getJobPost(search));
    };

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

    const handleApply = (jobId) => {
        if (!user || !user._id) {
            Toast.show({
                type: 'error',
                text1: 'Please login to apply for the job'
            });
            return;
        }
        if (user.role === 'recruiter') {
            Toast.show({
                type: 'error',
                text1: 'You are recruiter so you can not apply for job'
            });
            return;
        }

        // Check for missing candidate details and warn before applying
        const missing = getCandidateMissingFields(user);
        if (missing.length > 0) {
            setPendingJobId(jobId);
            setMissingFields(missing);
            setProfileWarningVisible(true);
            return;
        }

        executeApply(jobId);
    };

    const executeApply = async (targetJobId) => {
        try {
            await dispatch(applyJob(targetJobId)).unwrap();
            Toast.show({
                type: 'success',
                text1: 'Applied successfully! 🎉',
                text2: 'Your application has been submitted to the recruiter.'
            });
            dispatch(sendNotification({
                userId,
                title: 'Applied For Job 🎉',
                body: 'You have successfully applied for this job.',
                data: {
                    type: 'JOB',
                    userId: user?._id
                }
            }));
        } catch (err) {
            console.log("Apply error:", err);
            const errorMsg = typeof err === 'string' ? err : (err?.message || 'Could not submit application.');
            Toast.show({
                type: 'error',
                text1: 'Application Failed',
                text2: errorMsg
            });
        }
    };

    const handleSave = (jobId) => {
        try {
            const isSaved = savedJobs.includes(jobId);
            dispatch(toggleSaveJob(jobId));
            Toast.show({
                type: 'success',
                text1: isSaved ? 'Job removed from bookmarks' : 'Job saved to bookmarks 🎉',
            });
        } catch (error) {
            console.log("error saving job:", error);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {item.template ? (
                <Image source={{ uri: item.template }} style={styles.image} resizeMode="cover" />
            ) : null}

            <View style={styles.cardContent}>
                <TouchableOpacity onPress={() => { router.push({ pathname: "/src/jobInformation", params: { jobId: item._id } }) }}>
                    {Boolean(item.companyName || item.createBy?.companyName) && (
                        <View style={styles.companyBadgeRow}>
                            <Ionicons name="business" size={13} color="#2563EB" style={{ marginRight: 4 }} />
                            <Text style={styles.companyBadgeText} numberOfLines={1}>
                                {item.companyName || item.createBy?.companyName}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.description} numberOfLines={3}>{item.jobSummary}</Text>
                </TouchableOpacity>

                <View style={styles.tagsContainer}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>Vacancy: {item.vacancy}</Text>
                    </View>
                    {item.experience !== undefined && item.experience !== null && item.experience !== "" && (
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>
                                {Number(item.experience) === 0 ? "Fresher" : `${item.experience} Yrs Exp`}
                            </Text>
                        </View>
                    )}
                    {item.salary != null && item.salary !== "" && (
                        <View style={[styles.tag, styles.salaryTag]}>
                            <Text style={styles.salaryTagText}>
                                ₹ {typeof item.salary === "number" ? item.salary.toLocaleString("en-IN") : item.salary}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Side-by-side action controls */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => handleApply(item._id)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.applyButtonText}>Apply Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.saved, savedJobs.includes(item._id) && styles.savedActive]}
                        onPress={() => handleSave(item._id)}
                        activeOpacity={0.7}
                        accessibilityLabel={savedJobs.includes(item._id) ? "Remove from bookmarks" : "Save job"}
                    >
                        <Ionicons
                            name={savedJobs.includes(item._id) ? "bookmark" : "bookmark-outline"}
                            size={22}
                            color={savedJobs.includes(item._id) ? "#2563EB" : "#64748B"}
                        />
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    );

    if (jobLoading && !job?.length) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                    <Text style={styles.loadingText}>Finding jobs for you...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const filteredJob = Array.isArray(job)
        ? [...job]
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .filter((item) => {
                const loc = item.jobLocation || item.location || "";
                return (
                    item.title?.toLowerCase()?.includes(search?.toLowerCase()) ||
                    item.jobSummary?.toLowerCase()?.includes(search?.toLowerCase()) ||
                    loc.toLowerCase()?.includes(search?.toLowerCase())
                );
            })
        : [];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <View>
                            <Text style={styles.headerTitle}>JobPortal</Text>
                            <Text style={styles.headerSubtitle}>Find your dream job</Text>
                        </View>




                        <TouchableOpacity
                            style={styles.profile}
                            onPress={() => router.push("/src/userinfo")}
                        >
                            {user?.profileImage ? (
                                <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
                            ) : (
                                <Ionicons name="person" size={18} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchRow}>
                        <View style={styles.searchInputContainer}>
                            <Ionicons name="search" size={16} color="#999" style={styles.searchIcon} />
                            <TextInput
                                placeholder="Search jobs..."
                                placeholderTextColor="#999"
                                style={styles.searchInput}
                                value={search}
                                onChangeText={setSearch}
                                onSubmitEditing={handleSearch}
                                returnKeyType="search"
                            />
                        </View>
                        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                            <Text style={styles.searchButtonText}>Search</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <FlatList
                    data={filteredJob}
                    keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        !jobLoading ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyTitle}>No Jobs Found</Text>
                                <Text style={styles.emptyText}>Try adjusting your search or filter criteria.</Text>
                            </View>
                        ) : null
                    }
                />

            </View>

            {/* Incomplete Candidate Profile Warning Modal */}
            <Modal
                visible={profileWarningVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    setProfileWarningVisible(false);
                    setPendingJobId(null);
                }}
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
                                    setPendingJobId(null);
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
                                    if (pendingJobId) {
                                        executeApply(pendingJobId);
                                        setPendingJobId(null);
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.applyAnywayBtnText}>Continue & Apply Anyway</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelWarningBtn}
                                onPress={() => {
                                    setProfileWarningVisible(false);
                                    setPendingJobId(null);
                                }}
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

export default Jobs;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    container: {
        flex: 1,
        paddingHorizontal: 8,
    },
    header: {
        marginTop: 12,
        marginBottom: 16,
    },
    headerTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: "#2563EB",
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 13,
        color: "#777",
        marginTop: 2,
    },
    profile: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#2563EB",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    profileImage: {
        width: "100%",
        height: "100%",
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 16,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 36,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 6,
    },
    searchInput: {
        flex: 1,
        height: 35,
        fontSize: 14,
        color: "#333",
        padding: 0,
    },
    searchButton: {
        backgroundColor: "#4A90E2",
        height: 36,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#4A90E2",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    searchButtonText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "700",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#666",
        fontWeight: "500",
    },
    listContainer: {
        paddingBottom: 24,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        marginBottom: 20,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
    },
    image: {
        width: "100%",
        height: 160,
        backgroundColor: "#E1E4E8",
    },
    cardContent: {
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A1A1A",
        marginBottom: 8,
        lineHeight: 28,
    },
    description: {
        fontSize: 15,
        color: "#666",
        lineHeight: 22,
        marginBottom: 16,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 20,
    },
    tag: {
        backgroundColor: "#F0F4F8",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E1E8ED",
    },
    tagText: {
        fontSize: 13,
        color: "#4A5568",
        fontWeight: "600",
    },
    salaryTag: {
        backgroundColor: "#E6F6EC",
        borderColor: "#C6EBD6",
    },
    salaryTagText: {
        fontSize: 13,
        color: "#276749",
        fontWeight: "700",
    },
    actionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginTop: 4,
    },
    applyButton: {
        flex: 1,
        backgroundColor: "#1A1A1A",
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: "center",
    },
    applyButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    saved: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    savedActive: {
        backgroundColor: "#EFF6FF",
        borderColor: "#93C5FD",
        borderWidth: 1.5,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#333",
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: "#666",
        textAlign: "center",
        maxWidth: "80%",
    },
    companyBadgeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    companyBadgeText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#2563EB",
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