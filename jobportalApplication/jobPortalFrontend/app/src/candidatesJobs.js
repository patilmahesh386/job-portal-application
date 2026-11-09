// import { Ionicons } from "@expo/vector-icons";
// import { useEffect } from "react";
// import {
//     Alert,
//     FlatList,
//     StyleSheet,
//     Text,
//     TouchableOpacity,
//     View
// } from "react-native";
// import { useDispatch, useSelector } from "react-redux";
// import { CandidatesJobs, deleteCandidateJobs } from "../redux/appliedJobs";

// const CandidatesJobsScreen = () => {
//     const dispatch = useDispatch();

//     const user = useSelector((state) => state.auth.user);
//     const userId = user?._id;

//     const MyAppliedJobs = useSelector(
//         (state) => state.appliedJobs.candidatesJobs
//     );

//     useEffect(() => {
//         if (userId) {
//             dispatch(CandidatesJobs(userId));
//         }
//     }, [dispatch, userId]);

//     const handledelete = (applicationId) => {
//         Alert.alert(
//             "Withdraw Application",
//             "Are you sure you want to withdraw this job application?",
//             [
//                 { text: "Cancel", style: "cancel" },
//                 {
//                     text: "Withdraw",
//                     style: "destructive",
//                     onPress: async () => {
//                         try {
//                             await dispatch(deleteCandidateJobs(applicationId)).unwrap();
//                             dispatch(CandidatesJobs(userId));
//                             Alert.alert("Success", "Application withdrawn successfully.");
//                         } catch (error) {
//                             console.log("Delete error:", error);
//                             Alert.alert("Error", "Failed to withdraw application.");
//                         }
//                     },
//                 },
//             ]
//         );
//     };

//     // Beautiful empty state when no jobs are applied
//     const renderEmptyState = () => (
//         <View style={styles.emptyContainer}>
//             <Ionicons name="briefcase-outline" size={64} color="#cbd5e1" />
//             <Text style={styles.emptyTitle}>No applications yet</Text>
//             <Text style={styles.emptySubtitle}>
//                 Jobs you apply for will show up right here.
//             </Text>
//         </View>
//     );

//     return (
//         <View style={styles.container}>
//             <Text style={styles.heading}>Your Applied Jobs</Text>

//             <FlatList
//                 data={MyAppliedJobs || []}
//                 keyExtractor={(item) => item._id}
//                 contentContainerStyle={styles.listContainer}
//                 showsVerticalScrollIndicator={false}
//                 ListEmptyComponent={renderEmptyState}
//                 renderItem={({ item }) => {
//                     // Normalize status string for matching styles
//                     const currentStatus = item.status || "Pending";

//                     let statusStyle = styles.pendingBadge;
//                     if (currentStatus === "Approved" || currentStatus === "Accepted") {
//                         statusStyle = styles.approvedBadge;
//                     } else if (currentStatus === "Rejected") {
//                         statusStyle = styles.rejectedBadge;
//                     }

//                     return (
//                         <View style={styles.card}>
//                             {/* Card Header */}
//                             <View style={styles.cardHeader}>
//                                 <Text style={styles.jobTitle} numberOfLines={2}>
//                                     {item.jobId?.title || "Job Position"}
//                                 </Text>
//                                 <TouchableOpacity
//                                     style={styles.deleteButton}
//                                     onPress={() => handledelete(item?._id)}
//                                 >
//                                     <Ionicons name="trash-outline" size={18} color="#ef4444" />
//                                 </TouchableOpacity>
//                             </View>

//                             {/* Job Summary */}
//                             <Text style={styles.label}>Job Summary</Text>
//                             <Text style={styles.summary} numberOfLines={3}>
//                                 {item.jobId?.jobSummary || "No description provided."}
//                             </Text>

//                             <View style={styles.divider} />

//                             {/* Card Footer Meta Information */}
//                             <View style={styles.footerRow}>
//                                 <View style={styles.metaItem}>
//                                     <Ionicons name="people-outline" size={16} color="#64748b" />
//                                     <Text style={styles.value}>
//                                         Vacancy: <Text style={styles.boldText}>{item.jobId?.vacancy ?? 0}</Text>
//                                     </Text>
//                                 </View>

//                                 <View style={[styles.statusBadge, statusStyle]}>
//                                     <Text style={styles.statusText}>{currentStatus}</Text>
//                                 </View>
//                             </View>
//                         </View>
//                     );
//                 }}
//             />
//         </View>
//     );
// };

// export default CandidatesJobsScreen;

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: "#f8fafc", // Softer, cleaner premium grey background
//         paddingHorizontal: 20,
//         paddingTop: 24,
//     },
//     heading: {
//         fontSize: 26,
//         fontWeight: "800",
//         marginBottom: 20,
//         color: "#0f172a", // Darker slate for bold typography
//         letterSpacing: -0.5,
//     },
//     listContainer: {
//         paddingBottom: 30,
//         flexGrow: 1,
//     },
//     card: {
//         backgroundColor: "#ffffff",
//         padding: 18,
//         marginBottom: 16,
//         borderRadius: 16,
//         borderWidth: 1,
//         borderColor: "#f1f5f9", // Crisp edge border

//         // Premium subtle shadows
//         shadowColor: "#0f172a",
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.04,
//         shadowRadius: 12,
//         elevation: 2,
//     },
//     cardHeader: {
//         flexDirection: "row",
//         justifyContent: "between",
//         alignItems: "flex-start",
//         marginBottom: 10,
//     },
//     jobTitle: {
//         fontSize: 18,
//         fontWeight: "700",
//         color: "#1e293b",
//         flex: 1,
//         paddingRight: 12,
//         lineHeight: 24,
//     },
//     deleteButton: {
//         padding: 8,
//         borderRadius: 10,
//         backgroundColor: "#fef2f2", // Softer red highlight tint
//     },
//     label: {
//         fontSize: 12,
//         fontWeight: "700",
//         color: "#94a3b8",
//         textTransform: "uppercase",
//         letterSpacing: 0.5,
//         marginBottom: 4,
//     },
//     summary: {
//         fontSize: 14,
//         color: "#475569",
//         lineHeight: 20,
//         marginBottom: 16,
//     },
//     divider: {
//         height: 1,
//         backgroundColor: "#f1f5f9",
//         marginBottom: 14,
//     },
//     footerRow: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "center",
//     },
//     metaItem: {
//         flexDirection: "row",
//         alignItems: "center",
//     },
//     value: {
//         fontSize: 14,
//         color: "#64748b",
//         marginLeft: 6,
//     },
//     boldText: {
//         fontWeight: "600",
//         color: "#334155",
//     },
//     statusBadge: {
//         paddingHorizontal: 12,
//         paddingVertical: 6,
//         borderRadius: 50,
//         alignItems: "center",
//         justifyContent: "center",
//     },
//     statusText: {
//         fontSize: 12,
//         fontWeight: "700",
//     },
//     pendingBadge: {
//         backgroundColor: "#fef3c7",
//         color: "#d97706",
//     },
//     approvedBadge: {
//         backgroundColor: "#dcfce7",
//         color: "#15803d",
//     },
//     rejectedBadge: {
//         backgroundColor: "#fee2e2",
//         color: "#b91c1c",
//     },
//     /* Empty State Styles */
//     emptyContainer: {
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//         paddingVertical: 80,
//     },
//     emptyTitle: {
//         fontSize: 18,
//         fontWeight: "700",
//         color: "#475569",
//         marginTop: 16,
//         marginBottom: 4,
//     },
//     emptySubtitle: {
//         fontSize: 14,
//         color: "#94a3b8",
//         textAlign: "center",
//         paddingHorizontal: 32,
//     },
// });