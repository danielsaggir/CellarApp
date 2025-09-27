import React, { useState } from "react";
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
import config from "./config";

export default function WineForm() {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [producer, setProducer] = useState("");
  const [vintage, setVintage] = useState("");
  const [type, setType] = useState("");
  const [image, setImage] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const result = await launchImageLibrary({ mediaType: "photo", quality: 1 });
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
      formData.append("region", region);
      formData.append("producer", producer);
      formData.append("vintage", vintage);
      formData.append("type", type.toUpperCase());

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
        headers: { Authorization: `Bearer ${token}` }, // אל תגדיר Content-Type ידנית עם boundary
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add wine");
      }

      Alert.alert("Success", "Wine added!");
      setName("");
      setCountry("");
      setRegion("");
      setProducer("");
      setVintage("");
      setType("");
      setImage(null);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to add wine");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add a Wine 🍷</Text>
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Country" value={country} onChangeText={setCountry} />
      <TextInput style={styles.input} placeholder="Region" value={region} onChangeText={setRegion} />
      <TextInput style={styles.input} placeholder="Producer" value={producer} onChangeText={setProducer} />
      <TextInput style={styles.input} placeholder="Vintage (year)" keyboardType="numeric" value={vintage} onChangeText={setVintage} />
      <TextInput style={styles.input} placeholder='Type (RED/WHITE/SPARKLING/ORANGE/ROSE)' value={type} onChangeText={setType} />

      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        <Text style={styles.imagePickerText}>{image ? "Change Image" : "Pick an Image"}</Text>
      </TouchableOpacity>
      {image?.uri && <Image source={{ uri: image.uri }} style={styles.preview} />}

      <Button title={loading ? "Saving..." : "Save Wine"} onPress={handleSubmit} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  imagePicker: {
    backgroundColor: "#2980b9",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  imagePickerText: { color: "#fff" },
  preview: { width: 120, height: 160, marginBottom: 10, alignSelf: "center", borderRadius: 8 },
});
