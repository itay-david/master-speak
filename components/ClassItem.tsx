import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface ClassItemProps {
  className: string;
  isCompleted: boolean;
  onPress: () => void;
}

const ClassItem: React.FC<ClassItemProps> = ({ className, isCompleted, onPress }) => (
  <TouchableOpacity style={styles.container} onPress={onPress}>
    <Text style={styles.text}>{className}</Text>
    {isCompleted && <FontAwesome name="check-circle" size={24} color="green" />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  text: {
    fontSize: 16,
  },
});

export default ClassItem;