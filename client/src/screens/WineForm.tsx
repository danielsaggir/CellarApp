import React, { useState } from "react";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { launchImageLibrary, Asset } from "react-native-image-picker";
import { Dropdown } from "react-native-element-dropdown";
import { RootStackParamList, WineTypeItem } from "../types";
import { wineApi } from "../services/api";

type WineFormRouteProp = RouteProp<RootStackParamList, "WineForm">;

export default function WineForm() {
  const navigation = useNavigation();
  const route = useRoute<WineFormRouteProp>();
  const editingWine = route.params?.wine ?? null;
  const isEditing = editingWine !== null;

  const [name, setName] = useState(editingWine?.name ?? "");
  const [country, setCountry] = useState(editingWine?.country ?? "");
  const [region, setRegion] = useState(editingWine?.region ?? "");
  const [producer, setProducer] = useState(editingWine?.producer ?? "");
  const [vintage, setVintage] = useState(
    editingWine?.vintage != null ? String(editingWine.vintage) : ""
  );
  const [type, setType] = useState(editingWine?.type ?? "");
  const [notes, setNotes] = useState(editingWine?.notes ?? "");
  const [image, setImage] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const wineTypes: WineTypeItem[] = [
    { label: "🍷 Red", value: "RED", color: "#b71c1c" },
    { label: "⚪ White", value: "WHITE", color: "#fbc02d" },
    { label: "🌸 Rosé", value: "ROSE", color: "#ec407a" },
    { label: "✨ Sparkling", value: "SPARKLING", color: "#0288d1" },
    { label: "🍊 Orange", value: "ORANGE", color: "#f57c00" },
  ];

  async function pickImage() {
    const result = await launchImageLibrary({
      mediaType: "photo",
      quality: 1,
    });
    if (result.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  }

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
    if (!name.trim()) next.name = "Wine name is required";
    if (!country.trim()) next.country = "Country is required";
    if (!type) next.type = "Wine type is required";
    if (vintage) {
      const v = parseInt(vintage, 10);
      if (isNaN(v) || v < 1800 || v > 2100) {
        next.vintage = "Vintage must be a year between 1800 and 2100";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("country", country);
      if (region) formData.append("region", region);
      if (producer) formData.append("producer", producer);
      if (vintage) formData.append("vintage", String(parseInt(vintage, 10)));
      formData.append("type", type);
      if (notes) formData.append("notes", notes);

      if (image?.uri) {
        const filename = image.fileName || `wine_${Date.now()}.jpg`;
        formData.append("image", {
          uri: image.uri,
          name: filename,
          type: image.type || "image/jpeg",
        } as any);
      }

      if (isEditing) {
        await wineApi.updateWine(editingWine!.id, formData);
        Alert.alert("Success", "Wine updated!");
      } else {
        await wineApi.createWine(formData);
        Alert.alert("Success", "Wine added!");
      }

      navigation.goBack();
      setName("");
      setCountry("");
      setRegion("");
      setProducer("");
      setVintage("");
      setType("");
      setNotes("");
      setImage(null);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || (isEditing ? "Failed to update wine" : "Failed to add wine"));
    } finally {
      setLoading(false);
    }
  }

  const renderItem = (item: WineTypeItem) => (
    <View style={styles.dropdownItem}>
      <View style={[styles.colorBadge, { backgroundColor: item.color }]} />
      <Text style={styles.dropdownText}>{item.label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isEditing ? "Edit Wine 🍷" : "Add a Wine 🍷"}</Text>
      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        placeholder="Name *"
        value={name}
        onChangeText={(v) => { setName(v); clearError("name"); }}
      />
      {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
      <TextInput
        style={[styles.input, errors.country && styles.inputError]}
        placeholder="Country *"
        value={country}
        onChangeText={(v) => { setCountry(v); clearError("country"); }}
      />
      {errors.country ? <Text style={styles.errorText}>{errors.country}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Region"
        value={region}
        onChangeText={setRegion}
      />
      <TextInput
        style={styles.input}
        placeholder="Producer"
        value={producer}
        onChangeText={setProducer}
      />
      <TextInput
        style={[styles.input, errors.vintage && styles.inputError]}
        placeholder="Vintage (year)"
        keyboardType="numeric"
        value={vintage}
        onChangeText={(v) => { setVintage(v); clearError("vintage"); }}
      />
      {errors.vintage ? <Text style={styles.errorText}>{errors.vintage}</Text> : null}

      <Text style={styles.label}>Type *</Text>
      <Dropdown
        style={[styles.dropdown, errors.type && styles.inputError]}
        data={wineTypes}
        labelField="label"
        valueField="value"
        placeholder="Select type..."
        value={type}
        onChange={(item: WineTypeItem) => { setType(item.value); clearError("type"); }}
        renderItem={renderItem}
      />
      {errors.type ? <Text style={styles.errorText}>{errors.type}</Text> : null}

      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Personal Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        <Text style={styles.imagePickerText}>
          {image ? "Change Image" : "Pick an Image"}
        </Text>
      </TouchableOpacity>
      {image?.uri ? (
        <Image source={{ uri: image.uri }} style={styles.preview} />
      ) : isEditing && editingWine?.imageUrl ? (
        <Image source={{ uri: editingWine.imageUrl }} style={styles.preview} />
      ) : null}

      <Button
        title={loading ? "Saving..." : isEditing ? "Update Wine" : "Save Wine"}
        onPress={handleSubmit}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  label: { fontSize: 16, marginBottom: 5, marginTop: 10 },
  dropdown: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  dropdownText: { fontSize: 14, color: "#333" },
  colorBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  inputError: { borderColor: "#d32f2f" },
  errorText: { color: "#d32f2f", fontSize: 12, marginBottom: 8, marginTop: -6 },
  imagePicker: {
    backgroundColor: "#2980b9",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  imagePickerText: { color: "#fff" },
  preview: {
    width: 120,
    height: 160,
    marginBottom: 10,
    alignSelf: "center",
    borderRadius: 8,
  },
});
