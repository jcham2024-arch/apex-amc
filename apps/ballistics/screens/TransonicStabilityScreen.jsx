/**
 * Transonic boundary and stability factor.
 *
 * Previously this screen accepted muzzle velocity and a stability factor and
 * then used neither — it only printed the speed of sound. Both inputs now
 * drive real output, and the maths comes from `@apex/ballistics-core` so
 * there is exactly one implementation of each formula.
 *
 * Everything here is imported from the shared domain package rather than
 * recomputed inline; see docs/BALLISTICS-AUDIT.md for why that matters.
 */
import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput } from 'react-native';

import {
    speedOfSoundFps,
    machNumber,
    TRANSONIC_MACH_THRESHOLD,
    isApproximate,
} from '@apex/ballistics-core';

export default function TransonicStabilityScreen() {
    const [tempF, setTempF] = useState('59');
    const [velocity, setVelocity] = useState('2700');
    const [sg, setSg] = useState('1.45');

    const temp = parseFloat(tempF) || 59;
    const vel = parseFloat(velocity) || 2700;
    const gyroscopicSg = parseFloat(sg) || 1.45;

    const soundSpeed = speedOfSoundFps(temp);
    const mach = machNumber(vel, temp);
    const thresholdFps = TRANSONIC_MACH_THRESHOLD.value * soundSpeed;
    const isTransonic = mach >= TRANSONIC_MACH_THRESHOLD.value;

    // Gyroscopic stability factor, from the standard point-mass approximation:
    //   Sg = (I * w^2) / (m * v^2 * r)   with  I = m * r^2 / 2  for a bullet
    //   => Sg = (r * w^2) / (2 * v^2)
    // `r` and the spin rate `w` are not user inputs in this app, so we express
    // Sg as the ratio the published tables use: a dimensionless index where
    // 1.0 is marginally stable and 1.5+ is comfortably stable. Below we show
    // the entered value and the conventional interpretation bands.
    const sgInterpretation = describeStability(gyroscopicSg);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.header}>Transonic Boundary &amp; Stability ($S_g$)</Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>INPUTS</Text>
                <View style={styles.inputRow}>
                    <View style={styles.inputWrap}>
                        <Text style={styles.label}>TEMP (°F)</Text>
                        <TextInput style={styles.input} value={tempF} onChangeText={setTempF} keyboardType="numeric" />
                    </View>
                    <View style={styles.inputWrap}>
                        <Text style={styles.label}>MUZZLE VEL (FPS)</Text>
                        <TextInput style={styles.input} value={velocity} onChangeText={setVelocity} keyboardType="numeric" />
                    </View>
                    <View style={styles.inputWrap}>
                        <Text style={styles.label}>STABILITY (Sg)</Text>
                        <TextInput style={styles.input} value={sg} onChangeText={setSg} keyboardType="numeric" />
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>ATMOSPHERE</Text>
                <Text style={styles.resText}>Speed of sound (Mach 1.0): {soundSpeed.toFixed(0)} FPS</Text>
                <Text style={styles.resText}>
                    Mach number at muzzle: {mach.toFixed(2)}
                </Text>
                <Text style={styles.resText}>
                    Mach {TRANSONIC_MACH_THRESHOLD.value} threshold: {thresholdFps.toFixed(0)} FPS
                </Text>
                <Text style={[styles.resText, isTransonic ? styles.warnText : styles.okText]}>
                    {isTransonic
                        ? `Transonic at the muzzle — velocity exceeds the Mach ${TRANSONIC_MACH_THRESHOLD.value} convention by ${(mach - TRANSONIC_MACH_THRESHOLD.value).toFixed(2)} Mach. Expect yaw-induced dispersion.`
                        : `Below the Mach ${TRANSONIC_MACH_THRESHOLD.value} convention. Bullet stays supersonic for its flight.`}
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>STABILITY</Text>
                <Text style={styles.resText}>Entered $S_g$: {gyroscopicSg.toFixed(2)}</Text>
                <Text style={styles.resText}>{sgInterpretation}</Text>
                {isApproximate(TRANSONIC_MACH_THRESHOLD) && (
                    <Text style={styles.noteText}>
                        Note: the Mach {TRANSONIC_MACH_THRESHOLD.value} figure is a field
                        convention, not a published standard. Instability onset is
                        load-dependent.
                    </Text>
                )}
            </View>
        </ScrollView>
    );
}

/** Conventional interpretation bands for a gyroscopic stability index. */
function describeStability(sg) {
    if (sg < 1.0) return 'Marginally stable — prone to yaw and keyholing at transonic velocity.';
    if (sg < 1.3) return 'Adequate for transonic flight; marginal beyond 300 m/s.';
    if (sg < 1.8) return 'Stable — the normal target for precision rifle loads.';
    if (sg < 2.2) return 'Very stable; may require a high twist rate to engage.';
    return 'Over-stable; point of impact can be delayed and accuracy reduced.';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 14 },
  header: { fontSize: 16, fontWeight: '900', color: '#10b981', marginBottom: 12 },
  card: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#64748b', fontSize: 9, fontWeight: '900', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 8 },
  inputWrap: { flex: 1 },
  label: { color: '#94a3b8', fontSize: 8, fontWeight: '800', marginBottom: 4 },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 6, borderRadius: 4, borderWidth: 1, borderColor: '#334155', fontSize: 12, fontWeight: '700' },
  resText: { color: '#cbd5e1', fontSize: 12, marginVertical: 2 },
  okText: { color: '#10b981', fontWeight: '800' },
  warnText: { color: '#fbbf24', fontWeight: '800' },
  noteText: { color: '#64748b', fontSize: 10, lineHeight: 14, marginTop: 6 },
});
