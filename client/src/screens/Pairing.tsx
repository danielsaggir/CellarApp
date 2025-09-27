import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from "react-native";
import config from "./config";

export default function PairingScreen() {
  const [food, setFood] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function getPairing() {
    try {
      setLoading(true);
      setSuggestion("");
      const res = await fetch(`${config.API_URL}/ai/pairing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food }),
      });
      const data = await res.json();
      setSuggestion(data.suggestion || "No suggestion found");
    } catch {
      setSuggestion("Error getting pairing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍽️ Wine Pairing</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter a dish (e.g., steak)"
        value={food}
        onChangeText={setFood}
      />
      {loading ? (
        <ActivityIndicator color="#2575fc" />
      ) : (
        <Button title="Get Pairing" onPress={getPairing} />
      )}
      {suggestion ? <Text style={styles.result}>{suggestion}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  result: { marginTop: 20, fontSize: 16, fontStyle: "italic", textAlign: "center" },
});
