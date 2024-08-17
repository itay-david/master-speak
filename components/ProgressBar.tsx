import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // Value between 0 and 1
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.progress, { width: `${progress * 100}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-end',
  },
});

export default ProgressBar;
