import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Platform, FlatList, Animated, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CountryFlag from 'react-native-country-flag';
import { Picker } from '@react-native-picker/picker';
import { onValue, getLessonRef, getUserProgressRef, updateUserProgress, ref } from '../auth/firebaseConfig';
import { LanguageData, LessonData, UserProgress } from '../../constants/types';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import ProgressBar from '../../components/ProgressBar';
import { useNavigation } from '@react-navigation/native';
import { get, getDatabase, set, update } from 'firebase/database';

interface LessonItemProps {
  title: string;
  completed: boolean;
  onPress: () => void;
  nextLevel: string;
  imageUrl: string;
}

const LessonItem: React.FC<LessonItemProps> = ({ title, completed, onPress, imageUrl, nextLevel }) => {
  return (
      <View>
      <TouchableOpacity onPress={onPress} style={[styles.lessonItem, completed && styles.lessonComplete]}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl ? `${imageUrl}` : "https://wallpapers.com/images/hd/1920x1080-aesthetic-glrfk0ntspz3tvxg.jpg"}} style={styles.image} />
          {completed && <Ionicons name="checkmark-circle" size={24} color="green" style={styles.checkIcon} />}
        </View>
        <Text style={styles.lessonTitle}>{title}</Text>
      </TouchableOpacity>
      {nextLevel ? <Text style={styles.nextLevelText}>{nextLevel}</Text> : ''}
    </View>
  );
};


const Learn: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [languageData, setLanguageData] = useState<LanguageData | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState('spanish');
  const [currentLevel, setCurrentLevel] = useState('A1');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const navigation = useNavigation();
  const [lastCompletionDate, setLastCompletionDate] = useState<Date | null>(null);

  const languages: any = {
    spanish: 'es',
    french: 'fr',
    german: 'de',
    english: 'us',
  };
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const db = getDatabase();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        // Load user's points and level
        const progressRef = ref(db, `users/${user.uid}/progress`);
        const streakRef = ref(db, `users/${user.uid}`);
        onValue(progressRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setPoints(data.points || 0);
            setLevel(data.level || 1);
          }
        });
        onValue(streakRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setStreak(data.streak || 0);
          }
        });
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const updatePointsAndLevel = async () => {
    if (!userId) return;

    let newPoints = points + 20;
    let newLevel = level;

    if (newPoints >= 100) {
      newPoints = 0;
      newLevel += 1;
    }

    setPoints(newPoints);
    setLevel(newLevel);

    // Update Firebase
    const progressRef = ref(db, `users/${userId}/progress`);
    await update(progressRef, {
      points: newPoints,
      level: newLevel,
    });
  };

  const updateStreak = async () => {
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0]; // Format to YYYY-MM-DD
  
    if (!userId) return;
  
    const streakRef = ref(db, `users/${userId}`);
    
    // Fetch the current streak and last completion date from Firebase
    const snapshot = await get(streakRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const lastCompletionDate = data.lastCompletionDate;
      let newStreak = data.streak || 0;
  
      // If last completion date isn't today, update streak and last completion date
      if (lastCompletionDate !== todayDateString) {
        newStreak += 1; // Increment streak
        await update(streakRef, {
          streak: newStreak,
          lastCompletionDate: todayDateString,
        });
        setStreak(newStreak); // Update local state with new streak value
      }
    } else {
      // If no data exists for the user, start a new streak
      await update(streakRef, {
        streak: 1,
        lastCompletionDate: todayDateString,
      });
      setStreak(1); // Set local streak state to 1
    }
  }

  const handleLessonPress = (lessonKey: string) => {
    navigation.navigate('LessonScreen', {
      userId,
      language: currentLanguage,
      level: currentLevel,
      lessonKey,
    });
    updateStreak()
  };

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    setDropdownVisible(false);
  };

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

  const handleBackgroundPress = () => {
    if (dropdownVisible) {
      setDropdownVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={1}
        onPress={handleBackgroundPress}
      >
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
              <Text style={styles.streakText}>{streak}</Text>
            </View>
            <View style={styles.starContainer}>
            <View style={styles.starWrapper}>
              <Ionicons name="star" size={30} color="#FFD700" style={styles.starIcon} />
              <Text style={styles.levelInsideStar}>{level}</Text>
            </View>
            <Text style={styles.starText}>{`${points}/100`}</Text>
          </View>
          </View>
        </View>

        {dropdownVisible && (
          <Animated.View style={[styles.dropdown, { opacity: fadeAnim }]}>
            <ScrollView style={styles.dropdownScrollView}>
              {Object.keys(languages).map((lang) => (
                <TouchableOpacity key={lang} style={styles.dropdownItem} onPress={() => handleLanguageChange(lang)}>
                  <CountryFlag isoCode={languages[lang]} size={20} style={styles.dropdownFlag} />
                  <Text style={styles.dropdownItemText}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <View style={styles.progressContainer}>
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

        {languageData && Object.keys(languageData.classes).length > 0 ? (
          <FlatList
            data={Object.keys(languageData.classes)}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <LessonItem
                title={languageData.classes[item].title}
                completed={isLessonCompleted(item)}
                imageUrl={languageData.classes[item].imageUrl}
                nextLevel={languageData.classes[item].nextLevel}
                onPress={() => handleLessonPress(item)}
              />
            )}
          />
        ) : (
          <Text>טוען שיעורים...</Text>
        )}
      </TouchableOpacity>
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginRight: 15,
  },
  streakEmoji: {
    fontSize: 20,
    marginLeft: 5,
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pickerContainer: {
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dropdownFlag: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    overflow: 'hidden',
  },
  dropdownItemText: {
    marginRight: 10,
    fontSize: 16,
    color: '#333',
  },
  lessonItem: {
    flexDirection: 'row-reverse', // RTL layout
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginHorizontal: 10,
    borderRadius: 10,
  },
  lessonComplete: {
    flexDirection: 'row-reverse', // RTL layout
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#caf7be',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginHorizontal: 10,
    borderRadius: 10,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10, // Adjusted for RTL
  },
  image: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
  },
  checkIcon: {
    position: 'absolute',
    bottom: -5,
    left: -5, // Adjusted for RTL
  },
  lineBelowImage: {
    width: '100%',
    height: 3,
    backgroundColor: '#e0e0e0', // Default color
    marginTop: 5,
  },
  lineCompleted: {
    backgroundColor: '#4CAF50', // Green color when completed
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10, // Adjusted for RTL
  },
  nextLevelText: {
    fontSize: 18,
    color: '#4CAF50',
    marginTop: 10,
    textAlign: 'right',
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
  noClassesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noClassesText: {
    fontSize: 18,
    color: '#666',
  },
  starWrapper: {
    position: 'relative',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starIcon: {
    position: 'absolute',
    zIndex: 1,
  },
  levelInsideStar: {
    zIndex: 2,
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
    position: 'absolute',
  },
  starContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  starText: {
    marginLeft: 5,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  levelText: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B0082', // A deep indigo color for a richer look
    textShadowColor: 'rgba(75, 0, 130, 0.4)', // A shadow matching the text color
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5, // Slight spacing for a modern feel
    borderColor: '#FFD700', // Gold border to match the starText
    borderWidth: 1,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
});

export default Learn;