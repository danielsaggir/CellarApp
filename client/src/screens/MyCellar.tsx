import React, { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, Wine } from "../types";
import { wineApi, ApiError } from "../services/api";

type MyCellarScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MyCellar"
>;
type Props = { navigation: MyCellarScreenNavigationProp; route: any };

const screenWidth = Dimensions.get("window").width;
const cardMargin = 10;
const cardWidth = (screenWidth - cardMargin * 4) / 3;

export default function MyCellar({ navigation, route }: Props) {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  async function fetchWines() {
    try {
      setLoading(true);
      const data = await wineApi.getMyWines();
      setWines(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigation.reset({ index: 0, routes: [{ name: "Login" as const }] });
      } else {
        console.error(err);
        Alert.alert("Error", "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      fetchWines();
    }, [])
  );

  useEffect(() => {
    if (route.params?.refresh) {
      fetchWines();
    }
  }, [route.params?.refresh]);

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
              // ❌ הוסרה הקריאה המיותרת ל-analyzeWine
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
              <Text style={styles.vintage}>{item.vintage ?? "-"}</Text>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: getTypeColor(item.type) },
                ]}
              >
                <Text style={styles.typeText}>{item.type}</Text>
              </View>

              {/* ✅ מציגים גם בכרטיס את תובנות ה-AI */}
              <View style={styles.aiInline}>
                <Text style={styles.aiInlineLabel} numberOfLines={1}>
                  🕰️ {item.drinkWindow ?? "—"}
                </Text>
                <Text style={styles.aiInlineLabel} numberOfLines={1}>
                  💰 {item.marketValue ?? "—"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("WineForm")}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

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
                <Text>Vintage: {selectedWine.vintage ?? "-"}</Text>
                <Text>Type: {selectedWine.type}</Text>

                <Text style={styles.modalSubtitle}>🍷 AI Insights:</Text>
                <View style={styles.aiBoxContainer}>
                  <View style={styles.aiBox}>
                    <Text style={styles.aiLabel}>Drink Window</Text>
                    <Text style={styles.aiValue}>
                      {selectedWine.drinkWindow || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.aiBox}>
                    <Text style={styles.aiLabel}>Market Value</Text>
                    <Text style={styles.aiValue}>
                      {selectedWine.marketValue || "N/A"}
                    </Text>
                  </View>
                </View>

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
  addButton: { backgroundColor: "#2575fc", padding: 12, borderRadius: 10 },
  addButtonText: { color: "#fff", fontSize: 16 },
  list: { padding: 20 },
  row: { flex: 1, flexDirection: "row", justifyContent: "space-between" },
  card: {
    width: cardWidth,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: { width: "100%", aspectRatio: 3 / 4, borderRadius: 8 },
  name: { fontSize: 12, fontWeight: "bold", marginTop: 6, textAlign: "center" },
  vintage: { fontSize: 11, color: "#666", textAlign: "center" },
  typeBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "center",
  },
  typeText: { fontSize: 10, color: "#fff", fontWeight: "bold" },

  aiInline: {
    marginTop: 6,
    backgroundColor: "#f7f9fb",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 2,
  },
  aiInlineLabel: {
    fontSize: 10,
    color: "#333",
    textAlign: "center",
  },

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
  aiBoxContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  aiBox: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
    alignItems: "center",
  },
  aiLabel: { fontSize: 12, color: "#555", marginBottom: 4 },
  aiValue: { fontSize: 14, fontWeight: "bold", color: "#222" },
  closeButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#d32f2f",
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: { color: "#fff", fontWeight: "bold" },
});
