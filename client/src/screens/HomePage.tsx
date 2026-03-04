import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, spacing, radii, fontSizes } from "../theme";

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

      <View style={styles.header}>
        <Text style={styles.brand}>CellarApp</Text>
        <Text style={styles.tagline}>Manage your wine collection</Text>
      </View>

      <View style={styles.cards}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("MyCellar", {})}
        >
          <Text style={styles.cardIcon}>My Cellar</Text>
          <Text style={styles.cardDesc}>Browse and manage your wines</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardAccent]}
          onPress={() => navigation.navigate("Pairing")}
        >
          <Text style={styles.cardIcon}>Pairing</Text>
          <Text style={styles.cardDesc}>AI-powered food and wine pairing</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center",
  },
  logoutButton: {
    position: "absolute",
    top: 50,
    right: spacing.lg,
    zIndex: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: { color: colors.textSecondary, fontWeight: "600", fontSize: fontSizes.small },
  header: { alignItems: "center", marginBottom: spacing.xl + spacing.lg },
  brand: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tagline: { fontSize: fontSizes.subtitle, color: colors.textSecondary },
  cards: { gap: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  cardAccent: { borderColor: colors.accent },
  cardIcon: {
    fontSize: fontSizes.title,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  cardDesc: { fontSize: fontSizes.body, color: colors.textSecondary, textAlign: "center" },
});
