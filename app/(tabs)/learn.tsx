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

const colors = ['#83C5BE', '#CEA47E', '#588157', '#D00000', '#efc3e6'];

const colorImageMapping = {
  '#83C5BE': {
    shine: require('../../assets/LessonItems/shine_lightblue.png'),
    bottomCurve: require('../../assets/LessonItems/bottom_curve_lightblue.png'),
  },
  '#CEA47E': {
    shine: require('../../assets/LessonItems/shine_brown.png'),
    bottomCurve: require('../../assets/LessonItems/bottom_curve_brown.png'),
  },
  '#588157': {
    shine: require('../../assets/LessonItems/shine_green.png'),
    bottomCurve: require('../../assets/LessonItems/bottom_curve_green.png'),
  },
  '#D00000': {
    shine: require('../../assets/LessonItems/shine_red.png'),
    bottomCurve: require('../../assets/LessonItems/bottom_curve_red.png'),
  },
  '#efc3e6': {
    shine: require('../../assets/LessonItems/shine_pink.png'),
    bottomCurve: require('../../assets/LessonItems/bottom_curve_pink.png'),
  },
};

const LessonItem: React.FC<LessonItemProps> = ({ title, index, completed, onPress, imageUrl, nextLevel, isLocked, isCurrent }) => {
  const backgroundColor = colors[index % colors.length];
  const { shine: shineImageSource, bottomCurve: bottomCurveImageSource } = colorImageMapping[backgroundColor];
  
  return (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient
        colors={[backgroundColor, backgroundColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.lessonItem,
          styles.shadowBox,
          completed && styles.lessonComplete,
          isLocked && styles.lessonLocked,
          isCurrent && styles.lessonCurrent
        ]}
      >
        <View style={styles.contentContainer}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUrl || "https://www.pngplay.com/wp-content/uploads/12/Thing-Transparent-Images.png" }}
              style={styles.image}
            />
            {completed && <Ionicons name="checkmark-circle" size={24} color="green" style={styles.checkIcon} />}
            {isLocked && <Ionicons name="lock-closed" size={24} color="gray" style={styles.lockIcon} />}
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.lessonTitle, isLocked && styles.lockedText]}>{title}</Text>
            {nextLevel && <Text style={styles.nextLevelText}>{nextLevel}</Text>}
          </View>
        </View>
        <Image source={shineImageSource} style={styles.shineEffect} />
        <Image source={bottomCurveImageSource} style={styles.bottomCurve} />
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

const StarLevel = ({ level }) => {
  let levelStyle;

  if (level < 10) {
    levelStyle = styles.singleDigitLevel;
  } else if (level >= 100) {
    levelStyle = styles.threeDigitLevel;
  } else {
    // Handles levels between 10 and 99
    levelStyle = styles.doubleDigitLevel;
  }

  return (
    <View style={styles.starWrapper}>
      <Image
        source={require('../../assets/home_pics/star_level.png')}
        style={styles.starIcon}
      />
      <Text style={[styles.levelInsideStar, levelStyle]}>
        {level}
      </Text>
    </View>
  );
};

const StreakLevel = ({ streak }) => {
  let streakStyle;

  if (streak < 10) {
    streakStyle = styles.singleDigitStreak;
  } else if (streak >= 100) {
    streakStyle = styles.threeDigitStreak;
  } else {
    streakStyle = styles.doubleDigitStreak;
  }

  return (
    <View style={styles.streakWrapper}>
      <Image
        source={require('../../assets/home_pics/fire_streak.png')}
        style={styles.fireIcon}
      />
      <Text style={[styles.streakInsideFire, streakStyle]}>
        {streak}
      </Text>
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
    spanish: { code: 'es', title: 'ספרדית' },
    french: { code: 'fr', title: 'צרפתית' },
    german: { code: 'de', title: 'גרמנית' },
    english: { code: 'us', title: 'אנגלית' },
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
              <CountryFlag style={styles.flagEmoji} isoCode={languages[currentLanguage].code} size={20} />
            </TouchableOpacity>
            <Ionicons name="chevron-down" size={16} color="black" style={styles.arrowIcon} />
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.streakContainer}>
              <StreakLevel streak={streak} />
            </View>
            <View style={styles.starContainer}>
              <StarLevel level={level} />
              <Text style={styles.starText}>{`${points}/100`}</Text>
            </View>
          </View>
        </View>
        {dropdownVisible && (
          <Animated.View style={[styles.dropdown, { opacity: fadeAnim }]}>
            <ScrollView style={styles.dropdownScrollView}>
              {Object.keys(languages).map((lang) => (
                <TouchableOpacity key={lang} style={styles.dropdownItem} onPress={() => handleLanguageChange(lang)}>
                  <CountryFlag isoCode={languages[lang].code} size={20} style={styles.dropdownFlag} />
                  <Text style={styles.dropdownItemText}>{languages[lang].title}</Text>
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
streakWrapper: {
  position: 'relative',
  width: 50,
  height: 50,
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.8,
  shadowRadius: 2,  
  elevation: 5
},
fireIcon: {
  position: 'absolute',
  zIndex: 1,
  width: 45,
  height: 56,
},
streakInsideFire: {
  position: 'absolute',
  zIndex: 2,
  fontSize: 18,
  fontWeight: 'bold',
  color: '#fff',
  textAlign: 'center',
  textAlignVertical: 'center',
  textShadowColor: 'rgba(0, 0, 0, 0.3)',
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 2,
},
singleDigitStreak: {
  right: 19,
  fontSize: 22
},
doubleDigitStreak: {
  right: 13,
  fontSize: 22
},
threeDigitStreak: {
  top: 16,
  right: 10,
  fontSize: 16
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
},
bottomCurve: {
  position: 'absolute',
  bottom: 0, // Slightly overlapped to avoid thin line
  left: 0,
  right: 0,
  width: '108.2%',
  height: 20, // Adjust based on your image's aspect ratio
  resizeMode: 'stretch',
},
contentContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  zIndex: 1, // Ensure content is above the shine effect
},
textContainer: {
  flex: 1,
  alignItems: 'center'
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
  shadowColor: "#000",
  
  shadowOffset: {
    width: 0,
    height: 0,
  },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 24,
},
imageContainer: {
  position: 'relative',
  marginRight: 10,
},
image: {
  width: 70,
  height: 70,
},
shineEffect: {
  position: 'absolute',
  top: -55,
  right: 15,
  width: 150, // Increased size
  height: 150, // Increased size
  resizeMode: 'contain',
  opacity: 0.7, // Slightly transparent
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
  position: 'absolute',
  top: -10,
  right: 10,
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
  padding: 10,
  backgroundColor: '#ffffff',
  marginHorizontal: 20,
  marginVertical: 10,
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
  color: '#0B739B',
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
  width: 50,
  height: 30,
  justifyContent: 'center',
  alignItems: 'center',
},
starIcon: {
  position: 'absolute',
  zIndex: 1,
  width: 55,
  height: 55
},
levelInsideStar: {
  position: 'absolute',
  zIndex: 2,
  fontSize: 18,
  fontWeight: 'bold',
  color: '#fff',
  textAlign: 'center',
  textAlignVertical: 'center',
  textShadowColor: 'rgba(0, 0, 0, 0.3)',
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 2,
},
singleDigitLevel: {
  right: 19,
  fontSize: 22
},
doubleDigitLevel: {
  right: 15,
},
threeDigitLevel: {
  right: 12,
  fontSize: 16
},
starContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 5,
  borderRadius: 15,

},
starText: {
  marginLeft: 5,
  marginTop: 10,
  fontSize: 16,
  fontWeight: '700',
  color: '#FFD700',
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