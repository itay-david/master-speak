import { View, Text, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import { handleSignOut } from '@/constants/authUtils'
import { Redirect } from "expo-router";
import { useAuth } from '../../constants/AuthContext';

export default function Profile() {

  const { user, isLoggedIn } = useAuth();
  
  const logOut = async () => {
    await handleSignOut();
  };
  
  if(!isLoggedIn) {return <Redirect href='/auth' />;}
  

  return (
    <View>
      <Text>Profile</Text>
      <TouchableOpacity onPress={logOut}>
        <Text>Sign Out</Text>
      </TouchableOpacity>

      <Text>{user?.displayName}</Text>
    </View>
  )
}