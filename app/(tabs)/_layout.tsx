import { View, Text } from 'react-native';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import Learn from './learn';
import Community from './community';
import Profile from './profile';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  return (
    <Tab.Navigator
      initialRouteName="learn"
      screenOptions={{
        tabBarStyle: { 
          paddingBottom: 10,
          height: 70,
          paddingTop: 5,
        },
      }}
    >
      <Tab.Screen 
        name='learn' 
        component={Learn}
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
      <Tab.Screen 
        name='community' 
        component={Community}
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
      <Tab.Screen 
        name='profile' 
        component={Profile}
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
    </Tab.Navigator>
  );
}