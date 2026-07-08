import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { ChefHat, Store, User } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useAuthStore } from '../../store/useAuthStore';

export default function TabLayout() {
  const token = useAuthStore(state => state.token);
  const isDarkMode = useAuthStore(state => state.isDarkMode);

  const themeColors = {
    card: isDarkMode ? '#121212' : '#FFFFFF',
    border: isDarkMode ? '#1F1F1F' : '#EAEAEA',
    text: isDarkMode ? '#FFFFFF' : '#1E2022',
    textSecondary: isDarkMode ? '#8E8E93' : '#686E73',
    primary: '#FFB300',
  };

  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textSecondary,
        tabBarStyle: {
          backgroundColor: themeColors.card,
          borderTopColor: themeColors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <ChefHat size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'My Menu',
          tabBarIcon: ({ color }) => <Store size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
