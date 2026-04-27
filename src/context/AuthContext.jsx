import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../services/api';
import { fetchMe, logout as logoutSvc } from '../services/authService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(true);
  // Increments every time an activity is successfully submitted to backend.
  // Any screen can watch this value and re-fetch its data accordingly.
  const [activityVersion, setActivityVersion] = useState(0);
  const [latestActivity, setLatestActivity] = useState(null);

  const bootstrap = useCallback(async () => {
    setBootstrapping(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        setUser(null);
      } else {
        try {
          const me = await fetchMe();
          setUser(me);
        } catch (_) {
          await logoutSvc();
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
      setBootstrapping(false);
    }
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await fetchMe();
      setUser(me);
      return me;
    } catch (_) { return null; }
  }, []);

  const signOut = useCallback(async () => {
    await logoutSvc();
    setUser(null);
  }, []);

  // Call this after a successful activity submission.
  // It refreshes the user (CC balance, XP, level) AND notifies all screens.
  const notifyNewActivity = useCallback(async (activity = null) => {
    if (activity) setLatestActivity(activity);
    setActivityVersion(v => v + 1);
    try {
      const me = await fetchMe();
      setUser(me);
      return me;
    } catch (_) { return null; }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, bootstrapping, setUser,
      refreshUser, signOut,
      activityVersion, notifyNewActivity, latestActivity
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
