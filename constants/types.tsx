export interface LessonData {
  title: string;
  completed: boolean;
}

export interface LanguageData {
  classes: {
    [key: string]: LessonData;
  };
}

export interface UserProgress {
  [language: string]: {
    [level: string]: {
      [lessonKey: string]: boolean;
    };
  };
}