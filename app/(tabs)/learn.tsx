import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Platform, FlatList, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CountryFlag from 'react-native-country-flag';
import { Picker } from '@react-native-picker/picker';
import { onValue, getLessonRef, getUserProgressRef, updateUserProgress } from '../auth/firebaseConfig';
import { LanguageData, LessonData, UserProgress } from '../../constants/types';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import ProgressBar from '../../components/ProgressBar';

interface LessonItemProps {
  title: string;
  completed: boolean;
  onPress: () => void;
}

const LessonItem: React.FC<LessonItemProps> = ({ title, completed, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.lessonItem}>
      <Text style={styles.lessonTitle}>{title}</Text>
      {completed && <Ionicons name="checkmark-circle" size={24} color="green" />}
    </TouchableOpacity>
  );
};

interface LearnProps {
  userId: string;
}

const Learn: React.FC<LearnProps> = () => {
  const [progress, setProgress] = useState(0);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const [languageData, setLanguageData] = useState<LanguageData | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState('spanish');
  const [currentLevel, setCurrentLevel] = useState('A1');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const languages: any = {
    spanish: 'es',
    french: 'fr',
    german: 'de',
    english: 'us'
  };
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  useEffect(() => {
    if (languageData && userProgress) {
      const totalLessons = Object.keys(languageData.classes).length;
      const completedLessons = Object.values(userProgress[currentLanguage]?.[currentLevel] || {}).filter(
        (lesson: any) => lesson.completed
      ).length;
      setProgress(totalLessons > 0 ? completedLessons / totalLessons : 0);
    }
  }, [languageData, userProgress, currentLanguage, currentLevel]);

  useEffect(() => {
    const lessonRef = getLessonRef(currentLanguage, currentLevel);
    const progressRef = getUserProgressRef(userId);

    const unsubscribeLessons = onValue(lessonRef, (snapshot) => {
      const data = snapshot.val() as LanguageData;
      setLanguageData(data);
    });

    const unsubscribeProgress = onValue(progressRef, (snapshot) => {
      const data = snapshot.val() as UserProgress;
      setUserProgress(data);
    });

    return () => {
      unsubscribeLessons();
      unsubscribeProgress();
    };
  }, [userId, currentLanguage, currentLevel]);

  const handleLessonPress = (lessonKey: string) => {
    updateUserProgress(userId, currentLanguage, currentLevel, lessonKey, true)
      .then(() => console.log('User progress updated successfully'))
      .catch((error) => console.error('Error updating user progress:', error));
  };

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    setDropdownVisible(false);
  };

  useEffect(() => {
    if (dropdownVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [dropdownVisible]);

  const isLessonCompleted = (lessonKey: string) => {
    return userProgress?.[currentLanguage]?.[currentLevel]?.[lessonKey]?.completed || false;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <View style={styles.flagArrowContainer}>
          <TouchableOpacity style={styles.flagButton} onPress={() => setDropdownVisible(!dropdownVisible)}>
            <CountryFlag style={styles.flagEmoji} isoCode={languages[currentLanguage]} size={20} />
          </TouchableOpacity>
          <Ionicons name="chevron-down" size={16} color="black" style={styles.arrowIcon} />
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.streakContainer}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>7</Text>
          </View>
          <View style={styles.starContainer}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.starText}>15/20</Text>
          </View>
        </View>
      </View>

      {dropdownVisible && (
        <Animated.View style={[styles.dropdown, { opacity: fadeAnim }]}>
          <ScrollView style={styles.dropdownScrollView}>
            {Object.keys(languages).map((lang) => (
              <TouchableOpacity key={lang} style={styles.dropdownItem} onPress={() => handleLanguageChange(lang)}>
                <CountryFlag isoCode={languages[lang]} size={20} style={styles.dropdownFlag}  />
                <Text style={styles.dropdownItemText}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Your Progress</Text>
        <ProgressBar progress={progress} />
        <Text style={styles.progressPercentage}>{`${Math.round(progress * 100)}%`}</Text>
      </View>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={currentLevel}
          onValueChange={(itemValue) => setCurrentLevel(itemValue)}
          style={styles.picker}
        >
          {levels.map((level) => (
            <Picker.Item key={level} label={level} value={level} />
          ))}
        </Picker>
      </View>

      <FlatList
        data={languageData ? Object.entries(languageData.classes) : []}
        keyExtractor={([key]) => key}
        renderItem={({ item: [key, value] }) => (
          <LessonItem
            title={value.title}
            completed={isLessonCompleted(key)}
            onPress={() => handleLessonPress(key)}
          />
        )}
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  flagArrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginRight: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  flagEmoji: {
    width: '100%',
    height: '100%',
  },
  arrowIcon: {
    marginLeft: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  streakEmoji: {
    fontSize: 20,
    marginRight: 5,
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starText: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  picker: {
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 6,
    maxWidth: 200,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dropdownFlag: {

  },
  dropdownItemText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  lessonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'right',
    marginTop: 5,
  },
});

export default Learn;