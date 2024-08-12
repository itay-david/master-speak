import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface OrderSentenceTaskProps {
  sentence: string;
  shuffledSentence: string;
  onComplete: (isCorrect: boolean) => void;
  onNextTask: () => void;
  completed: boolean;
}

const OrderSentenceTask: React.FC<OrderSentenceTaskProps> = ({ sentence, shuffledSentence, onComplete, onNextTask, completed }) => {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const shuffledWords = shuffledSentence.split(' ');

  const handleWordSelect = (word: string) => {
    setSelectedWords((prev) => [...prev, word]);
  };

  const handleComplete = () => {
    const userSentence = selectedWords.join(' ');
    const isCorrect = userSentence === sentence;
    onComplete(isCorrect);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order the words:</Text>
      <View style={styles.shuffledContainer}>
        {shuffledWords.map((word, index) => (
          <TouchableOpacity key={index} onPress={() => handleWordSelect(word)}>
            <Text style={styles.word}>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.selectedContainer}>
        {selectedWords.map((word, index) => (
          <Text key={index} style={styles.word}>{word}</Text>
        ))}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleComplete} disabled={completed}>
        <Text style={styles.buttonText}>Check Answer</Text>
      </TouchableOpacity>
      {completed && (
        <TouchableOpacity style={styles.button} onPress={onNextTask}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  shuffledContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  word: {
    padding: 10,
    backgroundColor: '#ddd',
    margin: 5,
    borderRadius: 5,
  },
  button: {
    padding: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default OrderSentenceTask;