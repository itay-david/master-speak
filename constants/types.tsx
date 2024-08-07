export interface LessonData {
  title: string;
  completed: boolean;
}

export interface LanguageData {
  classes: {
    [key: string]: LessonData;
  };
}