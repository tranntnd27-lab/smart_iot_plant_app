import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { SensorData, MQTTConnectionStatus, PlantHealthInfo } from './src/types/plant';
import { mqttService } from './src/services/mqttService';

import { Header } from './src/components/Header';
import { BottomNav } from './src/components/BottomNav';

import { HomeScreen } from './src/screens/HomeScreen';
import { ChartScreen } from './src/screens/ChartScreen';
import { ControlScreen } from './src/screens/ControlScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

import { PLANT_PROFILES, calculatePlantHealth } from './src/utils/plantProfiles';
import { PlantProfile } from './src/types/plant';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState<MQTTConnectionStatus>('CONNECTING');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [hasReceivedRealData, setHasReceivedRealData] = useState<boolean>(false);
  const [selectedProfile, setSelectedProfile] = useState<PlantProfile>(PLANT_PROFILES[0]);

  const [sensorData, setSensorData] = useState<SensorData>({
    temp: 0,
    hum: 0,
    soil: 0,
    light: 0,
    pump: 0,
    led: 0,
  });

  // Handle incoming MQTT data
  const handleDataReceived = useCallback((data: SensorData) => {
    setSensorData(data);
    setHasReceivedRealData(true);
  }, []);

  // Connect to MQTT broker on mount
  useEffect(() => {
    mqttService.connect(handleDataReceived, (status) => {
      setConnectionStatus(status);
    });

    return () => {
      mqttService.disconnect();
    };
  }, [handleDataReceived]);

  // Handle pump toggle button
  const handlePumpToggle = (targetState: 0 | 1) => {
    mqttService.publishPumpControl(targetState);
    setSensorData((prev) => ({ ...prev, pump: targetState }));
  };

  // Handle LED toggle button
  const handleLedToggle = (targetState: 0 | 1) => {
    mqttService.publishLedControl(targetState);
    setSensorData((prev) => ({ ...prev, led: targetState }));
  };

  const healthInfo = calculatePlantHealth(sensorData, selectedProfile, hasReceivedRealData);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            sensorData={sensorData}
            hasReceivedRealData={hasReceivedRealData}
            healthInfo={healthInfo}
            selectedProfile={selectedProfile}
            onSelectProfile={setSelectedProfile}
            onPumpToggle={handlePumpToggle}
          />
        );
      case 'chart':
        return <ChartScreen sensorData={sensorData} />;
      case 'control':
        return (
          <ControlScreen
            sensorData={sensorData}
            onPumpToggle={handlePumpToggle}
            onLedToggle={handleLedToggle}
          />
        );
      case 'settings':
        return <SettingsScreen />;
      default:
        return (
          <HomeScreen
            sensorData={sensorData}
            hasReceivedRealData={hasReceivedRealData}
            healthInfo={healthInfo}
            selectedProfile={selectedProfile}
            onSelectProfile={setSelectedProfile}
            onPumpToggle={handlePumpToggle}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor="#0f172a" />

      {/* Header */}
      <Header title="Smart Plant" status={connectionStatus} />

      {/* Dynamic Screen Area */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  screenContainer: {
    flex: 1,
  },
});
