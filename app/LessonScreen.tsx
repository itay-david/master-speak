import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import ProgressBar from '../components/ProgressBar';
import TaskComponent from '../components/TaskComponent';
import { getLessonDataRef, getUserProgressRef, onValue, updateUserProgress } from './auth/firebaseConfig';

interface Lesson {
  type: 'newSentence' | 'completeSentence' | 'orderSentence';
  title: string;
  sentence?: string;
  translate?: string;
  description?: string;
  revealedSentence?: string;
  options?: { [key: string]: string };
  answer?: string;
  words?: string[];
}

function LessonScreen({ route, navigation }: any) {
  const { userId, language, level, lessonKey } = route.params;
  const [lessons, setLessons] = useState<{ [key: string]: Lesson } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const lessonRef = getLessonDataRef(language, level, lessonKey);
    const progressRef = getUserProgressRef(userId);

    const unsubscribeLessons = onValue(lessonRef, (snapshot) => {
      const lessonsData = snapshot.val();
      if (lessonsData) {
        setLessons(lessonsData);
      }
    });

    const unsubscribeProgress = onValue(progressRef, (snapshot) => {
      const progressData = snapshot.val();
      if (progressData && progressData[language] && progressData[language][level]) {
        setCompletedTasks(progressData[language][level]);
      }
    });

    return () => {
      unsubscribeLessons();
      unsubscribeProgress();
    };
  }, [language, level, userId]);

  const handleTaskComplete = (isCorrect: boolean) => {
    const currentTask = lessons![Object.keys(lessons!)[currentIndex]];
    if (currentTask.type !== 'newSentence') {
      setCompletedTasks((prevCompletedTasks) => ({
        ...prevCompletedTasks,
        [Object.keys(lessons!)[currentIndex]]: true,
      }));
      if (isCorrect) {
        setCorrectAnswers(prev => prev + 1);
      }
    }
  };

  const handleNextTask = () => {
    if (currentIndex < Object.keys(lessons!).length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowSummary(true);
    }
  };

  const finishLesson = () => {
    const totalTasks = Object.keys(lessons!).length;
    // const completeSentenceTasks = Object.values(lessons!).filter(lesson => lesson.type === 'completeSentence').length;
    const successRate = (correctAnswers / totalTasks) * 100;
    
    if (successRate >= 60) {
      // Only update progress if the user passes the lesson
      updateUserProgress(userId, language, level, lessonKey, true);
    }
    
    navigation.goBack();
  };

  if (!lessons) {
    return <Text>Loading...</Text>;
  }

  const totalTasks = Object.keys(lessons).length;
  const progress = currentIndex / totalTasks;
  const tasksToScore = Object.values(lessons).filter(lesson => lesson.type !== 'newSentence').length;
  const successRate = tasksToScore > 0 ? (correctAnswers / tasksToScore) * 100 : 100;

  return (
    <View style={styles.container}>
      <ProgressBar progress={progress} />
      {!showSummary ? (
        <TaskComponent
          {...lessons[Object.keys(lessons)[currentIndex]]}
          onComplete={handleTaskComplete}
          onNextTask={handleNextTask}
          taskKey={Object.keys(lessons)[currentIndex]}
          completed={!!completedTasks[Object.keys(lessons)[currentIndex]]}
        />
      ) : (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            {successRate >= 60 ? 'כל הכבוד! עברת את השיעור' : 'לא נורא, לא עברת הפעם. נסה שוב!'}
          </Text>
          <Text style={styles.successRateText}>אחוזי הצלחה: {successRate.toFixed(2)}%</Text>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={finishLesson}
          >
            <Text style={styles.finishButtonText}>סיים</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  summaryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  summaryText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  successRateText: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LessonScreen;
