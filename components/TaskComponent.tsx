import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Task {
  type: 'newSentence' | 'completeSentence';
  title: string;
  sentence?: string;
  revealedSentence?: string;
  options?: { [key: string]: string };
  answer?: string;
  onComplete: () => void;
}

const TaskComponent: React.FC<Task> = ({
  type,
  title,
  sentence,
  revealedSentence,
  options,
  answer,
  onComplete,
}) => {
  const renderTask = () => {
    switch (type) {
      case 'newSentence':
        return (
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.sentence}>{sentence}</Text>
          </View>
        );
      case 'completeSentence':
        return (
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.sentence}>{revealedSentence}</Text>
            {options && (
              <View style={styles.optionsContainer}>
                {Object.entries(options).map(([key, option]) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.optionButton}
                    onPress={() => {
                      if (option === answer) {
                        onComplete();
                      }
                    }}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderTask()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sentence: {
    fontSize: 16,
  },
  optionsContainer: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginVertical: 4,
  },
  optionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TaskComponent;