// import { Stack } from "expo-router";
import { useAuth, AuthProvider } from '../constants/AuthContext';
import LessonScreen from './LessonScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Auth from './auth';
import Learn from './(tabs)/learn';

const Stack = createNativeStackNavigator();


export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack.Navigator>
        <Stack.Screen name="auth" options={{ headerShown: false}} component={Auth} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false}} component={Learn} />
        <Stack.Screen name="LessonScreen" component={LessonScreen} />
      </Stack.Navigator>
    </AuthProvider>
  );
}
