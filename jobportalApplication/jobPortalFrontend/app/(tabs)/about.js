import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

export default function About() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="briefcase" size={34} color="#2563EB" />
        </View>

        <Text style={styles.title}>About JobPortal</Text>

        <Text style={styles.subtitle}>
          Connecting talented people with the right opportunities.
        </Text>
      </View>

      {/* Introduction Card */}
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Ionicons name="rocket-outline" size={28} color="#2563EB" />
        </View>

        <Text style={styles.cardTitle}>Find Your Next Opportunity</Text>

        <Text style={styles.description}>
          JobPortal is a simple and powerful platform designed to connect
          talented candidates with recruiters and companies. Discover jobs,
          apply easily, and take the next step in your career.
        </Text>
      </View>

      {/* Features */}
      <Text style={styles.sectionTitle}>Why Choose JobPortal?</Text>

      <View style={styles.featureCard}>
        <View style={styles.featureIcon}>
          <Ionicons name="search-outline" size={25} color="#2563EB" />
        </View>

        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>Find the Right Job</Text>
          <Text style={styles.featureText}>
            Search and discover job opportunities that match your skills and
            career goals.
          </Text>
        </View>
      </View>

      <View style={styles.featureCard}>
        <View style={styles.featureIcon}>
          <Ionicons name="send-outline" size={25} color="#2563EB" />
        </View>

        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>Apply Easily</Text>
          <Text style={styles.featureText}>
            Apply for your favorite jobs quickly and track your applications
            in one place.
          </Text>
        </View>
      </View>

      <View style={styles.featureCard}>
        <View style={styles.featureIcon}>
          <Ionicons name="people-outline" size={25} color="#2563EB" />
        </View>

        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>Connect with Recruiters</Text>
          <Text style={styles.featureText}>
            Recruiters can find talented candidates and post exciting job
            opportunities.
          </Text>
        </View>
      </View>

      {/* Mission */}
      <View style={styles.missionCard}>
        <Ionicons name="bulb-outline" size={32} color="#FFFFFF" />

        <Text style={styles.missionTitle}>Our Mission</Text>

        <Text style={styles.missionText}>
          To make the job search process simple, accessible, and efficient for
          both candidates and recruiters.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Your Career. Your Future.</Text>

        <Text style={styles.footerText}>
          Start exploring opportunities and build the career you deserve.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  header: {
    backgroundColor: "#2563EB",
    paddingTop: 60,
    paddingBottom: 35,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#DBEAFE",
    textAlign: "center",
    lineHeight: 22,
  },

  card: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    padding: 22,
    borderRadius: 18,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  iconBox: {
    width: 55,
    height: 55,
    borderRadius: 15,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  cardTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 24,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#1E293B",
    marginHorizontal: 20,
    marginBottom: 15,
  },

  featureCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    elevation: 2,
  },

  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  featureContent: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 5,
  },

  featureText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },

  missionCard: {
    backgroundColor: "#1D4ED8",
    margin: 20,
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
  },

  missionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 8,
  },

  missionText: {
    color: "#DBEAFE",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 23,
  },

  footer: {
    alignItems: "center",
    paddingHorizontal: 25,
    paddingBottom: 35,
  },

  footerTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
  },

  footerText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
  },
});