import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchImageLibrary, Asset } from "react-native-image-picker";
import { Dropdown } from "react-native-element-dropdown";
import config from "./config";

type WineTypeItem = {
  label: string;
  value: string;
  color: string;
};

export default function WineForm() {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [producer, setProducer] = useState("");
  const [vintage, setVintage] = useState("");
  const [type, setType] = useState("");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit() {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Auth", "Please login first");
        return;
      }

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

      const res = await fetch(`${config.API_URL}/wines`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        throw new Error(data?.error || "Failed to add wine");
      }

      Alert.alert("Success", "Wine added!");
      navigation.goBack(); // Auto-close after upload
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
      Alert.alert("Error", err.message || "Failed to add wine");
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
      <Text style={styles.title}>Add a Wine 🍷</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Country"
        value={country}
        onChangeText={setCountry}
      />
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
        style={styles.input}
        placeholder="Vintage (year)"
        keyboardType="numeric"
        value={vintage}
        onChangeText={setVintage}
      />

      <Text style={styles.label}>Type</Text>
      <Dropdown
        style={styles.dropdown}
        data={wineTypes}
        labelField="label"
        valueField="value"
        placeholder="Select type..."
        value={type}
        onChange={(item: WineTypeItem) => setType(item.value)}
        renderItem={renderItem}
      />

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
      {image?.uri && (
        <Image source={{ uri: image.uri }} style={styles.preview} />
      )}

      <Button
        title={loading ? "Saving..." : "Save Wine"}
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
