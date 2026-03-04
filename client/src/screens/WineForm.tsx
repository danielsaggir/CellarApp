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
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { launchImageLibrary, launchCamera, Asset } from "react-native-image-picker";
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
  const [winery, setWinery] = useState(editingWine?.winery ?? "");
  const [vintage, setVintage] = useState(
    editingWine?.vintage != null ? String(editingWine.vintage) : ""
  );
  const [type, setType] = useState(editingWine?.type ?? "");
  const [amount, setAmount] = useState(
    editingWine?.amount != null ? String(editingWine.amount) : ""
  );
  const [grapes, setGrapes] = useState(editingWine?.grapes ?? "");
  const [notes, setNotes] = useState(editingWine?.notes ?? "");
  const [image, setImage] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
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
    if (amount) {
      const a = parseInt(amount, 10);
      if (isNaN(a) || a < 0) {
        next.amount = "Amount must be a positive number";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleScanLabel() {
    try {
      const result = await launchCamera({ mediaType: "photo", quality: 0.8 });
      if (!result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      if (!asset.uri) return;

      setScanning(true);
      const formData = new FormData();
      formData.append("image", {
        uri: asset.uri,
        name: asset.fileName || `scan_${Date.now()}.jpg`,
        type: asset.type || "image/jpeg",
      } as any);

      const scanned = await wineApi.scanLabel(formData);
      if (scanned.name) setName(scanned.name);
      if (scanned.country) setCountry(scanned.country);
      if (scanned.region) setRegion(scanned.region);
      if (scanned.winery) setWinery(scanned.winery);
      if (scanned.vintage) setVintage(String(scanned.vintage));
      if (scanned.type) setType(scanned.type);
      if (scanned.grapes) setGrapes(scanned.grapes);
    } catch (err: any) {
      Alert.alert("Scan Failed", err.message || "Could not scan the wine label");
    } finally {
      setScanning(false);
    }
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("country", country);
      if (region) formData.append("region", region);
      if (winery) formData.append("winery", winery);
      if (vintage) formData.append("vintage", String(parseInt(vintage, 10)));
      formData.append("type", type);
      if (amount) formData.append("amount", String(parseInt(amount, 10)));
      if (grapes) formData.append("grapes", grapes);
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
      setWinery("");
      setVintage("");
      setType("");
      setAmount("");
      setGrapes("");
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>{isEditing ? "Edit Wine 🍷" : "Add a Wine 🍷"}</Text>
      {!isEditing && (
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanLabel}
          disabled={scanning}
        >
          {scanning ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.scanButtonText}>📷 Scan Wine Label</Text>
          )}
        </TouchableOpacity>
      )}
      <Text style={styles.label}>Wine Name *</Text>
      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        placeholder="e.g. Château Margaux"
        value={name}
        onChangeText={(v) => { setName(v); clearError("name"); }}
      />
      {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

      <Text style={styles.label}>Country of Origin *</Text>
      <TextInput
        style={[styles.input, errors.country && styles.inputError]}
        placeholder="e.g. France"
        value={country}
        onChangeText={(v) => { setCountry(v); clearError("country"); }}
      />
      {errors.country ? <Text style={styles.errorText}>{errors.country}</Text> : null}

      <Text style={styles.label}>Region</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Bordeaux, Napa Valley"
        value={region}
        onChangeText={setRegion}
      />

      <Text style={styles.label}>Winery</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Domaine de la Romanée-Conti"
        value={winery}
        onChangeText={setWinery}
      />

      <Text style={styles.label}>Vintage (year)</Text>
      <TextInput
        style={[styles.input, errors.vintage && styles.inputError]}
        placeholder="e.g. 2018"
        keyboardType="numeric"
        value={vintage}
        onChangeText={(v) => { setVintage(v); clearError("vintage"); }}
      />
      {errors.vintage ? <Text style={styles.errorText}>{errors.vintage}</Text> : null}

      <Text style={styles.label}>Wine Type *</Text>
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

      <Text style={styles.label}>Amount (bottles)</Text>
      <TextInput
        style={[styles.input, errors.amount && styles.inputError]}
        placeholder="e.g. 6"
        keyboardType="numeric"
        value={amount}
        onChangeText={(v) => { setAmount(v); clearError("amount"); }}
      />
      {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}

      <Text style={styles.label}>Grape Varieties</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Cabernet Sauvignon, Merlot"
        value={grapes}
        onChangeText={setGrapes}
      />

      <Text style={styles.label}>Personal Notes</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Your tasting notes, thoughts, etc."
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  scanButton: {
    backgroundColor: "#00897b",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  scanButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
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
