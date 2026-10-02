import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export function ExportableTargetCard({ imageUri, metrics }) {
  const viewShotRef = useRef(null);

  const handleShare = async () => {
    if (viewShotRef.current) {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Range Target Analysis',
      });
    }
  };

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.95 }}>
        <View style={styles.card}>
          <Image source={{ uri: imageUri }} style={styles.targetImage} />

          {/* Watermark Overlay Badge */}
          <View style={styles.watermarkBadge}>
            <Text style={styles.wmTitle}>TARGET ANALYSIS REPORT</Text>
            <Text style={styles.wmValue}>EXTREME SPREAD: {metrics.extremeSpread}"</Text>
            <Text style={styles.wmValue}>MEAN RADIUS: {metrics.meanRadius}" ({metrics.moa} MOA)</Text>
            <Text style={styles.wmSub}>
              {metrics.distanceYards} YDS | {metrics.rifleName} | {metrics.loadName}
            </Text>
          </View>
        </View>
      </ViewShot>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareText}>EXPORT & SHARE TARGET</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { width: '100%', height: 350, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0f172a' },
  targetImage: { width: '100%', height: '100%' },
  watermarkBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  wmTitle: { color: '#10b981', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  wmValue: { color: '#ffffff', fontSize: 13, fontWeight: '800', marginTop: 1 },
  wmSub: { color: '#94a3b8', fontSize: 9, marginTop: 2, fontStyle: 'italic' },
  shareBtn: { marginTop: 12, backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  shareText: { color: '#0f172a', fontWeight: '900', fontSize: 13 },
});