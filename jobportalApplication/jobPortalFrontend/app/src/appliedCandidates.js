import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Linking,
    Modal,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import api from "../api/axios";

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

    // Full-screen Resume Image Viewer modal
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedResumeData, setSelectedResumeData] = useState(null);

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

    const getResumeBackendUrl = (applicantId) => {
        const rawBaseUrl = api.defaults?.baseURL || "http://10.138.9.241:3000";
        return `${rawBaseUrl}/user/${applicantId}/resume`;
    };

    const handleViewResume = async (resumeData, applicant) => {
        if (!resumeData || !resumeData.trim()) {
            Alert.alert("No Resume", "This candidate has not attached a resume.");
            return;
        }

        const trimmed = resumeData.trim();

        // 1. Image format (base64 data:image/... or image url) -> open interactive modal
        const isImage =
            trimmed.startsWith("data:image/") ||
            /\.(jpe?g|png|webp|gif)($|\?)/i.test(trimmed);

        if (isImage) {
            setSelectedResumeData({
                uri: trimmed,
                name: applicant?.name || "Candidate",
                applicantId: applicant?._id,
            });
            setImageModalVisible(true);
            return;
        }

        // 2. Direct Web or Google Drive link
        if (!trimmed.startsWith("data:")) {
            let url = trimmed;
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "https://" + url;
            }
            try {
                if (Platform.OS === "web") {
                    window.open(url, "_blank");
                    return;
                }
                const canOpen = await Linking.canOpenURL(url);
                if (canOpen) {
                    await Linking.openURL(url);
                    return;
                }
            } catch (err) {
                console.log("Error opening resume link:", err);
            }
        }

        // 3. Document (PDF / DOC / Base64) -> Open directly via backend endpoint in browser
        if (applicant?._id) {
            const backendUrl = getResumeBackendUrl(applicant._id);
            try {
                if (Platform.OS === "web") {
                    window.open(backendUrl, "_blank");
                    return;
                }
                await WebBrowser.openBrowserAsync(backendUrl);
                return;
            } catch (browserErr) {
                console.log("WebBrowser failed, trying Linking:", browserErr);
                try {
                    await Linking.openURL(backendUrl);
                    return;
                } catch (linkErr) {
                    console.log("Linking also failed:", linkErr);
                }
            }
        }

        // 4. Fallback: Local FileSystem caching
        if (FileSystem?.cacheDirectory && FileSystem?.writeAsStringAsync) {
            try {
                const mimeMatch = trimmed.match(/^data:([^;]+);base64,/);
                const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
                let ext = mime.includes("pdf") ? "pdf" : "doc";
                const base64Content = trimmed.replace(/^data:[^;]+;base64,/, "");
                const cacheUri = `${FileSystem.cacheDirectory}candidate_resume_${Date.now()}.${ext}`;
                await FileSystem.writeAsStringAsync(cacheUri, base64Content, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                if (await Linking.canOpenURL(cacheUri)) {
                    await Linking.openURL(cacheUri);
                    return;
                }
            } catch (fsErr) {
                console.log("FileSystem fallback error:", fsErr);
            }
        }

        Alert.alert("Resume Document", "Unable to open document directly.");
    };

    const handleOpenInBrowser = async (resumeData, applicant) => {
        if (!resumeData || !resumeData.trim()) return;
        const trimmed = resumeData.trim();
        if (!trimmed.startsWith("data:")) {
            let url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
            Linking.openURL(url);
            return;
        }
        if (applicant?._id) {
            const url = getResumeBackendUrl(applicant._id);
            if (Platform.OS === "web") {
                window.open(url, "_blank");
            } else {
                WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));
            }
        }
    };

    const handleShareResume = async (resumeData, applicant) => {
        if (!resumeData || !resumeData.trim()) return;
        const trimmed = resumeData.trim();
        const candidateName = applicant?.name || "Candidate";
        try {
            if (!trimmed.startsWith("data:")) {
                await Share.share({
                    title: `${candidateName}'s Resume`,
                    message: `${candidateName}'s Resume: ${trimmed}`,
                    url: trimmed,
                });
            } else if (applicant?._id) {
                const url = getResumeBackendUrl(applicant._id);
                await Share.share({
                    title: `${candidateName}'s Resume`,
                    message: `View ${candidateName}'s Resume: ${url}`,
                    url,
                });
            }
        } catch (err) {
            console.log("Error sharing resume:", err);
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
                        const candidateResume = item.resume || item.applicant?.resume;
                        const hasResume = Boolean(candidateResume && candidateResume.trim());

                        return (
                            <View style={styles.candidateCard}>
                                {/* Header: Avatar + Candidate Info + Dropdown Button */}
                                <TouchableOpacity
                                    style={styles.candidateHeader}
                                    onPress={() => toggleCandidateExpand(item._id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.candidateHeaderLeft}>
                                        {item.applicant?.profileImage ? (
                                            <Image
                                                source={{ uri: item.applicant.profileImage }}
                                                style={styles.candidateAvatar}
                                            />
                                        ) : (
                                            <View style={styles.candidateAvatarPlaceholder}>
                                                <Text style={styles.candidateAvatarInitial}>
                                                    {(item.applicant?.name || "A").charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={styles.candidateNameWrap}>
                                            <Text style={styles.candidateName}>
                                                {item.applicant?.name || "Anonymous Applicant"}
                                            </Text>
                                            <Text style={styles.candidateEmailSnippet} numberOfLines={1}>
                                                {item.applicant?.email || "No email listed"}
                                            </Text>
                                        </View>
                                    </View>

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

                                        {Boolean(item.applicant?.phone) && (
                                            <View style={styles.infoRow}>
                                                <Text style={styles.label}>Phone:</Text>
                                                <Text style={styles.value}>
                                                    {item.applicant.phone}
                                                </Text>
                                            </View>
                                        )}

                                        {Boolean(item.applicant?.location) && (
                                            <View style={styles.infoRow}>
                                                <Text style={styles.label}>Location:</Text>
                                                <Text style={styles.value}>
                                                    {item.applicant.location}
                                                </Text>
                                            </View>
                                        )}

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

                                        {/* Comprehensive Resume Section */}
                                        <View style={styles.resumeContainer}>
                                            <View style={styles.resumeHeaderRow}>
                                                <Text style={styles.label}>Resume / CV Document:</Text>
                                                {hasResume ? (
                                                    <View style={styles.resumeStatusBadge}>
                                                        <Ionicons name="checkmark-circle" size={13} color="#16A34A" style={{ marginRight: 4 }} />
                                                        <Text style={styles.resumeStatusBadgeText}>Attached</Text>
                                                    </View>
                                                ) : (
                                                    <View style={styles.noResumeBadge}>
                                                        <Ionicons name="alert-circle-outline" size={13} color="#94A3B8" style={{ marginRight: 4 }} />
                                                        <Text style={styles.noResumeBadgeText}>Not Attached</Text>
                                                    </View>
                                                )}
                                            </View>

                                            {hasResume ? (
                                                <View style={styles.resumeCardBody}>
                                                    {(() => {
                                                        const isImage =
                                                            candidateResume.startsWith("data:image/") ||
                                                            /\.(jpe?g|png|webp|gif)($|\?)/i.test(candidateResume);
                                                        const isDoc =
                                                            candidateResume.startsWith("data:") ||
                                                            /\.pdf($|\?)/i.test(candidateResume);

                                                        return (
                                                            <>
                                                                <TouchableOpacity
                                                                    style={styles.mainResumeBtn}
                                                                    onPress={() => handleViewResume(candidateResume, item.applicant)}
                                                                    activeOpacity={0.8}
                                                                >
                                                                    <View style={styles.resumeBtnIconWrap}>
                                                                        <Ionicons
                                                                            name={
                                                                                isImage
                                                                                    ? "image"
                                                                                    : isDoc
                                                                                    ? "document-text"
                                                                                    : "globe-outline"
                                                                            }
                                                                            size={20}
                                                                            color="#FFFFFF"
                                                                        />
                                                                    </View>
                                                                    <View style={styles.resumeBtnTextWrap}>
                                                                        <Text style={styles.mainResumeBtnTitle}>
                                                                            {isImage
                                                                                ? "View Resume Image ↗"
                                                                                : isDoc
                                                                                ? "Open PDF Resume ↗"
                                                                                : "Open Resume Link ↗"}
                                                                        </Text>
                                                                        <Text style={styles.mainResumeBtnSubtitle}>
                                                                            {isImage
                                                                                ? "Tap to view full resolution document"
                                                                                : isDoc
                                                                                ? "Tap to open and download PDF"
                                                                                : "Tap to open candidate's web document"}
                                                                        </Text>
                                                                    </View>
                                                                    <Ionicons name="chevron-forward" size={18} color="#93C5FD" />
                                                                </TouchableOpacity>

                                                                <View style={styles.resumeActionsRow}>
                                                                    {isImage && (
                                                                        <TouchableOpacity
                                                                            style={styles.secondaryActionBtn}
                                                                            onPress={() => handleViewResume(candidateResume, item.applicant)}
                                                                            activeOpacity={0.7}
                                                                        >
                                                                            <Ionicons name="eye-outline" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                                                                            <Text style={styles.secondaryActionBtnText}>Preview</Text>
                                                                        </TouchableOpacity>
                                                                    )}
                                                                    <TouchableOpacity
                                                                        style={styles.secondaryActionBtn}
                                                                        onPress={() => handleOpenInBrowser(candidateResume, item.applicant)}
                                                                        activeOpacity={0.7}
                                                                    >
                                                                        <Ionicons name="open-outline" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                                                                        <Text style={styles.secondaryActionBtnText}>In Browser</Text>
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity
                                                                        style={[styles.secondaryActionBtn, { borderColor: "#CBD5E1" }]}
                                                                        onPress={() => handleShareResume(candidateResume, item.applicant)}
                                                                        activeOpacity={0.7}
                                                                    >
                                                                        <Ionicons name="share-social-outline" size={14} color="#475569" style={{ marginRight: 4 }} />
                                                                        <Text style={[styles.secondaryActionBtnText, { color: "#475569" }]}>Share</Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </>
                                                        );
                                                    })()}
                                                </View>
                                            ) : (
                                                <View style={styles.noResumeInfoBox}>
                                                    <Ionicons name="document-text-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                                                    <Text style={styles.noResumeHelpText}>
                                                        Candidate applied without attaching a resume or CV document.
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

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
                                                    dropdownIconColor="#007BFF"
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

            {/* Full-screen Image Resume Viewer Modal */}
            <Modal
                visible={imageModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setImageModalVisible(false)}
            >
                <SafeAreaView style={styles.modalBackdrop}>
                    <View style={styles.modalHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modalCandidateName} numberOfLines={1}>
                                {selectedResumeData?.name ? `${selectedResumeData.name}'s Resume` : "Candidate Resume"}
                            </Text>
                            <Text style={styles.modalSubtitle}>Full Document Preview</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setImageModalVisible(false)}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.modalScrollView}
                        contentContainerStyle={styles.modalScrollContent}
                        maximumZoomScale={4}
                        minimumZoomScale={1}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        {selectedResumeData?.uri ? (
                            <Image
                                source={{ uri: selectedResumeData.uri }}
                                style={styles.modalFullImage}
                                resizeMode="contain"
                            />
                        ) : null}
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.modalShareBtn}
                            onPress={() => handleShareResume(selectedResumeData?.uri, selectedResumeData)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="share-social-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.modalBtnText}>Share Document</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalDoneBtn}
                            onPress={() => setImageModalVisible(false)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.modalDoneBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
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
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 6,
    },
    jobSummary: {
        fontSize: 14,
        color: "#64748B",
        lineHeight: 20,
        marginBottom: 12,
    },
    jobMetaContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        paddingTop: 10,
    },
    jobMeta: {
        fontSize: 13,
        color: "#475569",
    },
    boldText: {
        fontWeight: "700",
        color: "#0F172A",
    },
    listContainer: {
        paddingBottom: 30,
    },
    candidateCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    candidateHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 14,
        backgroundColor: "#FFFFFF",
    },
    candidateHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 10,
    },
    candidateAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    candidateAvatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#EFF6FF",
        borderWidth: 1,
        borderColor: "#BFDBFE",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    candidateAvatarInitial: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2563EB",
    },
    candidateNameWrap: {
        flex: 1,
    },
    candidateName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
    },
    candidateEmailSnippet: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 2,
    },
    dropdownBadge: {
        backgroundColor: "#EFF6FF",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    dropdownBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#2563EB",
    },
    expandedContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        backgroundColor: "#FAFAFA",
    },
    infoRow: {
        marginTop: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: "700",
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },
    value: {
        fontSize: 14,
        color: "#0F172A",
        marginTop: 2,
    },
    resumeContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    resumeHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    resumeStatusBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F0FDF4",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#BBF7D0",
    },
    resumeStatusBadgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#16A34A",
    },
    noResumeBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F1F5F9",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    noResumeBadgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#64748B",
    },
    resumeCardBody: {
        marginTop: 4,
    },
    mainResumeBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2563EB",
        borderRadius: 10,
        padding: 10,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    resumeBtnIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    resumeBtnTextWrap: {
        flex: 1,
    },
    mainResumeBtnTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    mainResumeBtnSubtitle: {
        fontSize: 11,
        color: "#DBEAFE",
        marginTop: 1,
    },
    resumeActionsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
    },
    secondaryActionBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#BFDBFE",
        backgroundColor: "#EFF6FF",
    },
    secondaryActionBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#2563EB",
    },
    noResumeInfoBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    noResumeHelpText: {
        flex: 1,
        fontSize: 12,
        color: "#64748B",
        lineHeight: 16,
    },
    divider: {
        height: 1,
        backgroundColor: "#E2E8F0",
        marginVertical: 12,
    },
    statusSectionLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: 0.3,
        marginBottom: 6,
    },
    statusActionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
    },
    pickerWrapper: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 8,
        backgroundColor: "#FFFFFF",
        marginRight: 10,
        justifyContent: "center",
        overflow: "hidden",
    },
    picker: {
        width: "100%",
        height: 48,
        color: "#0F172A",
    },
    updateButton: {
        backgroundColor: "#2563EB",
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 8,
    },
    updateButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 14,
    },
    emptyText: {
        textAlign: "center",
        color: "#64748B",
        marginTop: 40,
        fontSize: 15,
    },

    // Modal Styles
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.95)",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    modalCandidateName: {
        fontSize: 17,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    modalSubtitle: {
        fontSize: 12,
        color: "#94A3B8",
        marginTop: 2,
    },
    modalCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 12,
    },
    modalScrollView: {
        flex: 1,
    },
    modalScrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 10,
    },
    modalFullImage: {
        width: Dimensions.get("window").width - 20,
        height: Dimensions.get("window").height * 0.75,
    },
    modalFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.1)",
        gap: 12,
    },
    modalShareBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2563EB",
        paddingVertical: 12,
        borderRadius: 10,
    },
    modalBtnText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 14,
    },
    modalDoneBtn: {
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
    },
    modalDoneBtnText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 14,
    },
});
