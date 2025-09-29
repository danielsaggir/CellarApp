import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import AsyncStorage from "@react-native-async-storage/async-storage";

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "HomePage">;
type Props = { navigation: HomeScreenNavigationProp };

export default function HomePage({ navigation }: Props) {
  async function handleLogout() {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to log out");
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.half, { backgroundColor: "#2575fc" }]}
        onPress={() => navigation.navigate("MyCellar", {})}
      >
        <Text style={styles.halfText}>🍷 My Cellar</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.half, { backgroundColor: "#6a11cb" }]}
        onPress={() => navigation.navigate("Pairing")}
      >
        <Text style={styles.halfText}>🍽️ Pairing</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  half: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  halfText: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  logoutButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: "#d32f2f",
    borderRadius: 6,
  },
  logoutText: { color: "#fff", fontWeight: "bold" },
});