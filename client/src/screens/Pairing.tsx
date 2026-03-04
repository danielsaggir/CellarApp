import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from "react-native";
import { aiApi } from "../services/api";

export default function PairingScreen() {
  const [food, setFood] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function getPairing() {
    if (!food.trim()) {
      setError("Please enter a dish name");
      return;
    }
    try {
      setLoading(true);
      setSuggestion("");
      const data = await aiApi.getPairing(food);
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
        style={[styles.input, error ? styles.inputError : null]}
        placeholder="Enter a dish (e.g., steak) *"
        value={food}
        onChangeText={(v) => { setFood(v); setError(""); }}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  inputError: { borderColor: "#d32f2f" },
  errorText: { color: "#d32f2f", fontSize: 12, marginBottom: 8, marginTop: -6 },
  result: { marginTop: 20, fontSize: 16, fontStyle: "italic", textAlign: "center" },
});
