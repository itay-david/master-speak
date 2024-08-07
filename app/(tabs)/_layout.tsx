import { View, Text } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { 
          paddingBottom: 10, // Increase space for the tab bar at the bottom
          height: 70, // Increase the height of the tab bar
          paddingTop: 5, // Padding from the top of the tab bar
        },
      }}
    >
      <Tabs.Screen 
        name='learn' 
        options={{ 
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={focused ? size + 4 : size} color={focused ? 'black' : color} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ fontSize: focused ? 12 : 10, color: focused ? 'black' : '#888' }}>למידה</Text>
          ),
        }} 
      />
      <Tabs.Screen 
        name='community' 
        options={{ 
          headerShown: true,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={focused ? size + 4 : size} color={focused ? 'black' : color} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ fontSize: focused ? 12 : 10, color: focused ? 'black' : '#888' }}>קהילה</Text>
          ),
        }} 
      />
      <Tabs.Screen 
        name='profile' 
        options={{ 
          headerShown: true,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={focused ? size + 4 : size} color={focused ? 'black' : color} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ fontSize: focused ? 12 : 10, color: focused ? 'black' : '#888' }}>פרופיל</Text>
          ),
        }} 
      />
    </Tabs>
  );
}
