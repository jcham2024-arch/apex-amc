import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useBallisticsDb } from '../hooks/useBallisticsDb';

export default function RifleProfileScreen() {
  const { isReady, createRifle } = useBallisticsDb();
  const [name, setName] = useState('');
  const [caliber, setCaliber] = useState('');

  if (!isReady) return <ActivityIndicator size="large" color="#10b981" style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.cardTitle}>RIFLE PROFILES</Text>
      <View style={styles.card}>
        <TextInput style={styles.input} placeholder="Rifle Name" placeholderTextColor="#64748b" value={name} onChangeText={setName} />
        <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Caliber" placeholderTextColor="#64748b" value={caliber} onChangeText={setCaliber} />
        <TouchableOpacity style={styles.btn} onPress={() => { createRifle(name, caliber); setName(''); setCaliber(''); }}>
          <Text style={styles.btnText}>Add Rifle</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 14 },
  card: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#10b981', fontSize: 12, fontWeight: '900', marginBottom: 8 },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#334155', fontSize: 12 },
  btn: { backgroundColor: '#10b981', padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#0f172a', fontWeight: '900', fontSize: 12 },
});
