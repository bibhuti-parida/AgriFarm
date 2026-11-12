import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { farmsApi } from '../api/farms.api.js';
import { useAuth } from './AuthContext.jsx';

const FarmContext = createContext(null);

export const FarmProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(() => {
    return localStorage.getItem('agrifarm_selected_farm_id') || '';
  });
  const [loading, setLoading] = useState(false);

  const fetchFarms = useCallback(async () => {
    if (!isAuthenticated) {
      setFarms([]);
      return;
    }
    setLoading(true);
    try {
      const res = await farmsApi.list({ limit: 100 });
      const list = res?.data?.farms || [];
      setFarms(list);

      // If a farm was previously selected, verify it still exists in the fetched list
      if (selectedFarmId && !list.some((f) => f.id === selectedFarmId)) {
        setSelectedFarmId('');
        localStorage.removeItem('agrifarm_selected_farm_id');
      }
    } catch (err) {
      console.error('Failed to load farms:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, selectedFarmId]);

  useEffect(() => {
    fetchFarms();
  }, [isAuthenticated]);

  const selectFarm = useCallback((id) => {
    setSelectedFarmId(id);
    if (id) {
      localStorage.setItem('agrifarm_selected_farm_id', id);
    } else {
      localStorage.removeItem('agrifarm_selected_farm_id');
    }
  }, []);

  const selectedFarm = farms.find((f) => f.id === selectedFarmId) || null;

  return (
    <FarmContext.Provider
      value={{
        farms,
        selectedFarmId,
        selectedFarm,
        currentFarm: selectedFarm,
        selectFarm,
        loading,
        refreshFarms: fetchFarms,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) throw new Error('useFarm must be used within FarmProvider');
  return context;
};
