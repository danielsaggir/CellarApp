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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { authApi } from "../services/api";
import { colors, spacing, radii, fontSizes } from "../theme";

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;
type Props = { navigation: LoginScreenNavigationProp };

export default function Login({ navigation }: Props) {
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
    if (!email.trim()) {
      next.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      next.email = "Invalid email format";
    }
    if (!password) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    try {
      setLoading(true);
      const data = await authApi.login(email, password);
      await AsyncStorage.setItem("token", data.token);
      navigation.reset({ index: 0, routes: [{ name: "HomePage" as const }] });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>CellarApp</Text>
      <Text style={styles.subtitle}>Your personal wine collection</Text>

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
        placeholder="Enter your password"
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
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Register</Text></Text>
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
