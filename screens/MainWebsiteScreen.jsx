import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';

// Import your existing components/screens
import BallisticsApp from './BallisticsAppScreen'; // Your current main ballistics view

export default function MainWebsiteScreen() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Website Header / Navigation */}
      <View style={styles.navbar}>
        <Text style={styles.brandTitle}>APEX AMC</Text>
        <View style={styles.navLinks}>
          <TouchableOpacity onPress={() => setActiveTab('home')}>
            <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('ballistics')}>
            <Text style={[styles.navText, activeTab === 'ballistics' && styles.activeNavText]}>Ballistics Engine</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('about')}>
            <Text style={[styles.navText, activeTab === 'about' && styles.activeNavText]}>About</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Page Content */}
      <View style={styles.content}>
        {activeTab === 'home' && (
          <ScrollView contentContainerStyle={styles.landingContainer}>
            <Text style={styles.heroTitle}>Precision Ballistics & Advanced Analytics</Text>
            <Text style={styles.heroSub}>
              Apex Advanced Ballistics Management System provides custom trajectory modeling, chronograph data logging, and group dispersion tracking.
            </Text>
            
            <TouchableOpacity style={styles.ctaButton} onPress={() => setActiveTab('ballistics')}>
              <Text style={styles.ctaButtonText}>Launch Ballistics Calculator</Text>
            </TouchableOpacity>

            <View style={styles.featureGrid}>
              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>Data Logging</Text>
                <Text style={styles.featureDesc}>Log chronograph entries, powder types, and environmental variables seamlessly.</Text>
              </View>
              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>Group Analysis</Text>
                <Text style={styles.featureDesc}>Calculate CEP 50% and Extreme Spread automatically across custom ranges.</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Embedded Ballistics Application */}
        {activeTab === 'ballistics' && (
          <View style={styles.appContainer}>
            <BallisticsApp />
          </View>
        )}

        {activeTab === 'about' && (
          <View style={styles.aboutContainer}>
            <Text style={styles.heroTitle}>About Apex AMC</Text>
            <Text style={styles.heroSub}>Built for high-precision shooting enthusiasts and custom ballistics tracking.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#222' },
  brandTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  navLinks: { flexDirection: 'row', gap: 20 },
  navText: { color: '#888', fontSize: 16 },
  activeNavText: { color: '#00e5ff', fontWeight: 'bold' },
  content: { flex: 1 },
  landingContainer: { padding: 40, alignItems: 'center' },
  heroTitle: { color: '#fff', fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  heroSub: { color: '#aaa', fontSize: 18, textAlign: 'center', maxWidth: 600, marginBottom: 30 },
  ctaButton: { backgroundColor: '#00e5ff', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8 },
  ctaButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 40, justifyContent: 'center' },
  featureCard: { backgroundColor: '#1e1e1e', padding: 20, borderRadius: 8, width: 280 },
  featureTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  featureDesc: { color: '#aaa', fontSize: 14 },
  appContainer: { flex: 1 },
  aboutContainer: { padding: 40, alignItems: 'center' }
});