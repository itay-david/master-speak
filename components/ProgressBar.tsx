import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  progress: number; // Value between 0 and 1
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#005f80', '#8ad3ff']} // Gradient colors from dark to light blue
        start={{ x: 0, y: 0.5 }} // Start on the left
        end={{ x: 1, y: 0.5 }}   // End on the right
        style={[styles.progress, { width: `${progress * 100}%` }]} // Progress width based on progress prop
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden', // To ensure the progress bar stays within the rounded corners
  },
  progress: {
    height: '100%',
    borderRadius: 4, // To match the container's border radius
    alignSelf: 'flex-end',
  },
});

export default ProgressBar;
