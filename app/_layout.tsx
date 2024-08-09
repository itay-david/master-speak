import { Stack } from "expo-router";
import { useAuth, AuthProvider } from '../constants/AuthContext';
import LessonScreen from './LessonScreen';


export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="auth" options={{ headerShown: false}} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false}} />
        <Stack.Screen name="LessonScreen" />
      </Stack>
    </AuthProvider>
  );
}
