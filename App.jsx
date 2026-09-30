import React from 'react';
import { StatusBar, StyleSheet, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

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

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
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
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
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
