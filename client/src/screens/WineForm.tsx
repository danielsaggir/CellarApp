import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "./config";

type Wine = {
  id: string;
  name: string;
  country: string;
  region?: string;
  producer?: string;
  vintage: number;
  type: string;
  imageUrl?: string;
};

export default function MyCellar() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  async function fetchWines() {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${config.API_URL}/wines`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error("Failed to fetch wines");
        return;
      }
      const data = await res.json();
      setWines(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchWines();
  }, []);

  function openWine(wine: Wine) {
    setSelectedWine(wine);
    setModalVisible(true);
  }

  function closeModal() {
    setSelectedWine(null);
    setModalVisible(false);
  }

  async function handleDelete(id: string) {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${config.API_URL}/wines/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        Alert.alert("Error", "Failed to delete wine");
        return;
      }

      setWines((prev) => prev.filter((w) => w.id !== id));
      closeModal();
    } catch (err) {
      console.error(err);
    }
  }

  const renderWine = ({ item }: { item: Wine }) => (
    <TouchableOpacity style={styles.card} onPress={() => openWine(item)}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.noImage]}>
          <Text style={{ color: "#999" }}>No Image</Text>
        </View>
      )}
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardSubtitle}>
        {item.country} • {item.vintage}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {wines.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No wines yet 🍷</Text>
        </View>
      ) : (
        <FlatList
          data={wines}
          keyExtractor={(item) => item.id}
          renderItem={renderWine}
          numColumns={3} // 👈 שלוש כרטיסיות בשורה
          columnWrapperStyle={styles.row} // 👈 פה נדרש ה־row
        />
      )}

      {/* Modal להצגת יין */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedWine && (
              <ScrollView>
                {selectedWine.imageUrl && (
                  <Image
                    source={{ uri: selectedWine.imageUrl }}
                    style={styles.modalImage}
                  />
                )}
                <Text style={styles.modalTitle}>{selectedWine.name}</Text>
                <Text style={styles.modalText}>
                  {selectedWine.country} • {selectedWine.vintage}
                </Text>
                {selectedWine.region && (
                  <Text style={styles.modalText}>
                    Region: {selectedWine.region}
                  </Text>
                )}
                {selectedWine.producer && (
                  <Text style={styles.modalText}>
                    Producer: {selectedWine.producer}
                  </Text>
                )}
                <Text style={styles.modalText}>Type: {selectedWine.type}</Text>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(selectedWine.id)}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Delete
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    elevation: 3,
  },
  cardImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  noImage: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { fontWeight: "bold", fontSize: 14, textAlign: "center" },
  cardSubtitle: { fontSize: 12, color: "#666", textAlign: "center" },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  modalImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  modalText: { fontSize: 16, marginBottom: 4 },
  deleteButton: {
    backgroundColor: "#d32f2f",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  closeButton: {
    backgroundColor: "#666",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: { color: "#fff", fontWeight: "bold" },

  // 👇 מה שהיה חסר
  row: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
