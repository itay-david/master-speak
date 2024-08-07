import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { Colors } from '@/constants/Colors'
import { useRouter } from 'expo-router'

export default function Login() {
  const router = useRouter();

  return (
    <View style={styles.container}>
        <Text style={{
          fontSize: 25,
          marginTop: 20,
          textAlign: 'center'
        }}>Speak Master</Text>

        <Text style={{fontSize: 17, textAlign: 'center', marginTop: 20}}>Welcome to Speak Master get ready to learn as much / fast / efficent as posibble!</Text>

        <TouchableOpacity style={styles.button} onPress={() => router.push('auth/sign-in')}>
          <Text style={{fontSize: 25, color: Colors.WHITE}}>Get Started</Text>
        </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    width: '100%',
    height: '100%',
    marginTop: 40,
    alignItems: 'center'
  },

  button: {
    width: '70%',
    backgroundColor: Colors.PRIMARY,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginTop: '100%'
  }
})