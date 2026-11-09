import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { getPostedJobs } from "../redux/jobPostSlice";

const PostedJobsScreen = () => {
    const user = useSelector((state) => state.auth?.user);
    const postedJobs = useSelector((state) => state.job?.myJobs);
    const dispatch = useDispatch();
    const router = useRouter();

    useEffect(() => {
        if (user?._id) {
            dispatch(getPostedJobs(user._id));
        }
    }, [dispatch, user?._id]);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/src/userinfo");
        }
    };

    const handleSeeCandidates = (jobId) => {
        console.log("Viewing candidates for job ID:", jobId);
        router.push({
            pathname: "/src/appliedCandidates",
            params: { jobId: jobId },
        });
    };

    const sortedPostedJobs = Array.isArray(postedJobs)
        ? [...postedJobs].sort(
              (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          )
        : [];

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
                    <Text style={styles.navTitle}>Your Posted Jobs</Text>
                    <Text style={styles.navSubtitle}>Track listings and candidate applications</Text>
                </View>
                <View style={{ width: 42 }} />
            </View>

            <View style={styles.container}>
                {sortedPostedJobs.length > 0 ? (
                    <FlatList
                        data={sortedPostedJobs}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={styles.jobCard}>
                                <View style={styles.cardHeaderRow}>
                                    <View style={styles.jobIconBox}>
                                        <Ionicons name="briefcase" size={22} color="#2563EB" />
                                    </View>
                                    <View style={styles.titleInfo}>
                                        <Text style={styles.jobTitle}>{item.title}</Text>
                                        <View style={styles.badgeRow}>
                                            <View style={styles.vacancyBadge}>
                                                <Ionicons name="people-outline" size={13} color="#2563EB" style={{ marginRight: 4 }} />
                                                <Text style={styles.vacancyText}>
                                                    {item.vacancy ?? 1} {item.vacancy === 1 ? "Vacancy" : "Vacancies"}
                                                </Text>
                                            </View>
                                            {item.jobLocation ? (
                                                <View style={styles.locationBadge}>
                                                    <Ionicons name="location-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
                                                    <Text style={styles.locationText} numberOfLines={1}>{item.jobLocation}</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </View>
                                </View>

                                {item.jobSummary ? (
                                    <Text style={styles.jobSummary} numberOfLines={2}>
                                        {item.jobSummary}
                                    </Text>
                                ) : null}

                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={() => handleSeeCandidates(item._id)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="people" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.buttonText}>See Applied Candidates</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="briefcase-outline" size={48} color="#94A3B8" />
                        </View>
                        <Text style={styles.emptyTitle}>No Jobs Posted Yet</Text>
                        <Text style={styles.emptyText}>
                            You haven't published any openings yet. Tap 'Post a New Job' to start hiring top talent!
                        </Text>
                        <TouchableOpacity
                            style={styles.postNowBtn}
                            onPress={() => router.push("/src/postJob")}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.postNowText}>Post a Job Now</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

export default PostedJobsScreen;

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
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 16,
        paddingTop: 14,
    },
    listContainer: {
        paddingBottom: 30,
    },
    jobCard: {
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
    cardHeaderRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    jobIconBox: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: "#EFF6FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    titleInfo: {
        flex: 1,
    },
    jobTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 6,
    },
    badgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    vacancyBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EFF6FF",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    vacancyText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#2563EB",
    },
    locationBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F1F5F9",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    locationText: {
        fontSize: 11,
        color: "#64748B",
        fontWeight: "500",
    },
    jobSummary: {
        fontSize: 13,
        color: "#475569",
        lineHeight: 19,
        marginBottom: 14,
    },
    button: {
        flexDirection: "row",
        backgroundColor: "#2563EB",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#F1F5F9",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 19,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 20,
    },
    postNowBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2563EB",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },
    postNowText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
});
