import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

interface Task {
  type: 'newSentence' | 'completeSentence' | 'orderSentence' | 'trueOrFalse' | 'spellLetters';
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
  question: string;
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
  question,
  completed,
}) => {
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [showCard, setShowCard] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [orderedWords, setOrderedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  useEffect(() => {
    if (type === 'spellLetters' && sentence) {
      setAvailableLetters(sentence.split('').sort(() => Math.random() - 0.5));
    }
  }, [type, sentence]);

  useEffect(() => {
    if (type === 'orderSentence' && words) {
      setAvailableWords(words.slice().sort(() => Math.random() - 0.5));
    }
  }, [type, words]);

  const handleLetterPress = (letter: string) => {
    if (selectedLetters.includes(letter)) {
      setSelectedLetters(selectedLetters.filter(l => l !== letter));
    } else {
      setSelectedLetters([...selectedLetters, letter]);
    }
  };

  const handleSpellCheck = () => {
    const isAnswerCorrect = selectedLetters.join('') === sentence;
    setIsCorrect(isAnswerCorrect);
    setShowCard(true);
    onComplete(isAnswerCorrect);
  };

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
      setOrderedWords(orderedWords.filter(w => w !== word));
      setAvailableWords([...availableWords, word]);
    } else {
      setOrderedWords([...orderedWords, word]);
      setAvailableWords(availableWords.filter(w => w !== word));

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
    setSelectedLetters([]);
    if (type === 'orderSentence' && words) {
      setAvailableWords(words.slice().sort(() => Math.random() - 0.5));
    }
    onNextTask();
  };

  const renderSpellLettersTask = () => (
    <View style={styles.taskContainer}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.spellLettersContainer}>
        {selectedLetters.map((letter, index) => (
          <Text key={index} style={styles.spellLetter}>{letter}</Text>
        ))}
        {[...Array(sentence!.length - selectedLetters.length)].map((_, index) => (
          <Text key={`empty-${index}`} style={styles.spellLetter}>_</Text>
        ))}
      </View>
      <View style={styles.availableLettersContainer}>
        {availableLetters.map((letter, index) => (
          <TouchableOpacity key={index} onPress={() => handleLetterPress(letter)}>
            <Text style={[
              styles.letterButton,
              selectedLetters.includes(letter) && styles.selectedLetterButton,
            ]}>
              {letter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.nextButton} onPress={handleSpellCheck}>
        <Text style={styles.nextButtonText}>Check</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNewSentenceTask = () => (
    <View style={styles.taskContainer}>
      <Text style={styles.title}>{title}</Text>
      {vidUrl && (
        <Video
          source={{ uri: `https://drive.google.com/uc?export=download&id=${vidUrl}` }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onError={(error) => console.error('Video playback error:', error)}
        />
      )}
      <Text style={styles.sentence}>{sentence}</Text>
      <Text style={styles.translate}>{translate}</Text>
      <TouchableOpacity style={styles.nextButton} onPress={handleNextPress}>
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCompleteSentenceTask = () => (
    <View style={styles.taskContainer}>
      {vidUrl && (
        <Video
          source={{ uri: `https://drive.google.com/uc?export=download&id=${vidUrl}` }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onError={(error) => console.error('Video playback error:', error)}
        />
      )}
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

  const renderTrueOrFalseTask = () => (
    <View style={styles.taskContainer}>
      <Text style={styles.title}>{title}</Text>
      {vidUrl && (
        <Video
          source={{ uri: `https://drive.google.com/uc?export=download&id=${vidUrl}` }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onError={(error) => console.error('Video playback error:', error)}
        />
      )}
      <Text style={styles.sentence}>{sentence}</Text>
      <Text style={styles.question}>{question}</Text>
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
    <View style={styles.taskContainer}>
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

  const renderFeedbackCard = () => (
    <View style={[
      styles.card,
      isCorrect ? styles.correctCard : styles.incorrectCard,]}>
      <Text style={styles.cardText}>
        {isCorrect === null ? '' : isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה'}
      </Text>
      <Text>{description}</Text>
      <TouchableOpacity style={styles.nextButton} onPress={handleNextPress}>
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {type === 'newSentence' && renderNewSentenceTask()}
      {type === 'completeSentence' && renderCompleteSentenceTask()}
      {type === 'trueOrFalse' && renderTrueOrFalseTask()}
      {type === 'spellLetters' && renderSpellLettersTask()}
      {type === 'orderSentence' && renderOrderSentenceTask()}
      {showCard && renderFeedbackCard()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  taskContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  sentence: {
    fontSize: 20,
    marginBottom: 8,
    color: '#333',
  },
  translate: {
    fontSize: 18,
    color: '#888',
    marginBottom: 16,
  },
  video: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'column',
    marginTop: 16,
  },
  optionButton: {
    backgroundColor: '#ddd',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 18,
    color: '#333',
  },
  correctOption: {
    backgroundColor: '#C8E6C9',
  },
  incorrectOption: {
    backgroundColor: '#FFCDD2',
  },
  spellLettersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  spellLetter: {
    fontSize: 28,
    marginHorizontal: 4,
  },
  availableLettersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  letterButton: {
    fontSize: 24,
    margin: 4,
    padding: 8,
    backgroundColor: '#ddd',
    borderRadius: 8,
  },
  selectedLetterButton: {
    backgroundColor: '#C8E6C9',
  },
  nextButton: {
    backgroundColor: '#0066CC',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  cardContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  cardText: {
    fontSize: 20,
    marginBottom: 8,
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
});

export default TaskComponent;
