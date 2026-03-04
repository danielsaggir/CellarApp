import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { aiApi } from "../services/api";
import { colors, spacing, radii, fontSizes } from "../theme";

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
      <Text style={styles.title}>Wine Pairing</Text>
      <Text style={styles.subtitle}>Find the perfect wine for your dish</Text>

      <Text style={styles.label}>Dish Name</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholder="e.g. steak, salmon, pasta..."
        placeholderTextColor={colors.textSecondary}
        value={food}
        onChangeText={(v) => { setFood(v); setError(""); }}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={getPairing}>
          <Text style={styles.buttonText}>Get Pairing</Text>
        </TouchableOpacity>
      )}

      {suggestion ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultQuote}>"</Text>
          <Text style={styles.result}>{suggestion}</Text>
          <Text style={styles.resultQuoteEnd}>"</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: "center", backgroundColor: colors.background },
  title: {
    fontSize: fontSizes.title,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSizes.body,
    color: colors.primary,
    marginBottom: spacing.xs,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
    color: colors.text,
    padding: spacing.md - 2,
    marginBottom: spacing.md,
    borderRadius: radii.sm,
    fontSize: fontSizes.body,
  },
  inputError: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: fontSizes.small, marginBottom: spacing.sm, marginTop: -spacing.sm },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radii.sm,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: { color: colors.background, fontWeight: "bold", fontSize: fontSizes.subtitle },
  resultCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  resultQuote: { fontSize: 40, color: colors.primary, lineHeight: 44, marginBottom: -spacing.sm },
  result: {
    fontSize: fontSizes.subtitle,
    color: colors.text,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 24,
  },
  resultQuoteEnd: {
    fontSize: 40,
    color: colors.primary,
    lineHeight: 44,
    marginTop: -spacing.sm,
    alignSelf: "flex-end",
  },
});
