// Learn.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Platform, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CountryFlag from "react-native-country-flag";
import { Picker } from '@react-native-picker/picker';
import { onValue, getLessonRef, updateLessonCompletion } from '../auth/firebaseConfig';
import { LanguageData, LessonData } from '../../constants/types';

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

const Learn: React.FC = () => {
  const [languageData, setLanguageData] = useState<LanguageData | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState('spanish');
  const [currentLevel, setCurrentLevel] = useState('A1');

  const languages = ['spanish', 'french', 'german']; // Add all your languages
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']; // Add all your levels

  useEffect(() => {
    const lessonRef = getLessonRef(currentLanguage, currentLevel);
    const unsubscribe = onValue(lessonRef, (snapshot) => {
      const data = snapshot.val() as LanguageData;
      setLanguageData(data);
    });

    return () => unsubscribe();
  }, [currentLanguage, currentLevel]);

  const handleLessonPress = (lessonKey: string) => {
    updateLessonCompletion(currentLanguage, currentLevel, lessonKey, true)
      .then(() => console.log('Lesson completion updated successfully'))
      .catch((error) => console.error('Error updating lesson completion:', error));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <View style={styles.flagArrowContainer}>
          <TouchableOpacity style={styles.flagButton}>
            <CountryFlag style={styles.flagEmoji} isoCode="es" size={20} />
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

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={currentLanguage}
          onValueChange={(itemValue) => setCurrentLanguage(itemValue)}
          style={styles.picker}
        >
          {languages.map(lang => (
            <Picker.Item key={lang} label={lang} value={lang} />
          ))}
        </Picker>
        <Picker
          selectedValue={currentLevel}
          onValueChange={(itemValue) => setCurrentLevel(itemValue)}
          style={styles.picker}
        >
          {levels.map(level => (
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
            completed={value.completed}
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
    backgroundColor: '#fff',
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
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starText: {
    marginLeft: 5,
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  picker: {
    flex: 1,
  },
  lessonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'fff'
  },
  lessonTitle: {
    fontSize: 16,
  },
});

export default Learn;