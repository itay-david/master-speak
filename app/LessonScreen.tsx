import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import ProgressBar from '../components/ProgressBar';
import TaskComponent from '../components/TaskComponent';
import Swiper from 'react-native-swiper';
import { getLessonDataRef, getUserProgressRef, onValue, updateUserProgress } from './auth/firebaseConfig';

interface Lesson {
  type: 'newSentence' | 'completeSentence';
  title: string;
  sentence?: string;
  translate?: string;
  description?: string;
  revealedSentence?: string;
  options?: { [key: string]: string };
  answer?: string;
}

function LessonScreen({ route }: any) {
  const { userId, language, level, lessonKey } = route.params;
  const [lessons, setLessons] = useState<{ [key: string]: Lesson } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});
  const swiperRef = useRef<any>(null);

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

  const handleTaskComplete = (taskKey: string) => {
    updateUserProgress(userId, language, level, lessonKey, true);
    setCompletedTasks((prevCompletedTasks) => ({
      ...prevCompletedTasks,
      [taskKey]: true,
    }));
  };

  const handleIndexChanged = (index: number) => {
    setCurrentIndex(index);
  };

  if (!lessons) {
    return <Text>Loading...</Text>;
  }

  const totalTasks = Object.keys(lessons).length;
  const progress = currentIndex / (totalTasks - 1);

  return (
    <View style={styles.container}>
      <ProgressBar progress={progress} />
      <Swiper
        ref={swiperRef}
        loop={false}
        showsPagination={true}
        paginationStyle={styles.paginationStyle}
        activeDotStyle={styles.activeDot}
        onIndexChanged={handleIndexChanged}
      >
        {Object.entries(lessons).map(([taskKey, taskData], index) => (
          <View style={styles.lessonContainer} key={taskKey}>
            <TaskComponent
              type={taskData.type}
              title={taskData.title}
              sentence={taskData.sentence}
              description={taskData.description}
              revealedSentence={taskData.revealedSentence}
              options={taskData.options}
              answer={taskData.answer}
              onComplete={() => handleTaskComplete(taskKey)}
              swiperRef={swiperRef}
              taskKey={taskKey}
              completed={!!completedTasks[taskKey]}
            />
          </View>
        ))}
      </Swiper>
    </View>
  );
}

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  lessonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  paginationStyle: {
    bottom: 10,
  },
  activeDot: {
    backgroundColor: '#4CAF50',
  },
});

export default LessonScreen;