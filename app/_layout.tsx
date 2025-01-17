import { useAuth, AuthProvider } from '../constants/AuthContext';
import LessonScreen from './LessonScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Auth from './auth';
import TabLayout from './(tabs)/_layout';

const Stack = createNativeStackNavigator();

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack.Navigator>
        <Stack.Screen name="auth" options={{ headerShown: false}} component={Auth} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false}} component={TabLayout} />
        <Stack.Screen name="LessonScreen" component={LessonScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </AuthProvider>
  );
}