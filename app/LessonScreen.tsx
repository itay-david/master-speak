import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import ProgressBar from '../components/ProgressBar';
import TaskComponent from '../components/TaskComponent';
import { getLessonDataRef, getUserProgressRef, onValue, updateUserProgress } from './auth/firebaseConfig';
import { User } from 'firebase/auth';

interface Lesson {
  type: 'newSentence' | 'completeSentence';
  title: string;
  sentence?: string;
  revealedSentence?: string;
  options?: { [key: string]: string };
  answer?: string;
}

const LessonScreen: React.FC<{ userId: User; language: string; level: string; lessonKey: string; route: any }> = ({
  userId,
  language,
  level,
  lessonKey,
}) => {
  
  const [lessons, setLessons] = useState<{ [key: string]: Lesson } | null>(null);
  const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const lessonRef = getLessonDataRef('spanish', 'A1', 'class1');
    const progressRef = getUserProgressRef(userId);
    console.log(language, level, lessonKey)

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

  const handleTaskComplete = (taskKey: string) => {
    updateUserProgress(userId, language, level, lessonKey, true);
    setCompletedTasks((prevCompletedTasks) => ({
      ...prevCompletedTasks,
      [taskKey]: true,
    }));
  };

  if (!lessons) {
    return <Text>Loading...</Text>;
  }

  const progress = Object.values(lessons).filter(task => completedTasks[task.title]).length / Object.keys(lessons).length;

  return (
    <View style={styles.container}>
      <ProgressBar progress={progress * 100} />
      <ScrollView style={styles.lessonContainer}>
        {Object.entries(lessons).map(([taskKey, taskData]) => (
          <TaskComponent
            key={taskKey}
            type={taskData.type}
            title={taskData.title}
            sentence={taskData.sentence}
            revealedSentence={taskData.revealedSentence}
            options={taskData.options}
            answer={taskData.answer}
            onComplete={() => handleTaskComplete(taskKey)}
            completed={!!completedTasks[taskKey]}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  lessonContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
});

export default LessonScreen;
