import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Platform, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CountryFlag from "react-native-country-flag";
import { database } from '../auth/firebaseConfig';
import ProgressBar from '../../components/ProgressBar';
import ClassItem from '../../components/ClassItem';
import { ref, set, get, update } from 'firebase/database';

interface Class {
  id: string;
  name: string;
  isCompleted: boolean;
}

interface Level {
  id: string;
  name: string;
  progress: number;
  classes: Class[];
}

interface Language {
  id: string;
  name: string;
  levels: Level[];
}

export default function Learn() {
  const [progress, setProgress] = useState<number>(0);
  const [classes, setClasses] = useState<Class[]>([]);
  const [language, setLanguage] = useState<string>('Hebrew');
  const [level, setLevel] = useState<string>('A1');

  useEffect(() => {
    const fetchData = async () => {
      const dbRef = ref(database, `languages/${language}`);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const languageData = snapshot.val() as Language;
        const levelData = languageData.levels.find((lvl) => lvl.name === level);
        if (levelData) {
          setClasses(levelData.classes);
          setProgress(levelData.progress);
        }
      }
    };

    fetchData();
  }, [language, level]);

  const handlePress = async (classId: string) => {
    const updatedClasses = classes.map((cls) =>
      cls.id === classId ? { ...cls, isCompleted: !cls.isCompleted } : cls
    );
    setClasses(updatedClasses);

    const completedClasses = updatedClasses.filter((cls) => cls.isCompleted).length;
    const totalClasses = updatedClasses.length;
    const newProgress = (completedClasses / totalClasses) * 100;
    setProgress(newProgress);

    const dbRef = ref(database, `languages/${language}`);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const languageData = snapshot.val();
      const levels = languageData.levels.map((lvl: Level) =>
        lvl.name === level ? { ...lvl, classes: updatedClasses, progress: newProgress } : lvl
      );

      await update(dbRef, { levels });
    }
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
      
      <View style={styles.container}>
        <Text style={styles.header}>מתחיל {level}</Text>
        <ProgressBar progress={progress} />
        <FlatList
          data={classes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClassItem
              className={item.name}
              isCompleted={item.isCompleted}
              onPress={() => handlePress(item.id)}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

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
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
});
