import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { handleSignOut } from '@/constants/authUtils';
import { Redirect } from 'expo-router';
import { useAuth } from '../../constants/AuthContext';

export default function Profile() {
  const { user, isLoggedIn } = useAuth();

  const logOut = async () => {
    await handleSignOut();
  };

  if (!isLoggedIn) {
    return <Redirect href="/auth" />;
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../../images/default-profile-pic.jpg')}
        style={styles.profilePic}
      />
      <Text style={styles.username}>{user?.displayName}</Text>
      <TouchableOpacity onPress={logOut} style={styles.button}>
        <Text style={styles.buttonText}>התנתק</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#db3236',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});