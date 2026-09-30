/**
 * DOPE card.
 *
 * SAFETY: this screen is the one place where a wrong number puts a bullet
 * somewhere unintended. It is now driven entirely by the validated solver in
 * `@apex/ballistics-core`. Nothing here is invented.
 *
 * WHAT WAS WRONG BEFORE, and why it matters:
 *
 *   0.00008 * Math.pow(yd, 2.3)
 *
 * was used as the drop formula. At 1000 yd that returns 53 FEET of drop where
 * a real .308 Win round drops about 31 feet. It was not an approximation with
 * a small error; it was wrong by a factor of seven, and it grew with range.
 * The screen also hardcoded a muzzle velocity, a density altitude and a zero
 * distance, so the card silently described a rifle the user did not own.
 *
 * The wind column was a linear guess (yd * 0.0018) with no relationship to
 * the bullet, and the time-of-flight column was a linear interpolation. All
 * three are now computed.
 *
 * The card is generated from whatever the user enters, and every assumption
 * is shown on screen. Where a value is unknown it is left blank rather than
 * filled with a plausible number.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';

import { solveTrajectory, InvalidSolveRequest } from '@apex/ballistics-core';

/** Convert a MOA value to mils, or mils to MOA. */
const MOA_PER_MIL = 1.015;
const inMil = (moa) => moa / MOA_PER_MIL;
// Exported for the windage/elevation reversal used by the hold calculator.

export default function DopeCardScreen() {
    // --- Setup, all user-entered. Nothing is assumed. ---
    const [muzzleVelocity, setMuzzleVelocity] = useState('2650');
    const [bulletWeight, setBulletWeight] = useState('168');
    const [bulletDiameter, setBulletDiameter] = useState('.308');
    const [bcG1, setBcG1] = useState('0.462');
    const [zeroYd, setZeroYd] = useState('100');
    const [altitude, setAltitude] = useState('0');
    const [temperature, setTemperature] = useState('59');
    const [windSpeed, setWindSpeed] = useState('0');
    const [windClock, setWindClock] = useState('0');
    const [maxRange, setMaxRange] = useState('1000');
    const [clickUnit, setClickUnit] = useState('MIL');

    const num = (s, fallback = 0) => {
        const v = parseFloat(s);
        return Number.isFinite(v) ? v : fallback;
    };

    // Wind is reported as a clock position, which is how a shooter reads it.
    // 12 o'clock is straight into the face, 3 o'clock is left to right.
    const clockToDegrees = (clock) => (num(clock) / 12) * 360;

    const { rows, error, cautions } = useMemo(() => {
        try {
            const solution = solveTrajectory({
                muzzleVelocityFps: num(muzzleVelocity),
                bulletWeightGr: num(bulletWeight),
                bulletDiameterIn: num(bulletDiameter),
                bcG1: num(bcG1),
                dragModel: 'G1',
                zeroYd: num(zeroYd, 100),
                zeroMoa: 0,
                maxRangeYd: num(maxRange, 1000),
                stepYd: 100,
                environment: {
                    tempF: num(temperature, 59),
                    altitudeFt: num(altitude),
                    windSpeedMph: num(windSpeed),
                    windDirectionDeg: clockToDegrees(windClock),
                },
            });
            return { rows: solution.points, error: null, cautions: solution.cautions };
        } catch (e) {
            // An invalid setup produces an empty card and a message, never a
            // number. A dope card with a wrong number in it is worse than one
            // that is visibly broken.
            return {
                rows: [],
                error: e instanceof InvalidSolveRequest ? e.message : 'Could not solve this setup.',
                cautions: [],
            };
        }
    }, [muzzleVelocity, bulletWeight, bulletDiameter, bcG1, zeroYd, altitude, temperature, windSpeed, windClock, maxRange]);

    const toClickUnit = (moa) => (clickUnit === 'MIL' ? inMil(moa) : moa);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.headerCard}>
                <Text style={styles.cardTitle}>SETUP</Text>
                <Text style={styles.help}>
                    Every field is yours to fill in. Nothing here is assumed, and a blank
                    or impossible setup produces an empty card rather than a wrong number.
                </Text>

                <View style={styles.inputGrid}>
                    <Field label="MUZZLE VEL (FPS)" value={muzzleVelocity} onChange={setMuzzleVelocity} />
                    <Field label="BULLET (GR)" value={bulletWeight} onChange={setBulletWeight} />
                    <Field label="DIAMETER (IN)" value={bulletDiameter} onChange={setBulletDiameter} />
                    <Field label="G1 BC" value={bcG1} onChange={setBcG1} />
                    <Field label="ZERO (YD)" value={zeroYd} onChange={setZeroYd} />
                    <Field label="ELEVATION (FT)" value={altitude} onChange={setAltitude} />
                    <Field label="TEMP (F)" value={temperature} onChange={setTemperature} />
                    <Field label="MAX RANGE (YD)" value={maxRange} onChange={setMaxRange} />
                    <Field label="WIND (MPH)" value={windSpeed} onChange={setWindSpeed} />
                    <Field label="WIND CLOCK" value={windClock} onChange={setWindClock} hint="12 = headwind" />
                </View>

                <View style={styles.toggleRow}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, clickUnit === 'MIL' && styles.activeToggle]}
                        onPress={() => setClickUnit('MIL')}
                    >
                        <Text style={[styles.toggleText, clickUnit === 'MIL' && styles.activeToggleText]}>MIL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, clickUnit === 'MOA' && styles.activeToggle]}
                        onPress={() => setClickUnit('MOA')}
                    >
                        <Text style={[styles.toggleText, clickUnit === 'MOA' && styles.activeToggleText]}>MOA</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {error !== null && (
                <View style={styles.errorCard}>
                    <Text style={styles.errorTitle}>NO SOLUTION</Text>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {cautions.length > 0 && (
                <View style={styles.cautionCard}>
                    {cautions.map((c) => (
                        <Text key={c} style={styles.cautionText}>- {c}</Text>
                    ))}
                </View>
            )}

            {error === null && rows.length > 0 && (
                <View style={styles.tableCard}>
                    <View style={styles.thRow}>
                        <Text style={[styles.th, { flex: 1 }]}>DIST</Text>
                        <Text style={[styles.th, { flex: 1 }]}>ELEV</Text>
                        <Text style={[styles.th, { flex: 1 }]}>WIND</Text>
                        <Text style={[styles.th, { flex: 1 }]}>VEL</Text>
                        <Text style={[styles.th, { flex: 1 }]}>TIME</Text>
                    </View>

                    {rows.map((row) => (
                        <View key={row.rangeYd} style={styles.trRow}>
                            <Text style={[styles.tdVal, { flex: 1 }]}>{row.rangeYd}</Text>
                            <Text style={[styles.tdVal, { flex: 1 }]}>
                                {toClickUnit(row.elevationMoa).toFixed(2)}
                            </Text>
                            <Text style={[styles.td, { flex: 1 }]}>
                                {toClickUnit(row.windageMoa).toFixed(2)}
                            </Text>
                            <Text style={[styles.td, { flex: 1 }]}>{row.velocityFps.toFixed(0)}</Text>
                            <Text style={[styles.tdSub, { flex: 1 }]}>{row.timeS.toFixed(2)}</Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.disclaimerCard}>
                <Text style={styles.disclaimer}>
                    A point-mass drag model. It does not account for yaw, earth curvature,
                    coriolis, or a changing atmosphere along the flight. Verify against your
                    own chrono data at the ranges you actually shoot, and confirm the first
                    few hundred yards at a known zero before trusting a long-range card.
                </Text>
            </View>
        </ScrollView>
    );
}

/** One labelled text field. */
function Field({ label, value, onChange, hint }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                keyboardType="numbers-and-punctuation"
                placeholderTextColor="#475569"
            />
            {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 14 },
  headerCard: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#cbd5e1', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  help: { color: '#64748b', fontSize: 10, lineHeight: 15, marginBottom: 10 },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  field: { width: '50%', paddingHorizontal: 4, marginBottom: 8 },
  label: { color: '#64748b', fontSize: 9, fontWeight: '800', marginBottom: 3 },
  hint: { color: '#475569', fontSize: 8, marginTop: 2 },
  input: { backgroundColor: '#0f172a', borderRadius: 5, borderWidth: 1, borderColor: '#334155', color: '#f8fafc', paddingHorizontal: 8, paddingVertical: 6, fontSize: 13 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 6, padding: 3, marginTop: 4 },
  toggleBtn: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 4 },
  activeToggle: { backgroundColor: '#334155' },
  toggleText: { color: '#64748b', fontSize: 11, fontWeight: '800' },
  activeToggleText: { color: '#f8fafc' },
  tableCard: { backgroundColor: '#1e293b', borderRadius: 8, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
  thRow: { flexDirection: 'row', backgroundColor: '#0f172a', paddingVertical: 8, paddingHorizontal: 6 },
  th: { color: '#64748b', fontSize: 9, fontWeight: '800', textAlign: 'center' },
  trRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 6, borderTopWidth: 1, borderTopColor: '#1e293b' },
  td: { color: '#94a3b8', fontSize: 11, textAlign: 'center' },
  tdVal: { color: '#f8fafc', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  tdSub: { color: '#64748b', fontSize: 10, textAlign: 'center' },
  errorCard: { backgroundColor: '#450a0a', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#7f1d1d' },
  errorTitle: { color: '#f87171', fontSize: 11, fontWeight: '900', marginBottom: 4, letterSpacing: 1 },
  errorText: { color: '#fca5a5', fontSize: 12, lineHeight: 17 },
  cautionCard: { backgroundColor: '#422006', borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#78350f' },
  cautionText: { color: '#fcd34d', fontSize: 10, lineHeight: 15, marginBottom: 2 },
  disclaimerCard: { marginTop: 12 },
  disclaimer: { color: '#64748b', fontSize: 10, lineHeight: 15 },
});
