// src/context/RoleContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

export type UserRole = 'poster' | 'tasker';

interface RoleContextType {
  fixedRole: 'poster' | 'tasker' | 'both'; // the role chosen at signup, sourced from the backend user
  currentRole: UserRole; // active role (poster or tasker)
  setCurrentRole: (role: UserRole) => void;
  canSwitch: boolean; // true if fixedRole === 'both'
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const fixedRole = user?.role ?? 'both';
  const [currentRole, setCurrentRoleState] = useState<UserRole>(fixedRole === 'tasker' ? 'tasker' : 'poster');

  // The active poster/tasker toggle is a local UI preference (only meaningful when fixedRole === 'both'),
  // separate from the account's role which comes from the authenticated user.
  useEffect(() => {
    const loadCurrentRole = async () => {
      try {
        const saved = await AsyncStorage.getItem('currentRole');
        if (saved === 'poster' || saved === 'tasker') {
          setCurrentRoleState(saved);
        }
      } catch (e) {
        console.warn('Failed to load current role', e);
      }
    };
    loadCurrentRole();
  }, []);

  useEffect(() => {
    if (fixedRole !== 'both') {
      setCurrentRoleState(fixedRole);
    }
  }, [fixedRole]);

  const handleSetCurrentRole = (role: UserRole) => {
    if (fixedRole === 'both' || fixedRole === role) {
      setCurrentRoleState(role);
      AsyncStorage.setItem('currentRole', role);
    }
  };

  const canSwitch = fixedRole === 'both';

  return (
    <RoleContext.Provider value={{ fixedRole, currentRole, setCurrentRole: handleSetCurrentRole, canSwitch }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used within RoleProvider');
  return context;
};
