import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';

// --- Sample On-Device Database Recipes ---
const EMBEDDED_RECIPES = [
  {
    id: 1,
    cartridge: ".308 Winchester",
    bullet: "Sierra MatchKing HPBT (168gr)",
    powder: "IMR I4064",
    primer: "Federal 210M Large Rifle",
    testBarrel: 24.0,
    publishedCOAL: 2.800,
    minCharge: 41.5,
    minFPS: 2450,
    maxCharge: 45.0,
    maxFPS: 2700,
    burnRateClass: "rifle_medium"
  },
  {
    id: 2,
    cartridge: ".308 Winchester",
    bullet: "Sierra MatchKing HPBT (168gr)",
    powder: "Hodgdon Varget",
    primer: "CCI No. 200 Large Rifle",
    testBarrel: 24.0,
    publishedCOAL: 2.800,
    minCharge: 42.0,
    minFPS: 2520,
    maxCharge: 46.0,
    maxFPS: 2730,
    burnRateClass: "rifle_medium"
  },
  {
    id: 3,
    cartridge: "9mm Luger",
    bullet: "Speer TMJ RN (115gr)",
    powder: "Hodgdon Titegroup",
    primer: "CCI No. 500 Small Pistol",
    testBarrel: 4.0,
    publishedCOAL: 1.100,
    minCharge: 3.9,
    minFPS: 1058,
    maxCharge: 4.3,
    maxFPS: 1151,
    burnRateClass: "pistol"
  }
];

export default function App() {
  const [selectedRecipe, setSelectedRecipe] = useState(EMBEDDED_RECIPES[0]);
  const [barrelLength, setBarrelLength] = useState("18.0");
  const [targetCoal, setTargetCoal] = useState("2.780");
  const [stepCount, setStepCount] = useState(5);
  const [ladder, setLadder] = useState([]);
  const [coalWarning, setCoalWarning] = useState(null);
  const [chronoLogs, setChronoLogs] = useState({});

  // Re-calculate ladder whenever inputs or selected recipe change
  useEffect(() => {
    generateLadder();
  }, [selectedRecipe, barrelLength, targetCoal, stepCount]);

  const generateLadder = () => {
    const userBarrel = parseFloat(barrelLength) || selectedRecipe.testBarrel;
    const userCoalVal = parseFloat(targetCoal) || selectedRecipe.publishedCOAL;

    // 1. COAL Safety Alert Check
    if (userCoalVal < selectedRecipe.publishedCOAL) {
      const diff = (selectedRecipe.publishedCOAL - userCoalVal).toFixed(3);
      setCoalWarning(
        `WARNING: Seating depth is ${diff}" deeper than published COAL (${selectedRecipe.publishedCOAL}"). Internal volume is reduced, spiking peak chamber pressure. Reduce starting charge!`
      );
    } else {
      setCoalWarning(null);
    }

    // 2. Fraser Expansion Velocity Scaling
    const expMap = { pistol: 0.15, rifle_medium: 0.22, rifle_slow: 0.29 };
    const n = expMap[selectedRecipe.burnRateClass] || 0.22;
    const scaleFactor = Math.pow(userBarrel / selectedRecipe.testBarrel, n);

    const minScaledFPS = selectedRecipe.minFPS * scaleFactor;
    const maxScaledFPS = selectedRecipe.maxFPS * scaleFactor;

    // 3. Compute Ladder Steps
    const chargeInc = (selectedRecipe.maxCharge - selectedRecipe.minCharge) / (stepCount - 1);
    const fpsInc = (maxScaledFPS - minScaledFPS) / (stepCount - 1);

    const newLadder = [];
    for (let i = 0; i < stepCount; i++) {
      const charge = selectedRecipe.minCharge + (chargeInc * i);
      const estFPS = minScaledFPS + (fpsInc * i);
      newLadder.push({
        step: i + 1,
        charge: charge.toFixed(1),
        estFPS: Math.round(estFPS),
        isMax: i === stepCount - 1
      });
    }
    setLadder(newLadder);
  };

  const updateChronoLog = (stepNumber, text) => {
    setChronoLogs(prev => ({ ...prev, [stepNumber]: text }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>APEX AMC</Text>
          <Text style={styles.headerSubtitle}>Offline Reloading & Ladder Engine</Text>
        </View>

        {/* Recipe Selection */}
        <Text style={styles.sectionTitle}>Select Load Recipe</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recipeRow}>
          {EMBEDDED_RECIPES.map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              style={[
                styles.recipeCard,
                selectedRecipe.id === recipe.id && styles.recipeCardActive
              ]}
              onPress={() => {
                setSelectedRecipe(recipe);
                setTargetCoal(recipe.publishedCOAL.toString());
              }}
            >
              <Text style={styles.recipeCartridge}>{recipe.cartridge}</Text>
              <Text style={styles.recipeDetails}>{recipe.bullet}</Text>
              <Text style={styles.recipePowder}>{recipe.powder}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Firearm Custom Setup */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Firearm Setup & Dimensions</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Barrel Length (in)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={barrelLength}
                onChangeText={setBarrelLength}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target COAL (in)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={targetCoal}
                onChangeText={setTargetCoal}
              />
            </View>
          </View>
          <Text style={styles.refText}>
            Published Test Barrel: {selectedRecipe.testBarrel}" | Published COAL: {selectedRecipe.publishedCOAL}"
          </Text>
        </View>

        {/* COAL Safety Warning Box */}
        {coalWarning && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>PRESSURE SAFETY ALERT</Text>
            <Text style={styles.warningText}>{coalWarning}</Text>
          </View>
        )}

        {/* Calculated Ladder Cards */}
        <Text style={styles.sectionTitle}>Work-Up Ladder ({ladder.length} Steps)</Text>
        {ladder.map((item) => (
          <View key={item.step} style={[styles.ladderCard, item.isMax && styles.maxLadderCard]}>
            <View style={styles.ladderHeader}>
              <Text style={styles.stepBadge}>Step {item.step}</Text>
              {item.isMax && <Text style={styles.maxBadge}>MAX PUBLISHED LOAD</Text>}
            </View>
            
            <View style={styles.ladderMetrics}>
              <View>
                <Text style={styles.metricLabel}>Powder Charge</Text>
                <Text style={styles.metricVal}>{item.charge} gr</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metricLabel}>Est. Muzzle Velocity</Text>
                <Text style={styles.fpsVal}>{item.estFPS} fps</Text>
              </View>
            </View>

            {/* Range Chrono Entry Input */}
            <View style={styles.chronoInputRow}>
              <Text style={styles.chronoLabel}>Range Chrono FPS:</Text>
              <TextInput
                style={styles.chronoInput}
                placeholder="e.g. 2462"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={chronoLogs[item.step] || ''}
                onChangeText={(text) => updateChronoLog(item.step, text)}
              />
            </View>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 16 },
  header: { marginBottom: 20, alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#10b981', letterSpacing: 1.5 },
  headerSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginVertical: 12 },
  recipeRow: { marginBottom: 16 },
  recipeCard: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
    width: 220
  },
  recipeCardActive: { borderColor: '#10b981', backgroundColor: '#064e3b' },
  recipeCartridge: { color: '#fbbf24', fontWeight: '800', fontSize: 16 },
  recipeDetails: { color: '#f8fafc', fontSize: 13, marginTop: 4 },
  recipePowder: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  card: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginBottom: 12 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { width: '48%' },
  label: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#475569', fontSize: 16, fontWeight: '700' },
  refText: { color: '#64748b', fontSize: 11, marginTop: 10 },
  warningBox: { backgroundColor: '#7f1d1d', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ef4444', marginBottom: 16 },
  warningTitle: { color: '#fca5a5', fontWeight: '900', fontSize: 13, marginBottom: 4 },
  warningText: { color: '#fee2e2', fontSize: 12, lineHeight: 16 },
  ladderCard: { backgroundColor: '#1e293b', padding: 14, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  maxLadderCard: { borderColor: '#eab308' },
  ladderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepBadge: { backgroundColor: '#334155', color: '#f8fafc', fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 12 },
  maxBadge: { color: '#eab308', fontWeight: '800', fontSize: 11 },
  ladderMetrics: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  metricLabel: { color: '#94a3b8', fontSize: 11 },
  metricVal: { color: '#f8fafc', fontSize: 18, fontWeight: '800' },
  fpsVal: { color: '#10b981', fontSize: 18, fontWeight: '800' },
  chronoInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#334155' },
  chronoLabel: { color: '#94a3b8', fontSize: 12, flex: 1 },
  chronoInput: { backgroundColor: '#0f172a', color: '#38bdf8', width: 100, padding: 6, borderRadius: 6, borderWidth: 1, borderColor: '#475569', textAlign: 'center', fontWeight: '700' }
});