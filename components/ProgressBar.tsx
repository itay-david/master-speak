import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{progress}%</Text>
    <View style={styles.progressBar}>
      <View style={{ ...styles.progress, width: `${progress}%` }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  text: {
    fontSize: 16,
    marginRight: 10,
  },
  progressBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#e0e0df',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#76c7c0',
  },
});

export default ProgressBar;