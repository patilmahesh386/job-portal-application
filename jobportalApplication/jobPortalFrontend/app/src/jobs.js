import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Platform,
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

    const { job, jobLoading } = useSelector((state) => state.job);
    const savedJobs = useSelector((state) => state.job?.savedJobs || []);

    useEffect(() => {
        dispatch(getJobPost(''));
    }, []);

    const handleSearch = () => {
        dispatch(getJobPost(search));
    };

    const handleApply = async (jobId) => {
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
        try {
            await dispatch(applyJob(jobId)).unwrap();
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
});