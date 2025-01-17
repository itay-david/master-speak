import { Text, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from '../constants/AuthContext';

export default function Index() {

  const { isLoggedIn } = useAuth();
  
  return (
    <View
    style={{
      flex: 1,
    }}
    >
      {isLoggedIn ?
        <Redirect href={'/learn'} />
        : <Redirect href={'/auth'} />}
    </View>    
  );
}
