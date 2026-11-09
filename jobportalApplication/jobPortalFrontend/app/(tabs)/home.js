import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import Jobs from "../src/jobs";

const Home = () => {

  const router = useRouter();

  return (
    <View style={styles.container}>

      <View style={styles.jobsContainer}>
        <Jobs />
      </View>
    </View>
  );
};

export default Home;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  topSection: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    alignItems: "flex-end", // Post Job button on the right
  },

  jobsContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },

  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});