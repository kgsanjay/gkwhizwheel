import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSecurity } from '../context/SecurityContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { MaterialIcons } from '@expo/vector-icons';

export const AppLockOverlay: React.FC = () => {
  const { isLocked, unlockApp } = useSecurity();
  const { logout, user } = useAuth();
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    if (isLocked) {
      handleUnlock();
    }
  }, [isLocked]);

  const handleUnlock = async () => {
    const success = await unlockApp();
    if (!success) {
      setAuthFailed(true);
    } else {
      setAuthFailed(false);
    }
  };

  if (!isLocked || !user) return null;

  return (
    <View style={styles.overlay}>
      <MaterialIcons name="lock-outline" size={64} color="#FFF" style={styles.icon} />
      <Text style={styles.title}>App Locked</Text>
      <Text style={styles.subtitle}>Please authenticate to continue.</Text>
      
      <Button 
        title="Unlock" 
        onPress={handleUnlock} 
        style={styles.button}
      />

      {authFailed && (
        <Text style={styles.errorText}>Authentication failed. Please try again.</Text>
      )}

      <Button 
        title="Logout" 
        variant="outline"
        onPress={logout} 
        style={styles.logoutButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 24,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    marginBottom: 16,
  },
  logoutButton: {
    width: '100%',
    marginTop: 24,
    borderColor: '#334155',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 16,
  },
});
