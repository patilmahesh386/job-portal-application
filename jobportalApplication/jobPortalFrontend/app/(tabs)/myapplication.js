import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { CandidatesJobs, deleteCandidateJobs } from "../redux/appliedJobs";

const CandidatesJobsScreen = () => {
    const dispatch = useDispatch();
    const router = useRouter();

    const user = useSelector((state) => state.auth.user);
    const userId = user?._id;

    const MyAppliedJobs = useSelector(
        (state) => state.appliedJobs.candidatesJobs
    );

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)/home");
        }
    };

    useEffect(() => {
        if (userId) {
            dispatch(CandidatesJobs(userId));
        }
    }, [dispatch, userId]);

    const handleDelete = (applicationId) => {
        Alert.alert(
            "Withdraw Application",
            "Are you sure you want to withdraw this job application?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Withdraw",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await dispatch(deleteCandidateJobs(applicationId)).unwrap();
                            dispatch(CandidatesJobs(userId));
                            Alert.alert("Success", "Application withdrawn successfully.");
                        } catch (error) {
                            console.log("Delete error:", error);
                            Alert.alert("Error", "Failed to withdraw application.");
                        }
                    },
                },
            ]
        );
    };

    const getStatusConfig = (status) => {
        const normalized = (status || "Pending").toLowerCase();
        switch (normalized) {
            case "approved":
            case "accepted":
                return {
                    label: "Accepted",
                    badgeStyle: styles.approvedBadge,
                    textStyle: styles.approvedText,
                    icon: "checkmark-circle-outline",
                    iconColor: "#16a34a",
                };
            case "rejected":
                return {
                    label: "Rejected",
                    badgeStyle: styles.rejectedBadge,
                    textStyle: styles.rejectedText,
                    icon: "close-circle-outline",
                    iconColor: "#dc2626",
                };
            default:
                return {
                    label: "In Review",
                    badgeStyle: styles.pendingBadge,
                    textStyle: styles.pendingText,
                    icon: "time-outline",
                    iconColor: "#d97706",
                };
        }
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <Ionicons name="briefcase-outline" size={48} color="#6366f1" />
            </View>
            <Text style={styles.emptyTitle}>No Applications Yet</Text>
            <Text style={styles.emptySubtitle}>
                You haven't applied for any positions yet. Explore open roles and kickstart your career!
            </Text>
        </View>
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
                    <Text style={styles.navTitle}>Applied Jobs</Text>
                    <Text style={styles.navSubtitle}>Track your applications & review status</Text>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{MyAppliedJobs?.length || 0}</Text>
                </View>
            </View>

            <View style={styles.container}>
                <FlatList
                    data={MyAppliedJobs || []}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={renderEmptyState}
                    renderItem={({ item }) => {
                    const statusConfig = getStatusConfig(item.status);
                    const job = item.jobId || {};

                    return (
                        <View style={styles.card}>
                            {/* Top Banner Row */}
                            <View style={styles.cardHeader}>
                                <View style={styles.companyIconBg}>
                                    <Ionicons name="business-outline" size={22} color="#4f46e5" />
                                </View>

                                <View style={styles.titleContainer}>
                                    <Text style={styles.jobTitle} numberOfLines={1}>
                                        {job.title || "Job Position"}
                                    </Text>
                                    <Text style={styles.companyName} numberOfLines={1}>
                                        {job.companyName || "Company Confidential"}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDelete(item?._id)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            </View>

                            {/* Summary Block */}
                            <View style={styles.summaryContainer}>
                                <Text style={styles.summary} numberOfLines={2}>
                                    {job.jobSummary || "No detailed job description was provided for this application."}
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            {/* Footer Information */}
                            <View style={styles.footerRow}>
                                <View style={styles.metaBadge}>
                                    <Ionicons name="people-outline" size={14} color="#64748b" />
                                    <Text style={styles.metaText}>
                                        {job.vacancy ?? 1} {job.vacancy === 1 ? "Opening" : "Openings"}
                                    </Text>
                                </View>

                                {/* Status Chip */}
                                <View style={[styles.statusBadge, statusConfig.badgeStyle]}>
                                    <Ionicons
                                        name={statusConfig.icon}
                                        size={14}
                                        color={statusConfig.iconColor}
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text style={[styles.statusText, statusConfig.textStyle]}>
                                        {statusConfig.label}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                }}
            />
            </View>
        </SafeAreaView>
    );
};

export default CandidatesJobsScreen;

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
        flex: 1,
        marginLeft: 12,
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
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    heading: {
        fontSize: 26,
        fontWeight: "800",
        color: "#0F172A",
        letterSpacing: -0.5,
    },
    countBadge: {
        backgroundColor: "#EEF2FF",
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 10,
        borderWidth: 1,
        borderColor: "#C7D2FE",
    },
    countText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#4F46E5",
    },
    listContainer: {
        paddingBottom: 30,
        flexGrow: 1,
    },
    card: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        marginBottom: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 15,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    companyIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#EEF2FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
    },
    jobTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 2,
    },
    companyName: {
        fontSize: 13,
        fontWeight: "500",
        color: "#64748B",
    },
    deleteButton: {
        padding: 8,
        borderRadius: 10,
        backgroundColor: "#FEF2F2",
        marginLeft: 8,
    },
    summaryContainer: {
        marginTop: 12,
    },
    summary: {
        fontSize: 13.5,
        color: "#475569",
        lineHeight: 19,
    },
    divider: {
        height: 1,
        backgroundColor: "#F1F5F9",
        marginVertical: 14,
    },
    footerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    metaBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F1F5F9",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    metaText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#475569",
        marginLeft: 5,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "700",
    },
    pendingBadge: {
        backgroundColor: "#FEF3C7",
    },
    pendingText: {
        color: "#B45309",
    },
    approvedBadge: {
        backgroundColor: "#DCFCE7",
    },
    approvedText: {
        color: "#15803D",
    },
    rejectedBadge: {
        backgroundColor: "#FEE2E2",
    },
    rejectedText: {
        color: "#B91C1C",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 80,
    },
    emptyIconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#EEF2FF",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 20,
        paddingHorizontal: 32,
    },
});