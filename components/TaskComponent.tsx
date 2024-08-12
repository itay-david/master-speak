import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';

interface Task {
  type: 'newSentence' | 'completeSentence' | 'orderSentence';
  title: string;
  sentence?: string;
  translate?: string;
  description?: string;
  revealedSentence?: string;
  options?: { [key: string]: string };
  answer?: string;
  words?: string[];
  vidUrl?: string;
  onComplete: (isCorrect: boolean) => void;
  onNextTask: () => void;
  taskKey: string;
  completed: boolean;
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
  words,
  vidUrl,
  onComplete,
  onNextTask,
  taskKey,
  completed,
}) => {
  const [showCard, setShowCard] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [orderedWords, setOrderedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  useEffect(() => {
    if (type === 'orderSentence' && words) {
      setAvailableWords(words.slice().sort(() => Math.random() - 0.5));
    }
  }, [type, words]);

  const handleOptionPress = (option: string) => {
    if (selectedOption !== null) return;

    const isAnswerCorrect = option === answer;
    setIsCorrect(isAnswerCorrect);
    setSelectedOption(option);
    setShowCard(true);
    onComplete(isAnswerCorrect);
  };

  const handleWordPress = (word: string, isOrdered: boolean) => {
    if (isOrdered) {
      // Remove the word from orderedWords and add it back to availableWords
      setOrderedWords(orderedWords.filter(w => w !== word));
      setAvailableWords([...availableWords, word]);
    } else {
      // Add the word to orderedWords and remove it from availableWords
      setOrderedWords([...orderedWords, word]);
      setAvailableWords(availableWords.filter(w => w !== word));

      // Check if the sentence is complete
      if (orderedWords.length + 1 === words?.length) {
        const isAnswerCorrect = [...orderedWords, word].join(' ') === words?.join(' ');
        setIsCorrect(isAnswerCorrect);
        setShowCard(true);
        onComplete(isAnswerCorrect);
      }
    }
  };

  const handleNextPress = () => {
    setShowCard(false);
    setSelectedOption(null);
    setIsCorrect(null);
    setOrderedWords([]);
    if (type === 'orderSentence' && words) {
      setAvailableWords(words.slice().sort(() => Math.random() - 0.5));
    }
    onNextTask();
  };

  const renderNewSentenceTask = () => (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sentence}>{revealedSentence || sentence}</Text>
      <TouchableOpacity style={styles.nextButton} onPress={handleNextPress}>
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCompleteSentenceTask = () => (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sentence}>{selectedOption === answer ? revealedSentence : sentence}</Text>
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
              disabled={selectedOption !== null}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderOrderSentenceTask = () => (
    <View style={styles.orderSentenceContainer}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.sentenceContainer}>
        {orderedWords.map((word, index) => (
          <TouchableOpacity
            key={index}
            style={styles.orderedWordContainer}
            onPress={() => handleWordPress(word, true)}
          >
            <Text style={styles.orderedWord}>{word}</Text>
          </TouchableOpacity>
        ))}
        {[...Array(words!.length - orderedWords.length)].map((_, index) => (
          <View key={`empty-${index}`} style={styles.emptyWordContainer} />
        ))}
      </View>
      <Text style={styles.instructionText}>Tap words to add or remove them</Text>
      <View style={styles.availableWordsContainer}>
        {availableWords.map((word, index) => (
          <TouchableOpacity
            key={index}
            style={styles.wordButton}
            onPress={() => handleWordPress(word, false)}
          >
            <Text style={styles.wordButtonText}>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTask = () => {
    switch (type) {
      case 'newSentence':
        return renderNewSentenceTask();
      case 'completeSentence':
        return renderCompleteSentenceTask();
      case 'orderSentence':
        return renderOrderSentenceTask();
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
            isCorrect ? styles.correctCard : styles.incorrectCard,
          ]}
        >
          <Text style={styles.resultText}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </Text>
          <Text style={styles.description}>{description}</Text>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !isCorrect ? styles.incorrectNextButton : {},
            ]}
            onPress={handleNextPress}
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
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 16,
  },
  incorrectNextButton: {
    backgroundColor: '#F44336',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderSentenceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sentenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    minHeight: 50,
  },
  orderedWordContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 10,
    margin: 5,
    minWidth: 60,
    alignItems: 'center',
  },
  orderedWord: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  emptyWordContainer: {
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
    padding: 10,
    margin: 5,
    minWidth: 60,
    height: 44,
  },
  instructionText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 10,
  },
  availableWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
  },
  wordButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    margin: 5,
  },
  wordButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  video: {
    width: width * 0.8,
    height: height * 0.4,
    marginBottom: 20,
  },
});

export default TaskComponent;