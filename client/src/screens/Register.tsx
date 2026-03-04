import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { authApi } from "../services/api";
import { colors, spacing, radii, fontSizes } from "../theme";

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Register">;
type Props = { navigation: RegisterScreenNavigationProp };

export default function Register({ navigation }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required";
    if (!email.trim()) {
      next.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      next.email = "Invalid email format";
    }
    if (!password) {
      next.password = "Password is required";
    } else if (password.length < 6) {
      next.password = "Password must be at least 6 characters";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    try {
      setLoading(true);
      await authApi.register(email, password, name);
      Alert.alert("Success", "Account created. Please login.");
      navigation.navigate("Login");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>CellarApp</Text>
      <Text style={styles.subtitle}>Create your account</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        placeholder="Your full name"
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={(v) => { setName(v); clearError("name"); }}
        style={[styles.input, errors.name && styles.inputError]}
      />
      {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

      <Text style={styles.label}>Email</Text>
      <TextInput
        placeholder="you@example.com"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={(v) => { setEmail(v); clearError("email"); }}
        style={[styles.input, errors.email && styles.inputError]}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

      <Text style={styles.label}>Password</Text>
      <TextInput
        placeholder="At least 6 characters"
        placeholderTextColor={colors.textSecondary}
        value={password}
        onChangeText={(v) => { setPassword(v); clearError("password"); }}
        secureTextEntry
        style={[styles.input, errors.password && styles.inputError]}
      />
      {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: spacing.xl, backgroundColor: colors.background },
  brand: {
    fontSize: fontSizes.hero,
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
    borderRadius: radii.sm,
    padding: spacing.md - 2,
    marginBottom: spacing.md,
    color: colors.text,
    fontSize: fontSizes.body,
  },
  inputError: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: fontSizes.small, marginBottom: spacing.sm, marginTop: -spacing.sm },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radii.sm,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonText: { color: colors.background, fontWeight: "bold", fontSize: fontSizes.subtitle },
  link: { marginTop: spacing.lg, textAlign: "center", color: colors.textSecondary, fontSize: fontSizes.body },
  linkBold: { color: colors.primary, fontWeight: "bold" },
});
