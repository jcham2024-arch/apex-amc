import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Switch
} from 'react-native';

// --- Simplified Ballistic Point-Mass Drop & Windage Solver ---
// Calculates Drop (in inches/MIL/MOA) and Windage Drift
const calculateDope = (distanceYards, velocityFps, bcG1, sightHeightInches, windSpeedMph, windAngleDeg, tempF, altitudeFt) => {
  if (!distanceYards || distanceYards <= 0) return { dropInches: 0, milDrop: 0, moaDrop: 0, milWind: 0, moaWind: 0 };

  // Environmental density correction factor (Simplified DA adjustment)
  const tempCorrection = 1 + ((tempF - 59) * 0.002);
  const altCorrection = 1 - (altitudeFt * 0.00002);
  const effectiveBC = bcG1 * tempCorrection * altCorrection;

  // Approximate time of flight (t = d / v_avg)
  const distanceFeet = distanceYards * 3;
  // Drag decay factor
  const k = 0.00008 / Math.max(effectiveBC, 0.1);
  const estTimeOfFlight = (Math.exp(k * distanceFeet) - 1) / (k * velocityFps);

  // Gravity Drop calculation: h = 0.5 * g * t^2
  const gravityInches = 0.5 * 386.1 * Math.pow(estTimeOfFlight, 2);
  
  // Sight line intersection compensation (100 yard zero assumption)
  const zeroTime = (300) / velocityFps;
  const zeroGravity = 0.5 * 386.1 * Math.pow(zeroTime, 2);
  const netDropInches = gravityInches - ((distanceYards / 100) * (zeroGravity + sightHeightInches)) + sightHeightInches;

  // Crosswind drift calculation (Crosswind component = sin(angle))
  const crossWindMph = windSpeedMph * Math.sin((windAngleDeg * Math.PI) / 180);
  const crossWindFps = crossWindMph * 1.46667;
  // Lag law for wind drift: Drift = w * (t - d/v0)
  const windDriftInches = Math.abs(crossWindFps * (estTimeOfFlight - (distanceFeet / velocityFps)) * 12);

  // Convert Inches to MIL and MOA
  // 1 MIL @ 100 yards = 3.6 inches. 1 MOA @ 100 yards = 1.047 inches.
  const yardFactor = distanceYards / 100;
  const milDrop = netDropInches / (3.6 * yardFactor);
  const moaDrop = netDropInches / (1.047 * yardFactor);
  
  const milWind = windDriftInches / (3.6 * yardFactor);
  const moaWind = windDriftInches / (1.047 * yardFactor);

  return {
    dropInches: netDropInches.toFixed(1),
    milDrop: Math.max(0, milDrop).toFixed(1),
    moaDrop: Math.max(0, moaDrop).toFixed(1),
    milWind: milWind.toFixed(1),
    moaWind: moaWind.toFixed(1),
    timeOfFlight: estTimeOfFlight.toFixed(2)
  };
};

export default function DopeCalculatorScreen() {
  // Connected Active Load Profile
  const [activeProfile] = useState({
    rifleName: "Tikka T3x Tac A1",
    cartridge: ".308 Win",
    bulletName: "168gr Sierra MatchKing",
    muzzleVelocity: 2650, // FPS (Pelled from chrono avg)
    bcG1: 0.462,          // Ballistic Coefficient
    sightHeight: 1.5,      // Inches
  });

  // Target Parameters
  const [targetDistance, setTargetDistance] = useState('500');
  const [targetAngle, setTargetAngle] = useState('0'); // Degree slope

  // Environmental & Weather Parameters
  const [useLiveWeather, setUseLiveWeather] = useState(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [temperature, setTemperature] = useState('75'); // °F
  const [altitude, setAltitude] = useState('1200');    // Feet (DA)
  const [windSpeed, setWindSpeed] = useState('8');     // MPH
  const [windAngle, setWindAngle] = useState('90');    // 90° = Full Crosswind

  // Calculated DOPE Solution
  const [dopeSolution, setDopeSolution] = useState({});

  useEffect(() => {
    const dist = parseFloat(targetDistance) || 0;
    const vel = activeProfile.muzzleVelocity;
    const bc = activeProfile.bcG1;
    const sh = activeProfile.sightHeight;
    const ws = parseFloat(windSpeed) || 0;
    const wa = parseFloat(windAngle) || 0;
    const temp = parseFloat(temperature) || 59;
    const alt = parseFloat(altitude) || 0;

    const solution = calculateDope(dist, vel, bc, sh, ws, wa, temp, alt);
    setDopeSolution(solution);
  }, [targetDistance, windSpeed, windAngle, temperature, altitude, activeProfile]);

  // Simulated Weather API Fetch
  const handleFetchLocalWeather = () => {
    setIsWeatherLoading(true);
    setTimeout(() => {
      // Simulated GPS Location API response
      setTemperature('82');
      setAltitude('1450');
      setWindSpeed('12');
      setWindAngle('45');
      setIsWeatherLoading(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Profile Lock Banner */}
        <View style={styles.profileHeader}>
          <Text style={styles.profileHeaderTag}>ACTIVE LOAD PROFILE</Text>
          <Text style={styles.profileTitle}>{activeProfile.rifleName}</Text>
          <Text style={styles.profileSub}>
            {activeProfile.cartridge} | {activeProfile.bulletName}
          </Text>
          <View style={styles.profileMetricsRow}>
            <Text style={styles.metricBadge}>MV: {activeProfile.muzzleVelocity} FPS</Text>
            <Text style={styles.metricBadge}>G1 BC: {activeProfile.bcG1}</Text>
            <Text style={styles.metricBadge}>SH: {activeProfile.sightHeight}"</Text>
          </View>
        </View>

        {/* Target Distance Input Box */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Target Engagement</Text>
          <View style={styles.inputRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Target Range (Yards)</Text>
              <TextInput
                style={styles.largeInput}
                keyboardType="numeric"
                value={targetDistance}
                onChangeText={setTargetDistance}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Incline Angle (°)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={targetAngle}
                onChangeText={setTargetAngle}
              />
            </View>
          </View>
        </View>

        {/* Weather & Environmental Controls */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Atmospherics & Wind</Text>
            <TouchableOpacity 
              style={styles.gpsBtn} 
              onPress={handleFetchLocalWeather}
              disabled={isWeatherLoading}
            >
              <Text style={styles.gpsBtnText}>
                {isWeatherLoading ? "FETCHING..." : "🛰️ FETCH GPS WEATHER"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.label}>Temp (°F)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={temperature}
                onChangeText={setTemperature}
              />
            </View>
            <View style={{ flex: 1, marginHorizontal: 6 }}>
              <Text style={styles.label}>Altitude/DA (ft)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={altitude}
                onChangeText={setAltitude}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.label}>Wind (MPH)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={windSpeed}
                onChangeText={setWindSpeed}
              />
            </View>
          </View>
        </View>

        {/* FINAL DOPE CORRECTION DISPLAY */}
        <Text style={styles.sectionTitle}>Scope Correction Solution</Text>
        
        <View style={styles.dopeContainer}>
          {/* Elevation Correction */}
          <View style={styles.dopeCardElevation}>
            <Text style={styles.dopeLabel}>ELEVATION HOLD</Text>
            <Text style={styles.dopeValueMain}>+{dopeSolution.milDrop} <Text style={styles.unitText}>MIL</Text></Text>
            <Text style={styles.dopeValueSub}>+{dopeSolution.moaDrop} MOA ({dopeSolution.dropInches}" Drop)</Text>
          </View>

          {/* Windage Correction */}
          <View style={styles.dopeCardWindage}>
            <Text style={styles.dopeLabel}>WINDAGE HOLD ({windAngle}° Direction)</Text>
            <Text style={styles.dopeValueMain}>R {dopeSolution.milWind} <Text style={styles.unitText}>MIL</Text></Text>
            <Text style={styles.dopeValueSub}>R {dopeSolution.moaWind} MOA</Text>
          </View>
        </View>

        {/* Quick Reference Table (DOPE Card) */}
        <Text style={styles.sectionTitle}>Quick DOPE Table ({activeProfile.cartridge})</Text>
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={styles.tableTh}>YARDS</Text>
            <Text style={styles.tableTh}>ELEV (MIL)</Text>
            <Text style={styles.tableTh}>WIND (MIL)</Text>
            <Text style={styles.tableTh}>DROP (IN)</Text>
          </View>
          {[200, 300, 400, 500, 600, 700, 800].map((yds) => {
            const stepDope = calculateDope(
              yds,
              activeProfile.muzzleVelocity,
              activeProfile.bcG1,
              activeProfile.sightHeight,
              parseFloat(windSpeed) || 0,
              parseFloat(windAngle) || 0,
              parseFloat(temperature) || 59,
              parseFloat(altitude) || 0
            );
            return (
              <View key={yds} style={[styles.tableRow, yds === parseInt(targetDistance) && styles.tableRowActive]}>
                <Text style={styles.tableTdBold}>{yds} yds</Text>
                <Text style={styles.tableTdHighlight}>+{stepDope.milDrop} MIL</Text>
                <Text style={styles.tableTd}>{stepDope.milWind} MIL</Text>
                <Text style={styles.tableTdMuted}>{stepDope.dropInches}"</Text>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16 },
  profileHeader: { backgroundColor: '#1e293b', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#10b981', marginBottom: 16 },
  profileHeaderTag: { color: '#10b981', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  profileTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '800', marginTop: 2 },
  profileSub: { color: '#fbbf24', fontSize: 13, fontWeight: '600', marginTop: 2 },
  profileMetricsRow: { flexDirection: 'row', marginTop: 8 },
  metricBadge: { backgroundColor: '#0f172a', color: '#94a3b8', fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginRight: 6 },
  card: { backgroundColor: '#1e293b', padding: 14, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardHeader: { color: '#f8fafc', fontSize: 15, fontWeight: '800', marginBottom: 8 },
  gpsBtn: { backgroundColor: '#0284c7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  gpsBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#94a3b8', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#475569', fontSize: 14, fontWeight: '700' },
  largeInput: { backgroundColor: '#0f172a', color: '#38bdf8', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#38bdf8', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  sectionTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  dopeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dopeCardElevation: { flex: 1, backgroundColor: '#064e3b', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#10b981', marginRight: 6, alignItems: 'center' },
  dopeCardWindage: { flex: 1, backgroundColor: '#1e293b', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#0284c7', marginLeft: 6, alignItems: 'center' },
  dopeLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  dopeValueMain: { color: '#ffffff', fontSize: 28, fontWeight: '900', marginVertical: 4 },
  unitText: { fontSize: 14, color: '#10b981' },
  dopeValueSub: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  table: { backgroundColor: '#1e293b', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  tableRowHeader: { flexDirection: 'row', backgroundColor: '#0f172a', paddingVertical: 10, paddingHorizontal: 12 },
  tableTh: { flex: 1, color: '#64748b', fontSize: 11, fontWeight: '900' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  tableRowActive: { backgroundColor: '#064e3b' },
  tableTdBold: { flex: 1, color: '#f8fafc', fontWeight: '800', fontSize: 13 },
  tableTdHighlight: { flex: 1, color: '#10b981', fontWeight: '900', fontSize: 13 },
  tableTd: { flex: 1, color: '#38bdf8', fontWeight: '700', fontSize: 13 },
  tableTdMuted: { flex: 1, color: '#94a3b8', fontSize: 12 }
});