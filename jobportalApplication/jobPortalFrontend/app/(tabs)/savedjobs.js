import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { getJobsByJobId, toggleSaveJob } from "../redux/jobPostSlice"; // Import unsave action if available

export default function SavedJobs() {
    const dispatch = useDispatch();

    // 1. Get array of saved job IDs
    const savedJobIds = useSelector((state) => state.job?.savedJobs || []);

    // 2. Get the complete list of jobs from Redux store to match details
    const allJobs = useSelector((state) => state.job?.job || []);

    // Fetch saved jobs details when savedJobIds change
    useEffect(() => {
        if (savedJobIds.length > 0) {
            dispatch(getJobsByJobId(savedJobIds));
        }
    }, [dispatch, savedJobIds]);

    // 3. Filter all available jobs to match only saved IDs
    const savedJobsList = allJobs.filter((job) =>
        savedJobIds.includes(job._id)
    );

    const handleUnsave = (jobId) => {
        if (toggleSaveJob) {
            dispatch(toggleSaveJob(jobId));
        }
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <Ionicons name="bookmark-outline" size={48} color="#6366F1" />
            </View>
            <Text style={styles.emptyTitle}>No Saved Jobs</Text>
            <Text style={styles.emptySubtitle}>
                Jobs you bookmark for later will show up here. Start exploring and save your favorites!
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.headerContainer}>
                <Text style={styles.heading}>Saved Jobs</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{savedJobsList.length}</Text>
                </View>
            </View>

            <FlatList
                data={savedJobsList}
                keyExtractor={(item, index) =>
                    item._id ? item._id.toString() : index.toString()
                }
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        {/* Header Row */}
                        <View style={styles.cardHeader}>
                            <View style={styles.companyIconBg}>
                                <Ionicons name="briefcase-outline" size={22} color="#4F46E5" />
                            </View>

                            <View style={styles.titleContainer}>
                                <Text style={styles.title} numberOfLines={1}>
                                    {item.title || "Job Position"}
                                </Text>
                                <Text style={styles.companyName} numberOfLines={1}>
                                    {item.companyName || "Company Confidential"}
                                </Text>
                            </View>

                            {/* Bookmark Unsave Action */}
                            <TouchableOpacity
                                style={styles.bookmarkButton}
                                onPress={() => handleUnsave(item._id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="bookmark" size={20} color="#4F46E5" />
                            </TouchableOpacity>
                        </View>

                        {/* Summary */}
                        {item.jobSummary && (
                            <Text style={styles.summary} numberOfLines={2}>
                                {item.jobSummary}
                            </Text>
                        )}

                        <View style={styles.divider} />

                        {/* Footer Chips */}
                        <View style={styles.footerRow}>
                            {item.location ? (
                                <View style={styles.metaBadge}>
                                    <Ionicons name="location-outline" size={14} color="#64748B" />
                                    <Text style={styles.metaText} numberOfLines={1}>
                                        {item.location}
                                    </Text>
                                </View>
                            ) : null}

                            {item.salary != null && item.salary !== "" ? (
                                <View style={styles.salaryBadge}>
                                    <Ionicons name="cash-outline" size={14} color="#15803D" />
                                    <Text style={styles.salaryText}>
                                        ₹{typeof item.salary === "number" ? item.salary.toLocaleString("en-IN") : item.salary}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 20,
        paddingTop: 24,
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
    title: {
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
    bookmarkButton: {
        padding: 8,
        borderRadius: 10,
        backgroundColor: "#EEF2FF",
        marginLeft: 8,
    },
    summary: {
        fontSize: 13.5,
        color: "#475569",
        lineHeight: 19,
        marginTop: 12,
    },
    divider: {
        height: 1,
        backgroundColor: "#F1F5F9",
        marginVertical: 14,
    },
    footerRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
    },
    metaBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F1F5F9",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    metaText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#475569",
        marginLeft: 4,
    },
    salaryBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#DCFCE7",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    salaryText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#15803D",
        marginLeft: 4,
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