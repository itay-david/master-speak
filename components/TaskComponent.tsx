import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Button, Image } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as Speech from 'expo-speech';



interface Task {
  type: 'newSentence' | 'completeSentence' | 'orderSentence' | 'trueOrFalse' | 'spellLetters' | 'matchThePairs' | 'chooseRight';
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
  pairs?: { [key: string]: string };
  language: string;
  imageUrl: string;
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
  pairs,
  language,
  imageUrl
}) => {
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [showCard, setShowCard] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [orderedWords, setOrderedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<{ [key: string]: string }>({});
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null);
  const [taskCompleted, setTaskCompleted] = useState(false);

  
  const getLanguageCode = (lang: string): string => {
    switch (lang) {
      case 'spanish':
        return 'es';
      case 'french':
        return 'fr';
      case 'german':
        return 'de';
      case 'english':
        return 'en';
      default:
        return 'en';
    }
  };

  const speak = (text: string) => {
    Speech.speak(text, {
      language: getLanguageCode(language),
      pitch: 1, // Adjust pitch if needed
      rate: 0.75,  // Adjust rate if needed
    });
  };


  useEffect(() => {
    if (type === 'spellLetters' && sentence) {
      setAvailableLetters(sentence.split('').sort(() => Math.random() - 0.5));
    }
    if (type === 'orderSentence' && words) {
      setAvailableWords(words.slice().sort(() => Math.random() - 0.5));
    }
  }, [type, sentence, words]);

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

  const handlePairSelection = (item: string) => {
    if (taskCompleted) return;

    const availableKeys = Object.keys(pairs!).filter(key => !matchedPairs[key]);
    if (availableKeys.length > 0) {
      const newKey = availableKeys[0];
      const newMatchedPairs = { ...matchedPairs, [newKey]: item };
      setMatchedPairs(newMatchedPairs);

      if (Object.keys(newMatchedPairs).length === Object.keys(pairs!).length) {
        const isAllCorrect = Object.entries(newMatchedPairs).every(
          ([key, value]) => pairs![key] === value
        );
        setTaskCompleted(true);
        setIsCorrect(isAllCorrect);
        onComplete(isAllCorrect);
        setShowCard(true);
      }
    }
  };

  const handleContainerSelection = (key: string) => {
    setSelectedContainer(key);
  };

  const handleNextPress = () => {
    setShowCard(false);
    setSelectedOption(null);
    setIsCorrect(null);
    setOrderedWords([]);
    setSelectedLetters([]);
    setMatchedPairs({});
    setSelectedContainer(null);
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
      {/* {vidUrl && (
        <Video
          source={{ uri: `https://drive.google.com/uc?export=download&id=${vidUrl}` }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onError={(error) => console.error('Video playback error:', error)}
        />
      )} */}
      

      <TouchableOpacity onPress={() => speak({sentence}.sentence, getLanguageCode(language))}>
        <Image
          style={styles.video}
          source={{
            uri: `${imageUrl}`,
          }}
        />
      </TouchableOpacity>
      <Text style={styles.sentence}>{sentence}</Text>
      <Text style={styles.translate}>{translate}</Text>
    </View>
  );

  const renderCompleteSentenceTask = () => (
    <View style={styles.taskContainer}>
      <Text style={styles.title}>{title}</Text>
      {/* {vidUrl && (
        <Video
          source={{ uri: `https://drive.google.com/uc?export=download&id=${vidUrl}` }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onError={(error) => console.error('Video playback error:', error)}
        />
      )} */}

      <TouchableOpacity onPress={() => speak({revealedSentence}.revealedSentence, getLanguageCode(language))}>
        <Image
          style={styles.video}
          source={{
            uri: `${imageUrl}`,
          }}
        />
      </TouchableOpacity>
      <Text style={selectedOption === answer ? styles.revealedSentence : styles.sentence}>{selectedOption === answer ? revealedSentence : sentence}</Text>
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
      {/* {vidUrl && (
        <Video
          source={{ uri: `https://drive.google.com/uc?export=download&id=${vidUrl}` }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay`
          onError={(error) => console.error('Video playback error:', error)}
        />
      )} */}

    <TouchableOpacity onPress={() => speak({sentence}.sentence, getLanguageCode(language))}>
        <Image
          style={styles.video}
          source={{
            uri: `${imageUrl}`,
          }}
        />
      </TouchableOpacity>
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

  const renderChooseRightTask = () => (
    <View style={styles.taskContainer}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.title}>{question}</Text>
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
      <TouchableOpacity onPress={() => speak({sentence}.sentence, getLanguageCode(language))}>
        <Image
          style={styles.video}
          source={{
            uri: `${imageUrl}`,
          }}
        />
      </TouchableOpacity>
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
      <Text style={styles.instructionText}>לחצו על המילים בשביל להוסיף או להוריד.</Text>
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

  const renderMatchThePairsTask = () => (
    <ScrollView contentContainerStyle={styles.taskContainer}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.pairsContainer}>
        {Object.keys(pairs!).map((key) => (
          <View
            key={`container-${key}`}
            style={[
              styles.pairContainer,
              taskCompleted && (
                matchedPairs[key] === pairs![key] 
                  ? styles.correctPairContainer 
                  : styles.incorrectPairContainer
              ),
            ]}
          >
            <Text style={styles.pairContainerText}>{key}</Text>
            {matchedPairs[key] && (
              <Text style={[
                styles.matchedPairText,
                taskCompleted && (
                  matchedPairs[key] === pairs![key]
                    ? styles.correctMatchText
                    : styles.incorrectMatchText
                ),
              ]}>
                {matchedPairs[key]}
              </Text>
            )}
          </View>
        ))}
      </View>
      <View style={styles.pairsOptionsContainer}>
        {Object.values(pairs!).map((value) => (
          <TouchableOpacity
            key={`value-${value}`}
            style={[
              styles.pairOption,
              Object.values(matchedPairs).includes(value) && styles.matchedPairOption,
            ]}
            onPress={() => handlePairSelection(value)}
            disabled={Object.values(matchedPairs).includes(value) || taskCompleted}
          >
            <Text style={styles.pairOptionText}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderNextButton = () => (
    <View style={styles.nextButtonFree}>
      <TouchableOpacity style={styles.nextButton} onPress={handleNextPress}>
        <Text style={styles.nextButtonText}>הבא</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFeedbackCard = () => (
    <View style={[
      styles.card,
      isCorrect ? styles.correctCard : styles.incorrectCard,
    ]}>
      <Text style={styles.cardText}>
        {isCorrect === null ? '' : isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה'}
      </Text>
      <Text>{description}</Text>
      <TouchableOpacity style={styles.nextButton} onPress={handleNextPress}>
        <Text style={styles.nextButtonText}>הבא</Text>
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
      {type === 'matchThePairs' && renderMatchThePairsTask()}
      {type === 'chooseRight' && renderChooseRightTask()}
      {showCard && renderFeedbackCard()}
      {type === 'newSentence' && renderNextButton()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3faff',
    padding: 16,
  },
  taskContainer: {
    marginHorizontal: 10
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#068cde',
  },
  sentence: {
    fontSize: 24,
    marginBottom: 8,
    color: '#333',
  },
  revealedSentence: {
    fontSize: 24,
    marginBottom: 8,
    color: '#4CAF50',
    fontWeight: '600'
  },
  question: {
    fontSize: 20,
    textAlign: 'right',
    marginBottom: 16,
    color: '#4a4949'
  },
  translate: {
    fontSize: 20,
    color: '#888',
    marginBottom: 16,
  },
  video: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  nextButtonFree: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    marginBottom: 10
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
  pairsContainer: {
    marginBottom: 20,
  },
  pairContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    minHeight: 50,
    justifyContent: 'center',
  },
  correctPairContainer: {
    backgroundColor: '#C8E6C9',
  },
  incorrectPairContainer: {
    backgroundColor: '#FFCDD2',
  },
  pairContainerText: {
    fontSize: 18,
    color: '#1565C0',
  },
  matchedPairText: {
    fontSize: 16,
    // color: '#4CAF50',
    marginTop: 5,
  },
  correctMatchText: {
    color: '#2E7D32',
  },
  incorrectMatchText: {
    color: '#C62828',
  },
  pairsOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pairOption: {
    backgroundColor: '#2196F3',
    borderRadius: 25,
    padding: 10,
    margin: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  matchedPairOption: {
    backgroundColor: '#FFFFFF',
  },
  pairOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default TaskComponent;