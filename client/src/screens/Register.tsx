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
      <Text style={styles.title}>Register</Text>
      <TextInput
        placeholder="Name *"
        value={name}
        onChangeText={(v) => { setName(v); clearError("name"); }}
        style={[styles.input, errors.name && styles.inputError]}
      />
      {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
      <TextInput
        placeholder="Email *"
        value={email}
        onChangeText={(v) => { setEmail(v); clearError("email"); }}
        style={[styles.input, errors.email && styles.inputError]}
        autoCapitalize="none"
      />
      {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
      <TextInput
        placeholder="Password *"
        value={password}
        onChangeText={(v) => { setPassword(v); clearError("password"); }}
        secureTextEntry
        style={[styles.input, errors.password && styles.inputError]}
      />
      {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
      {loading ? (
        <ActivityIndicator color="#2575fc" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  inputError: { borderColor: "#d32f2f" },
  errorText: { color: "#d32f2f", fontSize: 12, marginBottom: 8, marginTop: -6 },
  button: { backgroundColor: "#2575fc", padding: 12, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  link: { marginTop: 15, textAlign: "center", color: "#2575fc" },
});
