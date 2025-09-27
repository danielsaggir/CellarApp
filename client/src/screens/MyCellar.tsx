import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../App";
import config from "./config"; // 👈 שימוש ב־config

type MyCellarScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MyCellar"
>;
type Props = { navigation: MyCellarScreenNavigationProp };

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

const screenWidth = Dimensions.get("window").width;
const cardMargin = 10;
const cardWidth = (screenWidth - cardMargin * 4) / 3;

export default function MyCellar({ navigation }: Props) {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    async function fetchWines() {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          return;
        }

        const res = await fetch(`${config.API_URL}/wines/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 401) {
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          } else {
            Alert.alert("Error", "Failed to load wines");
          }
          return;
        }

        const data: Wine[] = await res.json();
        setWines(data);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchWines();
  }, [navigation]);

  async function analyzeWine(wine: Wine) {
    try {
      setAiLoading(true);
      setAiResult(null);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const res = await fetch(`${config.API_URL}/wines/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ wineId: wine.id }),
      });

      if (!res.ok) {
        throw new Error("AI request failed");
      }

      const data = await res.json();
      setAiResult(data.analysis);
    } catch (err) {
      console.error("AI error:", err);
      setAiResult("❌ Failed to analyze wine");
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2575fc" />
      </View>
    );
  }

  if (wines.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No wines in your cellar yet 🍷</Text>
        {/* כפתור להוספת יין */}
        <TouchableOpacity
          onPress={() => navigation.navigate("WineForm")}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ Add Wine</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={wines}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.list, { paddingTop: 20 }]}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedWine(item);
              setModalVisible(true);
              analyzeWine(item);
            }}
          >
            <View style={styles.card}>
              <Image
                source={{
                  uri:
                    item.imageUrl ||
                    "https://via.placeholder.com/150x200?text=Wine",
                }}
                style={styles.image}
                resizeMode="cover"
              />
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.vintage}>{item.vintage}</Text>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: getTypeColor(item.type) },
                ]}
              >
                <Text style={styles.typeText}>{item.type}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Floating + Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("WineForm")}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Modal with wine details + AI insights */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedWine && (
              <ScrollView>
                <Image
                  source={{
                    uri:
                      selectedWine.imageUrl ||
                      "https://via.placeholder.com/300x400?text=Wine",
                  }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                <Text style={styles.modalTitle}>{selectedWine.name}</Text>
                <Text>{selectedWine.producer || "Unknown Producer"}</Text>
                <Text>
                  {selectedWine.region
                    ? `${selectedWine.region}, ${selectedWine.country}`
                    : selectedWine.country}
                </Text>
                <Text>Vintage: {selectedWine.vintage}</Text>
                <Text>Type: {selectedWine.type}</Text>

                <Text style={styles.modalSubtitle}>🍷 AI Insights:</Text>
                {aiLoading ? (
                  <ActivityIndicator size="small" color="#2575fc" />
                ) : (
                  <Text>{aiResult}</Text>
                )}

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
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

function getTypeColor(type: string): string {
  switch (type) {
    case "RED":
      return "#b71c1c";
    case "WHITE":
      return "#fbc02d";
    case "SPARKLING":
      return "#0288d1";
    case "ORANGE":
      return "#f57c00";
    case "ROSE":
      return "#ec407a";
    default:
      return "#757575";
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: "#555", marginBottom: 20 },
  addButton: {
    backgroundColor: "#2575fc",
    padding: 12,
    borderRadius: 10,
  },
  addButtonText: { color: "#fff", fontSize: 16 },
  list: { padding: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 8,
  },
  name: { fontSize: 12, fontWeight: "bold", marginTop: 6, textAlign: "center" },
  vintage: { fontSize: 11, color: "#666" },
  typeBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: { fontSize: 10, color: "#fff", fontWeight: "bold" },

  // FAB (Floating Action Button)
  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#00c853",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  fabText: { fontSize: 28, color: "#fff", fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
  },
  modalImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  modalSubtitle: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  closeButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#d32f2f",
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: { color: "#fff", fontWeight: "bold" },
});
