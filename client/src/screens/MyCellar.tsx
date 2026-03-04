import React, { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
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
import { colors, spacing, radii, fontSizes, getTypeColor } from "../theme";

type MyCellarScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "MyCellar">;
type Props = { navigation: MyCellarScreenNavigationProp; route: any };

const screenWidth = Dimensions.get("window").width;
const cardMargin = 8;
const cardWidth = (screenWidth - cardMargin * 4 - spacing.md * 2) / 3;

export default function MyCellar({ navigation, route }: Props) {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInsight, setEditingInsight] = useState<"drinkWindow" | "marketValue" | null>(null);
  const [editDrinkWindow, setEditDrinkWindow] = useState("");
  const [editMarketValue, setEditMarketValue] = useState("");
  const [savingInsight, setSavingInsight] = useState(false);

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

  function openModal(wine: Wine) {
    setSelectedWine(wine);
    setEditDrinkWindow(wine.drinkWindow ?? "");
    setEditMarketValue(wine.marketValue ?? "");
    setEditingInsight(null);
    setModalVisible(true);
  }

  async function saveInsight(field: "drinkWindow" | "marketValue") {
    if (!selectedWine) return;
    const newValue = field === "drinkWindow" ? editDrinkWindow : editMarketValue;
    const oldValue = field === "drinkWindow" ? selectedWine.drinkWindow : selectedWine.marketValue;
    if (newValue === (oldValue ?? "")) {
      setEditingInsight(null);
      return;
    }
    try {
      setSavingInsight(true);
      const formData = new FormData();
      formData.append("name", selectedWine.name);
      formData.append("country", selectedWine.country);
      formData.append("type", selectedWine.type);
      formData.append("drinkWindow", editDrinkWindow || "");
      formData.append("marketValue", editMarketValue || "");
      const updated = await wineApi.updateWine(selectedWine.id, formData);
      setSelectedWine(updated);
      setWines((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    } catch {
      Alert.alert("Error", "Failed to save insight");
    } finally {
      setSavingInsight(false);
      setEditingInsight(null);
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      fetchWines();
    }, [])
  );

  useEffect(() => {
    if (route.params?.refresh) fetchWines();
  }, [route.params?.refresh]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (wines.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No wines in your cellar yet</Text>
        <TouchableOpacity onPress={() => navigation.navigate("WineForm")} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Wine</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={wines}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openModal(item)}
          >
            <View style={styles.card}>
              <Image
                source={{ uri: item.imageUrl || "https://via.placeholder.com/150x200?text=Wine" }}
                style={styles.image}
                resizeMode="cover"
              />
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {item.winery || item.country}
              </Text>
              <Text style={styles.vintage}>{item.vintage ?? "---"}</Text>
              <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
                <Text style={styles.typeText}>{item.type}</Text>
              </View>
              {item.grapes ? (
                <Text style={styles.cardGrapes} numberOfLines={1}>{item.grapes}</Text>
              ) : null}
              {item.amount != null && (
                <View style={styles.amountBadge}>
                  <Text style={styles.amountText}>x{item.amount}</Text>
                </View>
              )}
              <View style={styles.aiInline}>
                <Text style={styles.aiInlineLabel} numberOfLines={1}>
                  {item.drinkWindow ?? "---"}
                </Text>
                <Text style={styles.aiInlineLabel} numberOfLines={1}>
                  {item.marketValue ?? "---"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("WineForm")}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedWine && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity style={styles.headerCloseBtn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.headerCloseBtnText}>X</Text>
                  </TouchableOpacity>
                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      style={styles.headerEditBtn}
                      onPress={() => { setModalVisible(false); navigation.navigate("WineForm", { wine: selectedWine }); }}
                    >
                      <Text style={styles.headerBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.headerDeleteBtn}
                      onPress={() => {
                        Alert.alert("Delete Wine", `Remove "${selectedWine.name}" from your cellar?`, [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                await wineApi.deleteWine(selectedWine.id);
                                setModalVisible(false);
                                setSelectedWine(null);
                                fetchWines();
                              } catch {
                                Alert.alert("Error", "Failed to delete wine");
                              }
                            },
                          },
                        ]);
                      }}
                    >
                      <Text style={styles.headerBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <ScrollView>
                  <Image
                    source={{ uri: selectedWine.imageUrl || "https://via.placeholder.com/300x400?text=Wine" }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.modalTitle}>{selectedWine.name}</Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Winery</Text>
                    <Text style={styles.detailValue}>{selectedWine.winery || "---"}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Country</Text>
                    <Text style={styles.detailValue}>{selectedWine.country}</Text>
                  </View>
                  {selectedWine.region ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Region</Text>
                      <Text style={styles.detailValue}>{selectedWine.region}</Text>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Vintage</Text>
                    <Text style={styles.detailValue}>{selectedWine.vintage ?? "---"}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>{selectedWine.type}</Text>
                  </View>
                  {selectedWine.amount != null ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount</Text>
                      <Text style={styles.detailValue}>
                        {selectedWine.amount} bottle{selectedWine.amount !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  ) : null}
                  {selectedWine.grapes ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Grapes</Text>
                      <Text style={styles.detailValue}>{selectedWine.grapes}</Text>
                    </View>
                  ) : null}
                  {selectedWine.notes ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Notes</Text>
                      <Text style={styles.detailValue}>{selectedWine.notes}</Text>
                    </View>
                  ) : null}

                  <Text style={styles.modalSubtitle}>AI Insights</Text>
                  <Text style={styles.insightHint}>Tap a value to edit</Text>
                  <View style={styles.aiBoxContainer}>
                    <TouchableOpacity
                      style={styles.aiBox}
                      onPress={() => setEditingInsight("drinkWindow")}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.aiLabel}>Drink Window</Text>
                      {editingInsight === "drinkWindow" ? (
                        <TextInput
                          style={styles.aiInput}
                          value={editDrinkWindow}
                          onChangeText={setEditDrinkWindow}
                          onBlur={() => saveInsight("drinkWindow")}
                          onSubmitEditing={() => saveInsight("drinkWindow")}
                          autoFocus
                          placeholder="e.g. 2020-2028"
                          placeholderTextColor={colors.textSecondary}
                        />
                      ) : (
                        <Text style={styles.aiValue}>
                          {savingInsight ? "..." : (selectedWine.drinkWindow || "---")}
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.aiBox}
                      onPress={() => setEditingInsight("marketValue")}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.aiLabel}>Market Value</Text>
                      {editingInsight === "marketValue" ? (
                        <TextInput
                          style={styles.aiInput}
                          value={editMarketValue}
                          onChangeText={setEditMarketValue}
                          onBlur={() => saveInsight("marketValue")}
                          onSubmitEditing={() => saveInsight("marketValue")}
                          autoFocus
                          placeholder="e.g. $45"
                          placeholderTextColor={colors.textSecondary}
                        />
                      ) : (
                        <Text style={styles.aiValue}>
                          {savingInsight ? "..." : (selectedWine.marketValue || "---")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  emptyText: { fontSize: fontSizes.subtitle, color: colors.textSecondary, marginBottom: spacing.lg },
  addButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radii.sm },
  addButtonText: { color: colors.background, fontSize: fontSizes.subtitle, fontWeight: "bold" },
  list: { padding: spacing.md, paddingTop: spacing.lg },
  row: { justifyContent: "flex-start", gap: cardMargin },
  card: {
    width: cardWidth,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginBottom: cardMargin * 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: "100%", aspectRatio: 3 / 4, borderRadius: radii.sm },
  name: { fontSize: fontSizes.small, fontWeight: "bold", marginTop: spacing.xs, textAlign: "center", color: colors.text },
  cardSub: { fontSize: fontSizes.caption, color: colors.textSecondary, textAlign: "center" },
  vintage: { fontSize: fontSizes.caption, color: colors.textSecondary, textAlign: "center" },
  typeBadge: {
    marginTop: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "center",
  },
  typeText: { fontSize: fontSizes.caption, color: colors.text, fontWeight: "bold" },
  cardGrapes: { fontSize: 9, color: colors.textSecondary, textAlign: "center", marginTop: 2 },
  amountBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  amountText: { fontSize: 10, fontWeight: "bold", color: colors.background },
  aiInline: {
    marginTop: spacing.xs,
    backgroundColor: colors.surfaceLight,
    borderRadius: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    gap: 1,
  },
  aiInlineLabel: { fontSize: 9, color: colors.textSecondary, textAlign: "center" },

  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 28, color: colors.background, fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: "100%",
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalImage: { width: "100%", aspectRatio: 3 / 4, borderRadius: radii.md, marginBottom: spacing.md },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCloseBtnText: { fontSize: 14, color: colors.textSecondary, fontWeight: "bold" },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  headerEditBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  headerDeleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.accent,
    borderRadius: 6,
  },
  headerBtnText: { color: colors.text, fontWeight: "bold", fontSize: 13 },
  modalTitle: { fontSize: fontSizes.title, fontWeight: "bold", color: colors.primary, marginBottom: spacing.sm },
  modalSubtitle: { fontSize: fontSizes.subtitle, fontWeight: "bold", color: colors.primary, marginTop: spacing.md },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: { fontWeight: "bold", color: colors.textSecondary, fontSize: fontSizes.body },
  detailValue: { color: colors.text, fontSize: fontSizes.body, flex: 1, textAlign: "right" },
  aiBoxContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm, gap: spacing.sm },
  aiBox: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.sm,
    padding: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiLabel: { fontSize: fontSizes.small, color: colors.textSecondary, marginBottom: spacing.xs },
  aiValue: { fontSize: fontSizes.body, fontWeight: "bold", color: colors.primary },
  aiInput: {
    fontSize: fontSizes.body,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    padding: 0,
    minWidth: 80,
  },
  insightHint: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
});
