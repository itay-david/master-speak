import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Platform, FlatList, Animated, ScrollView, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CountryFlag from 'react-native-country-flag';
import { onValue, getLessonRef, getUserProgressRef, updateUserProgress, ref } from '../auth/firebaseConfig';
import { LanguageData, LessonData, UserProgress } from '../../constants/types';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import ProgressBar from '../../components/ProgressBar';
import { useNavigation } from '@react-navigation/native';
import { get, getDatabase, set, update } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

interface LessonItemProps {
  title: string;
  completed: boolean;
  onPress: () => void;
  nextLevel: string;
  imageUrl: string;
  isLocked: boolean;
  isCurrent: boolean;
  index: number;
}

const colors = ['#FFA07A', '#98D8C8', '#4ECDC4', '#45B7D1', '#F7DC6F'];

const LessonItem: React.FC<LessonItemProps> = ({ title, index, completed, onPress, imageUrl, nextLevel, isLocked, isCurrent }) => {
  const backgroundColor = colors[index % colors.length];
  
  return (
    <TouchableOpacity onPress={onPress} style={styles.shadowBox}>
      <LinearGradient
        colors={[backgroundColor, backgroundColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.lessonItem,
          completed && styles.lessonComplete,
          isLocked && styles.lessonLocked,
          isCurrent && styles.lessonCurrent
        ]}
      >
        <View style={styles.insetShadow} />
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl || "https://www.pngplay.com/wp-content/uploads/12/Thing-Transparent-Images.png" }}
            style={styles.image}
          />
          {completed && <Ionicons name="checkmark-circle" size={24} color="green" style={styles.checkIcon} />}
          {isLocked && <Ionicons name="lock-closed" size={24} color="gray" style={styles.lockIcon} />}
        </View>
        <Text style={[styles.lessonTitle, isLocked && styles.lockedText]}>{title}</Text>
        {nextLevel && <Text style={styles.nextLevelText}>{nextLevel}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
};


const LoadingItem: React.FC = () => {
  return (
    <View style={styles.loadingItem}>
      <View style={styles.loadingImageContainer}>
        <LinearGradient
          colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          style={styles.loadingImage}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
      <View style={styles.loadingTextContainer}>
        <LinearGradient
          colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          style={styles.loadingText}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
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
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);

  const languages: any = {
    spanish: 'es',
    french: 'fr',
    german: 'de',
    english: 'us',
  };
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const db = getDatabase();
  const windowHeight = Dimensions.get('window').height;

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const progressRef = ref(db, `users/${user.uid}/progress`);
        const streakRef = ref(db, `users/${user.uid}`);
        onValue(progressRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setPoints(data.points || 0);
            setLevel(data.level || 1);
          }
        });
        // Check and reset streak if necessary
        const currentStreak = await checkAndResetStreak(user.uid);
        setStreak(currentStreak);
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

    const progressRef = ref(db, `users/${userId}/progress`);
    await update(progressRef, {
      points: newPoints,
      level: newLevel,
    });
  };

  const checkAndResetStreak = async (userId: string) => {
    const streakRef = ref(db, `users/${userId}`);
    const snapshot = await get(streakRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const lastCompletionDate = new Date(data.lastCompletionDate);
      const currentDate = new Date();
      
      // Calculate the difference in days
      const diffTime = Math.abs(currentDate.getTime() - lastCompletionDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        // Reset streak if more than a day has passed
        await update(streakRef, {
          streak: 0,
          lastCompletionDate: currentDate.toISOString().split('T')[0],
        });
        return 0;
      }
    }
    
    return snapshot.exists() ? snapshot.val().streak : 0;
  };

  const updateStreak = async (userId: string) => {
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];
  
    if (!userId) return;
  
    const streakRef = ref(db, `users/${userId}`);
    
    // First, check and reset streak if necessary
    const currentStreak = await checkAndResetStreak(userId);
    
    const snapshot = await get(streakRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const lastCompletionDate = data.lastCompletionDate;
      let newStreak = currentStreak;
  
      if (lastCompletionDate !== todayDateString) {
        newStreak += 1;
        await update(streakRef, {
          streak: newStreak,
          lastCompletionDate: todayDateString,
        });
      }
      return newStreak;
    } else {
      await update(streakRef, {
        streak: 1,
        lastCompletionDate: todayDateString,
      });
      return 1;
    }
  };

  const handleLessonPress = async (lessonKey: string) => {
    if (!isLessonLocked(Object.keys(languageData?.classes || {}).indexOf(lessonKey))) {
      navigation.navigate('LessonScreen', {
        userId,
        language: currentLanguage,
        level: currentLevel,
        lessonKey,
      });
      if (userId) {
        const newStreak = await updateStreak(userId);
        setStreak(newStreak);
      }
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      const savedLevel = await AsyncStorage.getItem('selectedLevel');
      
      if (savedLanguage !== null) {
        setCurrentLanguage(savedLanguage);
      }
      if (savedLevel !== null) {
        setCurrentLevel(savedLevel);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreference = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error saving ${key} preference:`, error);
    }
  };

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    savePreference('selectedLanguage', language);
    setDropdownVisible(false);
  };

  const handleLevelChange = (level: string) => {
    setCurrentLevel(level);
    savePreference('selectedLevel', level);
  };

  useEffect(() => {
    setIsLoading(true);
    const lessonRef = getLessonRef(currentLanguage, currentLevel);
    const progressRef = getUserProgressRef(userId);

    const unsubscribeLessons = onValue(lessonRef, (snapshot) => {
      const data = snapshot.val() as LanguageData;
      setLanguageData(data);
      setIsLoading(false);
    });

    const unsubscribeProgress = onValue(progressRef, (snapshot) => {
      const data = snapshot.val() as UserProgress;
      setUserProgress(data);
      updateCurrentLessonIndex(data);
    });

    return () => {
      unsubscribeLessons();
      unsubscribeProgress();
    };
  }, [userId, currentLanguage, currentLevel]);

  const updateCurrentLessonIndex = (progressData: UserProgress) => {
    if (languageData) {
      const lessonKeys = Object.keys(languageData.classes);
      const currentIndex = lessonKeys.findIndex(key => !progressData[currentLanguage]?.[currentLevel]?.[key]?.completed);
      setCurrentLessonIndex(currentIndex === -1 ? lessonKeys.length - 1 : currentIndex);
    }
  };

  useEffect(() => {
    if (languageData && userProgress) {
      const totalLessons = Object.keys(languageData.classes).length;
      const completedLessons = Object.values(userProgress[currentLanguage]?.[currentLevel] || {}).filter(
        (lesson: any) => lesson.completed
      ).length;
      setProgress(totalLessons > 0 ? completedLessons / totalLessons : 0);
      updateCurrentLessonIndex(userProgress);
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

  const isLessonLocked = (index: number) => {
    if (index === 0) return false; // First lesson is always unlocked
    const previousLessonKey = Object.keys(languageData?.classes || {})[index - 1];
    return !isLessonCompleted(previousLessonKey);
  };

  const handleBackgroundPress = () => {
    if (dropdownVisible) {
      setDropdownVisible(false);
    }
  };

  useEffect(() => {
    if (flatListRef.current && currentLessonIndex !== -1) {
      flatListRef.current.scrollToIndex({
        index: currentLessonIndex,
        animated: true,
        viewPosition: 0.5,
        viewOffset: windowHeight * 0.25, // Scroll to middle of the screen
      });
    }
  }, [currentLessonIndex]);

  const renderItem = ({ item, index }: { item: string; index: number }) => (
    <LessonItem
      title={languageData?.classes[item].title || ''}
      completed={isLessonCompleted(item)}
      imageUrl={languageData?.classes[item].imageUrl || ''}
      nextLevel={languageData?.classes[item].nextLevel || ''}
      onPress={() => handleLessonPress(item)}
      isLocked={isLessonLocked(index)}
      isCurrent={index === currentLessonIndex}
      index={index}
    />
  );

  const renderLoadingItems = () => {
    return Array(10).fill(null).map((_, index) => (
      <LoadingItem key={index} />
    ));
  };

  const renderLevelButton = (levelName: string) => (
    <TouchableOpacity
      style={[
        styles.levelButton,
        currentLevel === levelName && styles.activeLevelButton
      ]}
      onPress={() => handleLevelChange(levelName)}
    >
      <LinearGradient
        colors={currentLevel === levelName ? ['#4CAF50', '#45a049'] : ['#f0f0f0', '#e0e0e0']}
        style={styles.levelButtonGradient}
      >
        <Text style={[
          styles.levelButtonText,
          currentLevel === levelName && styles.activeLevelButtonText
        ]}>
          {levelName}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

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

      <View style={styles.levelSelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {levels.map((level) => renderLevelButton(level))}
        </ScrollView>
      </View>

      {isLoading ? (
        <ScrollView contentContainerStyle={styles.loadingContainer}>
          {renderLoadingItems()}
        </ScrollView>
      ) : languageData && Object.keys(languageData.classes).length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={Object.keys(languageData.classes)}
          keyExtractor={(item) => item}
          renderItem={renderItem}
          getItemLayout={(data, index) => ({
            length: 120,
            offset: 120 * index,
            index,
          })}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View style={styles.noClassesContainer}>
          <Text style={styles.noClassesText}>No lessons available for this level.</Text>
        </View>
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
levelSelectorContainer: {
  marginVertical: 10,
  paddingHorizontal: 10,
},
levelButton: {
  marginHorizontal: 5,
  borderRadius: 20,
  overflow: 'hidden',
},
levelButtonGradient: {
  paddingVertical: 10,
  paddingHorizontal: 15,
},
activeLevelButton: {
  borderWidth: 2,
  borderColor: '#4CAF50',
},
levelButtonText: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#333',
},
activeLevelButtonText: {
  color: '#ffffff',
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
  width: 25,
  height: 25,
  borderRadius: 12.5,
  overflow: 'hidden',
  marginRight: 10,
},
dropdownItemText: {
  fontSize: 16,
  color: '#333',
},
shadowBox: {
 marginVertical: 10,
},
insetShadow: {
  position: 'absolute',
  top: 80,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: 0,
  zIndex: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.15)', // Semi-transparent overlay for inner shadow
},
lessonItem: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 14,
  paddingVertical: 16,
  backgroundColor: '#ffffff',
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
  marginHorizontal: 25,
  borderRadius: 15,
  marginVertical: 5,
  shadowColor:"#000000",
shadowOffset: {
   width: 0,
   height: 5,
},
shadowOpacity: 1,
shadowRadius: 0,
elevation: 10
},
lessonComplete: {
  backgroundColor: '#e8f5e9',
},
lessonLocked: {
  backgroundColor: '#f5f5f5',
  opacity: 0.7,
},
lessonCurrent: {
  borderWidth: 2,
  borderColor: '#fff',
  transform: [{ scale: 1.05 }],
  shadowColor: "#00fffb",
shadowOffset: {
  width: 0,
  height: 9,
},
shadowOpacity:  0.22,
shadowRadius: 9.22,
elevation: 12
},
imageContainer: {
  position: 'relative',
  marginRight: 10,
  zIndex: 3,
},
image: {
  width: 70,
  height: 70,
},
checkIcon: {
  position: 'absolute',
  bottom: -5,
  right: -5,
  backgroundColor: '#ffffff',
  borderRadius: 12,
},
lockIcon: {
  position: 'absolute',
  bottom: -5,
  right: -5,
  backgroundColor: '#ffffff',
  borderRadius: 12,
},
lessonTitle: {
  flex: 1,
  fontSize: 16,
  fontWeight: 'bold',
  color: '#fff',
},
lockedText: {
  color: '#fff',
},
nextLevelText: {
  fontSize: 14,
  color: '#4CAF50',
  marginLeft: 10,
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
  flexDirection: 'row',
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
  fontSize: 16,
  fontWeight: '700',
  color: '#FFD700',
  textShadowColor: 'rgba(0, 0, 0, 0.2)',
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 2,
},
loadingContainer: {
  paddingVertical: 20,
},
loadingItem: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  backgroundColor: '#ffffff',
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
  marginHorizontal: 10,
  borderRadius: 10,
  marginVertical: 5,
},
loadingImageContainer: {
  width: 65,
  height: 65,
  borderRadius: 32.5,
  overflow: 'hidden',
  marginRight: 10,
},
loadingImage: {
  width: '100%',
  height: '100%',
},
loadingTextContainer: {
  flex: 1,
  height: 20,
  borderRadius: 5,
  overflow: 'hidden',
},
loadingText: {
  width: '100%',
  height: '100%',
},
});

export default Learn;