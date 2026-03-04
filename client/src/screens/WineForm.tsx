import React, { useState, useRef, useEffect } from "react";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  Animated,
} from "react-native";
import { launchImageLibrary, launchCamera, Asset } from "react-native-image-picker";
import { Dropdown } from "react-native-element-dropdown";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { RootStackParamList, WineTypeItem, ScannedWine, WineInsights } from "../types";
import { wineApi } from "../services/api";
import { colors, spacing, radii, fontSizes } from "../theme";

type WineFormRouteProp = RouteProp<RootStackParamList, "WineForm">;
type ScanState = "match" | "partial" | "failed";

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
  const [drinkWindow, setDrinkWindow] = useState(editingWine?.drinkWindow ?? "");
  const [marketValue, setMarketValue] = useState(editingWine?.marketValue ?? "");
  const [image, setImage] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [scanResult, setScanResult] = useState<ScannedWine | null>(null);
  const [scanAsset, setScanAsset] = useState<Asset | null>(null);
  const [showScanPreview, setShowScanPreview] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [previewAmount, setPreviewAmount] = useState("1");
  const [previewInsights, setPreviewInsights] = useState<WineInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [previewDrinkWindow, setPreviewDrinkWindow] = useState("");
  const [previewMarketValue, setPreviewMarketValue] = useState("");

  const animScale = useRef(new Animated.Value(0)).current;
  const animPulse = useRef(new Animated.Value(0.5)).current;
  const animShake = useRef(new Animated.Value(0)).current;

  const wineTypes: WineTypeItem[] = [
    { label: "Red", value: "RED", color: "#8b2252" },
    { label: "White", value: "WHITE", color: "#c9a84c" },
    { label: "Rose", value: "ROSE", color: "#c46b8a" },
    { label: "Sparkling", value: "SPARKLING", color: "#4a90a4" },
    { label: "Orange", value: "ORANGE", color: "#bf6a30" },
  ];

  function hasAllRequired(s: ScannedWine): boolean {
    return !!(s.name && s.country && s.type);
  }

  function hasAnyData(s: ScannedWine): boolean {
    return !!(s.name || s.country || s.region || s.winery || s.vintage || s.type || s.grapes);
  }

  function getScanState(): ScanState {
    if (!scanResult || !hasAnyData(scanResult)) return "failed";
    return hasAllRequired(scanResult) ? "match" : "partial";
  }

  useEffect(() => {
    if (!showScanPreview) return;
    const state = getScanState();
    animScale.setValue(0);
    animPulse.setValue(0.5);
    animShake.setValue(0);

    if (state === "match") {
      Animated.spring(animScale, {
        toValue: 1,
        friction: 3,
        tension: 80,
        useNativeDriver: true,
      }).start();
    } else if (state === "partial") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(animPulse, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      Animated.sequence([
        Animated.timing(animShake, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(animShake, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(animShake, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(animShake, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(animShake, { toValue: 4, duration: 60, useNativeDriver: true }),
        Animated.timing(animShake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [showScanPreview, scanResult]);

  async function fetchPreviewInsights(scanned: ScannedWine) {
    if (!scanned.name || !scanned.country || !scanned.type) return;
    try {
      setInsightsLoading(true);
      const insights = await wineApi.previewInsights({
        name: scanned.name,
        country: scanned.country,
        type: scanned.type,
        region: scanned.region || undefined,
        winery: scanned.winery || undefined,
        vintage: scanned.vintage || undefined,
      });
      setPreviewInsights(insights);
      setPreviewDrinkWindow(insights.drinkWindow ?? "");
      setPreviewMarketValue(insights.marketValue ?? "");
    } catch {
      setPreviewInsights(null);
    } finally {
      setInsightsLoading(false);
    }
  }

  async function pickImage() {
    const result = await launchImageLibrary({ mediaType: "photo", quality: 1 });
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
      if (isNaN(v) || v < 1800 || v > 2100)
        next.vintage = "Vintage must be between 1800 and 2100";
    }
    if (amount) {
      const a = parseInt(amount, 10);
      if (isNaN(a) || a < 0) next.amount = "Amount must be a positive number";
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

      setScanAsset(asset);
      setScanResult(scanned);
      setPreviewAmount("1");
      setPreviewInsights(null);
      setPreviewDrinkWindow("");
      setPreviewMarketValue("");
      setShowScanPreview(true);

      if (hasAnyData(scanned)) {
        fetchPreviewInsights(scanned);
      }
    } catch (err: any) {
      Alert.alert("Scan Failed", err.message || "Could not scan the wine label");
    } finally {
      setScanning(false);
    }
  }

  function dismissScan() {
    setShowScanPreview(false);
    setScanResult(null);
    setScanAsset(null);
    setPreviewInsights(null);
  }

  function handleFillDetails() {
    if (scanResult) {
      if (scanResult.name) setName(scanResult.name);
      if (scanResult.country) setCountry(scanResult.country);
      if (scanResult.region) setRegion(scanResult.region);
      if (scanResult.winery) setWinery(scanResult.winery);
      if (scanResult.vintage) setVintage(String(scanResult.vintage));
      if (scanResult.type) setType(scanResult.type);
      if (scanResult.grapes) setGrapes(scanResult.grapes);
    }
    if (previewDrinkWindow) setDrinkWindow(previewDrinkWindow);
    if (previewMarketValue) setMarketValue(previewMarketValue);
    if (previewAmount) setAmount(previewAmount);
    if (scanAsset) setImage(scanAsset);
    setShowScanPreview(false);
    setScanResult(null);
    setScanAsset(null);
    setPreviewInsights(null);
  }

  function handleFillManually() {
    if (scanAsset) setImage(scanAsset);
    setShowScanPreview(false);
    setScanResult(null);
    setScanAsset(null);
    setPreviewInsights(null);
  }

  async function handleMatch() {
    if (!scanResult || !scanAsset) return;
    try {
      setMatchLoading(true);
      const formData = new FormData();
      formData.append("name", scanResult.name!);
      formData.append("country", scanResult.country!);
      formData.append("type", scanResult.type!);
      if (scanResult.region) formData.append("region", scanResult.region);
      if (scanResult.winery) formData.append("winery", scanResult.winery);
      if (scanResult.vintage) formData.append("vintage", String(scanResult.vintage));
      if (scanResult.grapes) formData.append("grapes", scanResult.grapes);
      if (previewAmount) formData.append("amount", previewAmount);
      if (previewDrinkWindow) formData.append("drinkWindow", previewDrinkWindow);
      if (previewMarketValue) formData.append("marketValue", previewMarketValue);

      formData.append("image", {
        uri: scanAsset.uri,
        name: scanAsset.fileName || `scan_${Date.now()}.jpg`,
        type: scanAsset.type || "image/jpeg",
      } as any);

      await wineApi.createWine(formData);
      setShowScanPreview(false);
      setScanResult(null);
      setScanAsset(null);
      setPreviewInsights(null);
      Alert.alert("Success", "Wine added to your cellar!");
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add wine");
    } finally {
      setMatchLoading(false);
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
      if (drinkWindow) formData.append("drinkWindow", drinkWindow);
      if (marketValue) formData.append("marketValue", marketValue);

      if (image?.uri) {
        formData.append("image", {
          uri: image.uri,
          name: image.fileName || `wine_${Date.now()}.jpg`,
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
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save wine");
    } finally {
      setLoading(false);
    }
  }

  const renderDropdownItem = (item: WineTypeItem) => (
    <View style={styles.dropdownItem}>
      <View style={[styles.colorBadge, { backgroundColor: item.color }]} />
      <Text style={styles.dropdownText}>{item.label}</Text>
    </View>
  );

  const scanPreviewFields = scanResult
    ? [
        { label: "Name", value: scanResult.name },
        { label: "Country", value: scanResult.country },
        { label: "Region", value: scanResult.region },
        { label: "Winery", value: scanResult.winery },
        { label: "Vintage", value: scanResult.vintage ? String(scanResult.vintage) : null },
        { label: "Type", value: scanResult.type },
        { label: "Grapes", value: scanResult.grapes },
      ]
    : [];

  const scanState = getScanState();
  const canMatch = scanState === "match";

  function renderScanAnimation() {
    if (scanState === "match") {
      return (
        <Animated.View style={[styles.animContainer, { transform: [{ scale: animScale }] }]}>
          <Icon name="check-circle" size={48} color="#4CAF50" />
          <Text style={styles.animMatchTitle}>It's a Match!</Text>
        </Animated.View>
      );
    }
    if (scanState === "partial") {
      return (
        <Animated.View style={[styles.animContainer, { opacity: animPulse }]}>
          <Icon name="information" size={48} color={colors.primary} />
          <Text style={styles.animPartialTitle}>Almost There</Text>
          <Text style={styles.previewNote}>
            We couldn't capture all the details. You can fill in the rest manually or try scanning again.
          </Text>
        </Animated.View>
      );
    }
    return (
      <Animated.View style={[styles.animContainer, { transform: [{ translateX: animShake }] }]}>
        <Icon name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.animFailedTitle}>Scan Failed</Text>
        <Text style={styles.previewNote}>
          Could not read the label. Please try again with a clearer photo or fill in the details manually.
        </Text>
      </Animated.View>
    );
  }

  function renderPreviewModal() {
    const isFailed = scanState === "failed";

    return (
      <Modal visible={showScanPreview} animationType="fade" transparent>
        <View style={styles.previewOverlay}>
          <View style={styles.previewCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderScanAnimation()}

              {scanAsset?.uri && (
                <Image source={{ uri: scanAsset.uri }} style={styles.scanPhoto} resizeMode="cover" />
              )}

              {!isFailed && scanPreviewFields.map((f) => (
                <View key={f.label} style={styles.previewRow}>
                  <Text style={styles.previewLabel}>{f.label}</Text>
                  <Text style={[styles.previewValue, !f.value && styles.previewMissing]}>
                    {f.value ?? "Not detected"}
                  </Text>
                </View>
              ))}

              {!isFailed && (
                <View style={styles.amountRow}>
                  <Text style={styles.previewLabel}>Bottles</Text>
                  <View style={styles.amountControls}>
                    <TouchableOpacity
                      style={styles.amountBtn}
                      onPress={() => setPreviewAmount(String(Math.max(1, parseInt(previewAmount, 10) - 1 || 1)))}
                    >
                      <Text style={styles.amountBtnText}>-</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.amountInput}
                      value={previewAmount}
                      onChangeText={setPreviewAmount}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      style={styles.amountBtn}
                      onPress={() => setPreviewAmount(String((parseInt(previewAmount, 10) || 0) + 1))}
                    >
                      <Text style={styles.amountBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {!isFailed && (
                <View style={styles.aiSection}>
                  <Text style={styles.aiSectionTitle}>AI Insights</Text>
                  {insightsLoading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} />
                  ) : previewInsights ? (
                    <View style={styles.aiBoxContainer}>
                      <View style={styles.aiBox}>
                        <Text style={styles.aiBoxLabel}>Drink Window</Text>
                        <TextInput
                          style={styles.aiBoxInput}
                          value={previewDrinkWindow}
                          onChangeText={setPreviewDrinkWindow}
                          placeholder="---"
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>
                      <View style={styles.aiBox}>
                        <Text style={styles.aiBoxLabel}>Market Value</Text>
                        <TextInput
                          style={styles.aiBoxInput}
                          value={previewMarketValue}
                          onChangeText={setPreviewMarketValue}
                          placeholder="---"
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.aiBoxMissing}>Insights unavailable for this scan</Text>
                  )}
                </View>
              )}

              <View style={styles.previewActions}>
                {canMatch && (
                  <TouchableOpacity
                    style={styles.previewMatchBtn}
                    onPress={handleMatch}
                    disabled={matchLoading}
                  >
                    {matchLoading ? (
                      <ActivityIndicator color={colors.background} size="small" />
                    ) : (
                      <Text style={styles.previewMatchText}>Add to Cellar</Text>
                    )}
                  </TouchableOpacity>
                )}

                {!isFailed && (
                  <TouchableOpacity
                    style={canMatch ? styles.previewFillBtn : styles.previewMatchBtn}
                    onPress={handleFillDetails}
                  >
                    <Text style={canMatch ? styles.previewFillText : styles.previewMatchText}>
                      Fill More Details
                    </Text>
                  </TouchableOpacity>
                )}

                {isFailed && (
                  <TouchableOpacity style={styles.previewMatchBtn} onPress={handleFillManually}>
                    <Text style={styles.previewMatchText}>Fill Manually</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.previewRetakeBtn} onPress={dismissScan}>
                  <Text style={styles.previewRetakeText}>Retake</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{isEditing ? "Edit Wine" : "Add a Wine"}</Text>

        {!isEditing && (
          <TouchableOpacity style={styles.scanButton} onPress={handleScanLabel} disabled={scanning}>
            {scanning ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={styles.scanButtonText}>Scan Wine Label</Text>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Wine Name *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="e.g. Chateau Margaux"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={(v) => { setName(v); clearError("name"); }}
        />
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

        <Text style={styles.label}>Country of Origin *</Text>
        <TextInput
          style={[styles.input, errors.country && styles.inputError]}
          placeholder="e.g. France"
          placeholderTextColor={colors.textSecondary}
          value={country}
          onChangeText={(v) => { setCountry(v); clearError("country"); }}
        />
        {errors.country ? <Text style={styles.errorText}>{errors.country}</Text> : null}

        <Text style={styles.label}>Region</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Bordeaux, Napa Valley"
          placeholderTextColor={colors.textSecondary}
          value={region}
          onChangeText={setRegion}
        />

        <Text style={styles.label}>Winery</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Domaine de la Romanee-Conti"
          placeholderTextColor={colors.textSecondary}
          value={winery}
          onChangeText={setWinery}
        />

        <Text style={styles.label}>Vintage (year)</Text>
        <TextInput
          style={[styles.input, errors.vintage && styles.inputError]}
          placeholder="e.g. 2018"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={vintage}
          onChangeText={(v) => { setVintage(v); clearError("vintage"); }}
        />
        {errors.vintage ? <Text style={styles.errorText}>{errors.vintage}</Text> : null}

        <Text style={styles.label}>Wine Type *</Text>
        <Dropdown
          style={[styles.dropdown, errors.type && styles.inputError]}
          containerStyle={{ backgroundColor: colors.surface, borderColor: colors.border }}
          itemTextStyle={{ color: colors.text }}
          selectedTextStyle={{ color: colors.text }}
          placeholderStyle={{ color: colors.textSecondary }}
          activeColor={colors.surfaceLight}
          data={wineTypes}
          labelField="label"
          valueField="value"
          placeholder="Select type..."
          value={type}
          onChange={(item: WineTypeItem) => { setType(item.value); clearError("type"); }}
          renderItem={renderDropdownItem}
        />
        {errors.type ? <Text style={styles.errorText}>{errors.type}</Text> : null}

        <Text style={styles.label}>Amount (bottles)</Text>
        <TextInput
          style={[styles.input, errors.amount && styles.inputError]}
          placeholder="e.g. 6"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={amount}
          onChangeText={(v) => { setAmount(v); clearError("amount"); }}
        />
        {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}

        <Text style={styles.label}>Grape Varieties</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Cabernet Sauvignon, Merlot"
          placeholderTextColor={colors.textSecondary}
          value={grapes}
          onChangeText={setGrapes}
        />

        <Text style={styles.label}>Personal Notes</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: "top" }]}
          placeholder="Your tasting notes, thoughts..."
          placeholderTextColor={colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {isEditing && (
          <>
            <Text style={[styles.label, { marginTop: spacing.md }]}>AI Insights</Text>
            <Text style={styles.sublabel}>Drink Window</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2020-2028"
              placeholderTextColor={colors.textSecondary}
              value={drinkWindow}
              onChangeText={setDrinkWindow}
            />
            <Text style={styles.sublabel}>Market Value</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. $45"
              placeholderTextColor={colors.textSecondary}
              value={marketValue}
              onChangeText={setMarketValue}
            />
          </>
        )}

        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          <Text style={styles.imagePickerText}>{image ? "Change Image" : "Pick an Image"}</Text>
        </TouchableOpacity>
        {image?.uri ? (
          <Image source={{ uri: image.uri }} style={styles.preview} />
        ) : isEditing && editingWine?.imageUrl ? (
          <Image source={{ uri: editingWine.imageUrl }} style={styles.preview} />
        ) : null}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text style={styles.submitText}>
              {isEditing ? "Update Wine" : "Save Wine"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {renderPreviewModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: {
    fontSize: fontSizes.title,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  scanButton: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: radii.sm,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  scanButtonText: { color: colors.text, fontWeight: "bold", fontSize: fontSizes.subtitle },
  label: {
    fontSize: fontSizes.body,
    color: colors.primary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
    fontWeight: "600",
  },
  sublabel: {
    fontSize: fontSizes.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
    color: colors.text,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    borderRadius: radii.sm,
    fontSize: fontSizes.body,
  },
  dropdown: {
    height: 44,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceLight,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  dropdownText: { fontSize: fontSizes.body, color: colors.text },
  colorBadge: { width: 14, height: 14, borderRadius: 7, marginRight: spacing.sm },
  inputError: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: fontSizes.small, marginBottom: spacing.sm, marginTop: -4 },
  imagePicker: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    alignItems: "center",
  },
  imagePickerText: { color: colors.primary, fontWeight: "600" },
  preview: {
    width: 120,
    height: 160,
    marginBottom: spacing.md,
    alignSelf: "center",
    borderRadius: radii.sm,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radii.sm,
    alignItems: "center",
    marginTop: spacing.md,
  },
  submitText: { color: colors.background, fontWeight: "bold", fontSize: fontSizes.subtitle },

  previewOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: "100%",
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  animContainer: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  animMatchTitle: {
    fontSize: fontSizes.title,
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: spacing.xs,
  },
  animPartialTitle: {
    fontSize: fontSizes.title,
    fontWeight: "bold",
    color: colors.primary,
    marginTop: spacing.xs,
  },
  animFailedTitle: {
    fontSize: fontSizes.title,
    fontWeight: "bold",
    color: colors.error,
    marginTop: spacing.xs,
  },
  scanPhoto: {
    width: "100%",
    height: 140,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
  },
  previewNote: {
    color: colors.textSecondary,
    fontSize: fontSizes.small,
    textAlign: "center",
    marginTop: spacing.xs,
    fontStyle: "italic",
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  previewLabel: { color: colors.textSecondary, fontSize: fontSizes.body, fontWeight: "600" },
  previewValue: { color: colors.text, fontSize: fontSizes.body, flex: 1, textAlign: "right" },
  previewMissing: { color: colors.textSecondary, fontStyle: "italic" },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  amountControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  amountBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  amountBtnText: { color: colors.primary, fontSize: 18, fontWeight: "bold" },
  amountInput: {
    width: 48,
    textAlign: "center",
    color: colors.text,
    fontSize: fontSizes.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceLight,
    paddingVertical: 4,
  },
  aiSection: {
    marginTop: spacing.md,
  },
  aiSectionTitle: {
    fontSize: fontSizes.subtitle,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  aiBoxContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  aiBox: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.sm,
    padding: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiBoxLabel: { fontSize: fontSizes.small, color: colors.textSecondary, marginBottom: spacing.xs },
  aiBoxInput: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: fontSizes.body,
    textAlign: "center",
    padding: 0,
    minWidth: 60,
  },
  aiBoxMissing: {
    color: colors.textSecondary,
    fontSize: fontSizes.small,
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: spacing.sm,
  },
  previewActions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  previewMatchBtn: {
    padding: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  previewMatchText: { color: colors.background, fontWeight: "bold", fontSize: fontSizes.subtitle },
  previewFillBtn: {
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
  },
  previewFillText: { color: colors.primary, fontWeight: "bold", fontSize: fontSizes.body },
  previewRetakeBtn: {
    padding: spacing.sm + 2,
    alignItems: "center",
  },
  previewRetakeText: { color: colors.textSecondary, fontWeight: "600", fontSize: fontSizes.body },
});
