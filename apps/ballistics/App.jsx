import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { initDatabase } from './services/database';
import PowderTempSensitivityScreen from './screens/PowderTempSensitivityScreen';
import RayleighGroupCalculator from './screens/RayleighGroupCalculator';
import TransonicStabilityScreen from './screens/TransonicStabilityScreen';
import DopeCardScreen from './screens/DopeCardScreen';
import RifleProfileScreen from './screens/RifleProfileScreen';
import BackupRestoreScreen from './screens/BackupRestoreScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused }) => {
  const icons = {
    'DOPE': '🎯',
    'Powder C_T': '🌡️',
    'CEP Metrics': '📊',
    'Transonic': '⚡',
    'Rifles': '🔫',
    'Backup': '💾',
  };
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.iconText, focused && styles.iconFocused]}>
        {icons[name] || '📍'}
      </Text>
    </View>
  );
};

// Internal component housing the original ballistics tab navigator
function BallisticsAppContainer() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#0f172a', elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { color: '#10b981', fontWeight: '900', fontSize: 16 },
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="DOPE" component={DopeCardScreen} options={{ title: 'DOPE CARD' }} />
      <Tab.Screen name="Powder C_T" component={PowderTempSensitivityScreen} options={{ title: 'POWDER C_T' }} />
      <Tab.Screen name="CEP Metrics" component={RayleighGroupCalculator} options={{ title: 'CEP METRICS' }} />
      <Tab.Screen name="Transonic" component={TransonicStabilityScreen} options={{ title: 'TRANSONIC / SG' }} />
      <Tab.Screen name="Rifles" component={RifleProfileScreen} options={{ title: 'RIFLE PROFILES' }} />
      <Tab.Screen name="Backup" component={BackupRestoreScreen} options={{ title: 'DATA BACKUP' }} />
    </Tab.Navigator>
  );
}

// Main website component with top-level navigation bar
export default function App() {
  const [activeSiteTab, setActiveSiteTab] = useState('home');

  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <SafeAreaView style={styles.webWrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Global Top Navigation Bar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setActiveSiteTab('home')}>
          <Text style={styles.brandTitle}>APEX AMC</Text>
        </TouchableOpacity>

        <View style={styles.navLinks}>
          <TouchableOpacity onPress={() => setActiveSiteTab('home')}>
            <Text style={[styles.navText, activeSiteTab === 'home' && styles.activeNavText]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveSiteTab('ballistics')}>
            <Text style={[styles.navText, activeSiteTab === 'ballistics' && styles.activeNavText]}>Ballistics Engine</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveSiteTab('about')}>
            <Text style={[styles.navText, activeSiteTab === 'about' && styles.activeNavText]}>About</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Website Body Routing */}
      <View style={styles.mainContent}>
        {activeSiteTab === 'home' && (
          <ScrollView contentContainerStyle={styles.landingContainer}>
            <Text style={styles.heroTitle}>Precision Ballistics & Advanced Analytics</Text>
            <Text style={styles.heroSub}>
              Apex AMC provides custom trajectory calculations, powder temperature sensitivity modeling, 
              Rayleigh CEP group analysis, and profile management.
            </Text>

            <TouchableOpacity style={styles.ctaButton} onPress={() => setActiveSiteTab('ballistics')}>
              <Text style={styles.ctaButtonText}>Launch Ballistics Engine</Text>
            </TouchableOpacity>

            <View style={styles.featureGrid}>
              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>🎯 Trajectory & DOPE</Text>
                <Text style={styles.featureDesc}>Calculate precise elevation and windage holds across variable distances and atmospheric conditions.</Text>
              </View>

              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>🌡️ Powder Sensitivity</Text>
                <Text style={styles.featureDesc}>Log temperature-velocity changes to determine your powder's true temperature coefficient.</Text>
              </View>

              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>📊 Group & CEP Metrics</Text>
                <Text style={styles.featureDesc}>Analyze shot dispersion, Rayleigh distributions, and 50% Circular Error Probable metrics.</Text>
              </View>

              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>⚡ Transonic Stability</Text>
                <Text style={styles.featureDesc}>Estimate Miller gyroscopic stability factor (SG) and transonic transition zones.</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {activeSiteTab === 'ballistics' && (
          <NavigationContainer>
            <BallisticsAppContainer />
          </NavigationContainer>
        )}

        {activeSiteTab === 'about' && (
          <ScrollView contentContainerStyle={styles.landingContainer}>
            <Text style={styles.heroTitle}>About Apex Advanced Ballistics</Text>
            <Text style={styles.heroSub}>
              Apex AMC is designed for long-range target shooters, reloading enthusiasts, and ballistics researchers requiring detailed field calculations and data storage.
            </Text>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  webWrapper: { flex: 1, backgroundColor: '#0f172a' },
  navbar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    backgroundColor: '#1e293b',
    borderBottomWidth: 1, 
    borderBottomColor: '#334155' 
  },
  brandTitle: { color: '#10b981', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  navLinks: { flexDirection: 'row', gap: 24, alignItems: 'center' },
  navText: { color: '#94a3b8', fontSize: 15, fontWeight: '700' },
  activeNavText: { color: '#10b981', fontWeight: '900' },
  mainContent: { flex: 1 },
  
  // Website Landing Page Styling
  landingContainer: { padding: 32, alignItems: 'center' },
  heroTitle: { color: '#f8fafc', fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 16, marginTop: 24 },
  heroSub: { color: '#94a3b8', fontSize: 16, textAlign: 'center', maxWidth: 640, lineHeight: 24, marginBottom: 32 },
  ctaButton: { backgroundColor: '#10b981', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8, marginBottom: 48 },
  ctaButtonText: { color: '#0f172a', fontWeight: '900', fontSize: 16 },
  
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center', maxWidth: 900 },
  featureCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 12, width: 260, borderWidth: 1, borderColor: '#334155' },
  featureTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  featureDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },

  // Ballistics Tab Bar Styling
  tabBar: {
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: { fontSize: 10, fontWeight: '800' },
  iconContainer: { alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 16, opacity: 0.6 },
  iconFocused: { opacity: 1.0, transform: [{ scale: 1.15 }] },
});