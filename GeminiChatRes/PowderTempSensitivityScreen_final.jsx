import { useState, useEffect, useCallback } from 'react';
import {
  initDatabase,
  getRifles,
  addRifle,
  addChronoLog,
  getChronoLogsByRifle,
  addShotGroup,
  getShotGroupsByRifle,
} from '../services/database';

export function useBallisticsDb() {
  const [isReady, setIsReady] = useState(false);
  const [rifles, setRifles] = useState([]);
  const [selectedRifleId, setSelectedRifleId] = useState(null);
  const [chronoLogs, setChronoLogs] = useState([]);
  const [shotGroups, setShotGroups] = useState([]);

  // Init DB on startup
  useEffect(() => {
    async function setup() {
      await initDatabase();
      const loadedRifles = await getRifles();
      setRifles(loadedRifles);
      if (loadedRifles.length > 0) {
        setSelectedRifleId(loadedRifles[0].id);
      }
      setIsReady(true);
    }
    setup();
  }, []);

  // Fetch relational data when selected rifle changes
  const refreshRifleData = useCallback(async (rifleId) => {
    if (!rifleId) return;
    const [logs, groups] = await Promise.all([
      getChronoLogsByRifle(rifleId),
      getShotGroupsByRifle(rifleId),
    ]);
    setChronoLogs(logs);
    setShotGroups(groups);
  }, []);

  useEffect(() => {
    if (selectedRifleId) {
      refreshRifleData(selectedRifleId);
    }
  }, [selectedRifleId, refreshRifleData]);

  // Actions
  const handleCreateRifle = async (name, caliber, zeroDistance) => {
    const newId = await addRifle(name, caliber, zeroDistance);
    const updatedRifles = await getRifles();
    setRifles(updatedRifles);
    setSelectedRifleId(newId);
  };

  const handleLogChrono = async (tempF, velocityFps, powderName) => {
    if (!selectedRifleId) return;
    await addChronoLog(selectedRifleId, tempF, velocityFps, powderName);
    await refreshRifleData(selectedRifleId);
  };

  const handleSaveGroup = async (distanceYd, cep50, extremeSpread, shotCount) => {
    if (!selectedRifleId) return;
    await addShotGroup(selectedRifleId, distanceYd, cep50, extremeSpread, shotCount);
    await refreshRifleData(selectedRifleId);
  };

  return {
    isReady,
    rifles,
    selectedRifleId,
    setSelectedRifleId,
    chronoLogs,
    shotGroups,
    createRifle: handleCreateRifle,
    logChrono: handleLogChrono,
    saveGroup: handleSaveGroup,
  };
}