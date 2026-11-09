import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

let FileSystem = null;
try {
    FileSystem = require("expo-file-system");
} catch (e) {
    console.log("FileSystem native module not available:", e?.message);
}
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import { getAllAppliedJobs, updateApplicationStatus } from "../redux/appliedJobs";

export default function AppliedCandidates() {
    const router = useRouter();
    // Track selected statuses per application ID
    const [selectedStatuses, setSelectedStatuses] = useState({});

    // Track expanded candidate IDs: { [applicationId]: boolean }
    const [expandedCandidateIds, setExpandedCandidateIds] = useState({});

    const dispatch = useDispatch();
    const { jobId } = useLocalSearchParams();

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/src/postedJobs");
        }
    };

    const { appliedJob, loading, error } = useSelector((state) => state.appliedJobs);

    const targetJob = useSelector((state) =>
        state.job?.myJobs?.find((item) => item._id === jobId)
    );

    useEffect(() => {
        if (jobId) {
            dispatch(getAllAppliedJobs(jobId));
        }
    }, [dispatch, jobId]);

    const toggleCandidateExpand = (id) => {
        setExpandedCandidateIds((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const handleStatusChange = async (applicationId, newStatus) => {
        try {
            await dispatch(updateApplicationStatus({ applicationId, status: newStatus })).unwrap();
            Toast.show({ type: "success", text1: "Application status updated successfully" });
        } catch (err) {
            console.error("Failed to update status:", err);
            Toast.show({
                type: "error",
                text1: "Application status update failed",
            });
        }
    };

    const handleViewResume = async (resumeData) => {
        if (!resumeData) {
            Alert.alert("No Resume", "This candidate has not attached a resume.");
            return;
        }

        if (resumeData.startsWith("data:application/pdf;base64,")) {
            try {
                const base64Content = resumeData.replace("data:application/pdf;base64,", "");
                const cacheUri = `${FileSystem.cacheDirectory}candidate_resume_${Date.now()}.pdf`;
                await FileSystem.writeAsStringAsync(cacheUri, base64Content, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                const canOpen = await Linking.canOpenURL(cacheUri);
                if (canOpen) {
                    await Linking.openURL(cacheUri);
                } else {
                    Alert.alert("Resume File", "Candidate PDF resume is cached and ready.");
                }
            } catch (err) {
                console.log("Error viewing candidate resume:", err);
                Alert.alert("Resume Error", "Could not open candidate's PDF resume.");
            }
            return;
        }

        let url = resumeData;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert("Cannot Open URL", `Unable to open link:\n${url}`);
            }
        } catch (e) {
            Alert.alert("Error", "Could not open resume link.");
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
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
                        <Text style={styles.navTitle}>Applied Candidates</Text>
                        <Text style={styles.navSubtitle}>Loading submissions...</Text>
                    </View>
                    <View style={{ width: 42 }} />
                </View>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
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
                        <Text style={styles.navTitle}>Applied Candidates</Text>
                        <Text style={styles.navSubtitle}>Error occurred</Text>
                    </View>
                    <View style={{ width: 42 }} />
                </View>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>
                        {typeof error === "string" ? error : "Error loading candidates."}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const candidateCount = Array.isArray(appliedJob) ? appliedJob.length : 0;

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
                    <Text style={styles.navTitle}>Applied Candidates</Text>
                    <Text style={styles.navSubtitle}>
                        {candidateCount} {candidateCount === 1 ? "Candidate" : "Candidates"} Applied
                    </Text>
                </View>
                <View style={{ width: 42 }} />
            </View>

            <View style={styles.container}>

            {/* Job Details Card */}
            {targetJob && (
                <View style={styles.jobCard}>
                    <Text style={styles.jobTitle}>{targetJob.title}</Text>
                    <Text style={styles.jobSummary}>
                        {targetJob.jobsummary || targetJob.jobSummary || "No summary provided"}
                    </Text>

                    <View style={styles.jobMetaContainer}>
                        <Text style={styles.jobMeta}>
                            <Text style={styles.boldText}>Vacancy:</Text> {targetJob.vacancy || 0}
                        </Text>
                        <Text style={styles.jobMeta}>
                            <Text style={styles.boldText}>Salary:</Text> {targetJob.salary || "N/A"}
                        </Text>
                    </View>
                </View>
            )}

            <FlatList
                data={Array.isArray(appliedJob) ? appliedJob : []}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No candidates have applied yet.</Text>
                }
                renderItem={({ item }) => {
                    const isExpanded = !!expandedCandidateIds[item._id];
                    const currentStatus =
                        selectedStatuses[item._id] || item.status || "pending";
                    const edu = item.applicant?.education?.[0];

                    return (
                        <View style={styles.candidateCard}>
                            {/* Header: Name + Dropdown Button */}
                            <TouchableOpacity
                                style={styles.candidateHeader}
                                onPress={() => toggleCandidateExpand(item._id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.candidateName}>
                                    {item.applicant?.name || "Anonymous Applicant"}
                                </Text>
                                <View style={styles.dropdownBadge}>
                                    <Text style={styles.dropdownBadgeText}>
                                        {isExpanded ? "Hide Details ▲" : "View Details ▼"}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Collapsible Candidate Details */}
                            {isExpanded && (
                                <View style={styles.expandedContent}>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.label}>Email:</Text>
                                        <Text style={styles.value}>
                                            {item.applicant?.email || "No email listed"}
                                        </Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <Text style={styles.label}>Skills:</Text>
                                        <Text style={styles.value}>
                                            {item.applicant?.skills?.join(", ") || "No skills listed"}
                                        </Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <Text style={styles.label}>College:</Text>
                                        <Text style={styles.value}>
                                            {edu?.college || "No college listed"}
                                        </Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <Text style={styles.label}>Degree:</Text>
                                        <Text style={styles.value}>
                                            {edu?.degree || "No degree listed"}
                                        </Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <Text style={styles.label}>Passing Year:</Text>
                                        <Text style={styles.value}>
                                            {edu?.year || "No year listed"}
                                        </Text>
                                    </View>

                                    {Boolean(item.applicant?.resume) && (
                                        <View style={styles.infoRow}>
                                            <Text style={styles.label}>Resume:</Text>
                                            <TouchableOpacity
                                                style={styles.viewResumeBtn}
                                                onPress={() => handleViewResume(item.applicant.resume)}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="document-text-outline" size={15} color="#007BFF" style={{ marginRight: 4 }} />
                                                <Text style={styles.viewResumeText}>View Resume (PDF) ↗</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    <View style={styles.divider} />

                                    {/* Status Management Section */}
                                    <Text style={styles.statusSectionLabel}>Application Status:</Text>
                                    <View style={styles.statusActionRow}>
                                        <View style={styles.pickerWrapper}>
                                            <Picker
                                                selectedValue={currentStatus}
                                                onValueChange={(itemValue) =>
                                                    setSelectedStatuses((prev) => ({
                                                        ...prev,
                                                        [item._id]: itemValue,
                                                    }))
                                                }
                                                style={styles.picker}
                                                dropdownIconColor="#007BFF" // Custom dropdown arrow color
                                            >
                                                <Picker.Item label="Pending" value="pending" color="#212529" />
                                                <Picker.Item label="Reviewed" value="reviewed" color="#212529" />
                                                <Picker.Item label="Rejected" value="rejected" color="#212529" />
                                                <Picker.Item label="Approved" value="approved" color="#212529" />
                                            </Picker>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.updateButton}
                                            onPress={() => handleStatusChange(item._id, currentStatus)}
                                        >
                                            <Text style={styles.updateButtonText}>Update</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                }}
            />
            </View>
        </SafeAreaView>
    );
}

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
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F8F9FA",
    },
    errorText: {
        color: "#DC3545",
        fontSize: 16,
    },
    jobCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#007BFF",
        marginBottom: 6,
    },
    jobSummary: {
        fontSize: 14,
        color: "#6C757D",
        lineHeight: 20,
        marginBottom: 12,
    },
    jobMetaContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#F1F3F5",
        paddingTop: 10,
    },
    jobMeta: {
        fontSize: 13,
        color: "#495057",
    },
    boldText: {
        fontWeight: "600",
    },
    listContainer: {
        paddingBottom: 24,
    },
    candidateCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        marginBottom: 12,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        overflow: "hidden",
    },
    candidateHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#FFFFFF",
    },
    candidateName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#212529",
        flex: 1,
    },
    dropdownBadge: {
        backgroundColor: "#E7F1FF",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
    },
    dropdownBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#007BFF",
    },
    expandedContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: "#F1F3F5",
        backgroundColor: "#FAFAFA",
    },
    infoRow: {
        marginTop: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: "700",
        color: "#495057",
        textTransform: "uppercase",
    },
    value: {
        fontSize: 14,
        color: "#212529",
        marginTop: 2,
    },
    viewResumeBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EBF5FF",
        borderWidth: 1,
        borderColor: "#BFDBFE",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: "flex-start",
        marginTop: 4,
    },
    viewResumeText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#007BFF",
    },
    divider: {
        height: 1,
        backgroundColor: "#E9ECEF",
        marginVertical: 12,
    },
    statusSectionLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#495057",
        marginBottom: 6,
    },
    statusActionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 6,
    },
    pickerWrapper: {
        flex: 1,
        height: 50, // Fixed height for wrapper gives native picker proper breathing room
        borderWidth: 1,
        borderColor: "#CED4DA",
        borderRadius: 8,
        backgroundColor: "#FFFFFF",
        marginRight: 10,
        justifyContent: "center",
        overflow: "hidden", // Ensures picker background respects rounded corners
    },
    picker: {
        width: "100%",
        height: 50,
        color: "#212529", // Explicit text color for selected value
        // Note: Remove marginBottom completely from here
    },
    updateButton: {
        backgroundColor: "#007BFF",
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 8,
    },
    updateButtonText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 14,
    },
    emptyText: {
        textAlign: "center",
        color: "#6C757D",
        marginTop: 40,
        fontSize: 15,
    },
});