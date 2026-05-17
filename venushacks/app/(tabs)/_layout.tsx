import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
// HugeiconsIcon from the React Native renderer (uses react-native-svg, not DOM svg)
import { HugeiconsIcon } from '@hugeicons/react-native';
// Icon data from the free tier
import {
  Home04Icon,
  Analytics01Icon,
  AddSquareIcon,
  UserGroupIcon,
  UserIcon,
} from '@hugeicons/core-free-icons';

// ─── Tab icon with dot indicator ──────────────────────────────────────────────

function TabIcon({
  icon,
  focused,
}: {
  icon: React.ComponentProps<typeof HugeiconsIcon>['icon'];
  focused: boolean;
}) {
  return (
    <View style={tabStyles.wrap}>
      <HugeiconsIcon
        icon={icon}
        size={24}
        color={focused ? '#1A1A2E' : '#B0A8C0'}
        strokeWidth={focused ? 2 : 1.5}
      />
      {focused && <View style={tabStyles.dot} />}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  dot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: '#9B59B6' },
});

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={Home04Icon} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={Analytics01Icon} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={AddSquareIcon} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={UserGroupIcon} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={UserIcon} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
