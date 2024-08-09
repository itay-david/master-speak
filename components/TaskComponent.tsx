import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';

interface Task {
  type: 'newSentence' | 'completeSentence';
  title: string;
  sentence?: string;
  translate?: string;
  description?: string;
  revealedSentence?: string;
  options?: { [key: string]: string };
  answer?: string;
  onComplete: () => void;
  swiperRef: any;  // Add this prop to receive swiper reference
  taskKey: string; // Add this prop to identify the task
  completed: boolean; // Add this prop to determine if the task is completed
}

const TaskComponent: React.FC<Task> = ({
  type,
  title,
  sentence,
  revealedSentence,
  translate,
  description,
  options,
  answer,
  onComplete,
  swiperRef,
  taskKey,
  completed,
}) => {
  const [showCard, setShowCard] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleOptionPress = (option: string) => {
    const isAnswerCorrect = option === answer;
    setIsCorrect(isAnswerCorrect);
    setSelectedOption(option);
    setShowCard(true);
    if (isAnswerCorrect) {
      onComplete();
    }
  };

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
            <Text style={styles.sentence}>{revealedSentence || sentence}</Text>
            {options && (
              <View style={styles.optionsContainer}>
                {Object.entries(options).map(([key, option]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.optionButton,
                      selectedOption === option
                        ? option === answer
                          ? styles.correctOption
                          : styles.incorrectOption
                        : {},
                    ]}
                    onPress={() => handleOptionPress(option)}
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
      {showCard && (
        <Animated.View
          style={[
            styles.card,
            isCorrect === true
              ? styles.correctCard
              : isCorrect === false
              ? styles.incorrectCard
              : {},
          ]}
        >
          <Text style={styles.resultText}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </Text>
          <Text style={styles.description}>{description}</Text>
          <TouchableOpacity
            style={[
              styles.nextButton,
              isCorrect === false ? styles.incorrectNextButton : {},
            ]}
            onPress={() => swiperRef.current.scrollBy(1)}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#E0F7FA',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sentence: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  optionButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 8,
  },
  optionText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  correctOption: {
    backgroundColor: '#4CAF50',
  },
  incorrectOption: {
    backgroundColor: '#F44336',
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  correctCard: {
    backgroundColor: '#C8E6C9',
  },
  incorrectCard: {
    backgroundColor: '#FFCDD2',
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
  },
  incorrectNextButton: {
    backgroundColor: '#F44336',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TaskComponent;
