import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PairingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍽️ Wine Pairing</Text>
      <Text style={styles.subtitle}>Here you will find the best wine for your meal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#666" }
});
