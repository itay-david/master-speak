import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, FlatList, TextInput, Modal, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CountryFlag from 'react-native-country-flag';
import { getDatabase, ref, push, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Reply {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

interface Question {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  replies: { [key: string]: Reply };
  language: string;
}

const Community: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [replyText, setReplyText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<{ [key: string]: boolean }>({});
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [replyingTo, setReplyingTo] = useState<Question | null>(null);

  const [currentLanguage, setCurrentLanguage] = useState('english'); // Default to English

  const LANGUAGE_STORAGE_KEY = '@community_language_preference';

  const languages: { [key: string]: string} = {
    spanish: 'es',
    french: 'fr',
    german: 'de',
    english: 'us',
  };

  const fetchQuestions = useCallback(() => {
    const db = getDatabase();
    const questionsRef = ref(db, 'questions');
    const languageQuery = query(questionsRef, orderByChild('language'), equalTo(currentLanguage));

    const unsubscribe = onValue(languageQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const questionList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
          replies: value.replies || {},
        }));
        setQuestions(questionList.reverse());
        setFilteredQuestions(questionList.reverse());
      } else {
        setQuestions([]);
        setFilteredQuestions([]);
      }
    });

    return () => {
      off(questionsRef);
    };
  }, [currentLanguage]);

  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (storedLanguage !== null && languages.hasOwnProperty(storedLanguage)) {
          setCurrentLanguage(storedLanguage);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };

    loadLanguagePreference();

    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
      setUserName(user.displayName || 'Anonymous');
    }

    return fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = questions.filter(q => 
        q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.userName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredQuestions(filtered);
    } else {
      setFilteredQuestions(questions);
    }
  }, [searchQuery, questions]);

  const toggleReplies = (questionId: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleLanguageChange = async (language: string) => {
    setCurrentLanguage(language);
    setDropdownVisible(false);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const handleAskQuestion = () => {
    if (newQuestion.trim() && userId && userName) {
      const db = getDatabase();
      const questionsRef = ref(db, 'questions');
      push(questionsRef, {
        userId,
        userName,
        text: newQuestion.trim(),
        timestamp: Date.now(),
        replies: {},
        language: currentLanguage,
      });
      setNewQuestion('');
    }
  };

  const handleReply = () => {
    if (replyText.trim() && userId && userName && replyingTo) {
      const db = getDatabase();
      const replyRef = ref(db, `questions/${replyingTo.id}/replies`);
      push(replyRef, {
        userId,
        userName,
        text: replyText.trim(),
        timestamp: Date.now(),
      });
      setReplyText('');
      setReplyingTo(null);
    }
  };

  const renderReply = ({ item }: { item: Reply }) => (
    <View style={styles.replyItem}>
      <View style={styles.replyHeader}>
        <Text style={styles.replyUser}>{item.userName}</Text>
        <Text style={styles.replyTimestamp}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.replyText}>{item.text}</Text>
    </View>
  );

  const renderQuestion = ({ item }: { item: Question }) => {
    const replyCount = Object.keys(item.replies).length;
    const isExpanded = expandedQuestions[item.id];

    return (
      <View style={styles.questionItem}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionUser}>{item.userName}</Text>
          <Text style={styles.questionTimestamp}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.questionText}>{item.text}</Text>
        <View style={styles.questionFooter}>
          <TouchableOpacity 
            style={styles.answerButton} 
            onPress={() => setReplyingTo(item)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            <Text style={styles.answerButtonText}>Answer</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toggleRepliesButton} 
            onPress={() => toggleReplies(item.id)}
          >
            <Text style={styles.toggleRepliesText}>
              {replyCount} {replyCount === 1 ? 'Answer' : 'Answers'}
            </Text>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color="#1e88e5" 
            />
          </TouchableOpacity>
        </View>
        {isExpanded && replyCount > 0 && (
          <FlatList
            data={Object.values(item.replies)}
            renderItem={renderReply}
            keyExtractor={(reply) => reply.id}
            style={styles.replyList}
          />
        )}
      </View>
    );
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: dropdownVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [dropdownVisible, fadeAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1e88e5', '#1565c0']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity 
          style={styles.flagButton} 
          onPress={() => setDropdownVisible(!dropdownVisible)}
        >
          <CountryFlag isoCode={languages[currentLanguage]} size={20} />
          <Ionicons name="chevron-down" size={16} color="white" style={styles.arrowIcon} />
        </TouchableOpacity>
      </LinearGradient>
      {dropdownVisible && (
        <Animated.View style={[styles.dropdown, { opacity: fadeAnim }]}>
          {Object.keys(languages).map((lang) => (
            <TouchableOpacity key={lang} style={styles.dropdownItem} onPress={() => handleLanguageChange(lang)}>
              <CountryFlag isoCode={languages[lang]} size={20} style={styles.dropdownFlag} />
              <Text style={styles.dropdownItemText}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search questions..."
            placeholderTextColor="#999"
          />
        </View>
        <FlatList
          data={filteredQuestions}
          renderItem={renderQuestion}
          keyExtractor={(item) => item.id}
          style={styles.questionList}
        />
        {replyingTo && (
          <View style={styles.replyContainer}>
            <Text style={styles.replyingToText}>Replying to: {replyingTo.userName}</Text>
            <TextInput
              style={styles.replyInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Your answer..."
              placeholderTextColor="#999"
              multiline
            />
            <View style={styles.replyButtons}>
              <TouchableOpacity style={styles.cancelReplyButton} onPress={() => setReplyingTo(null)}>
                <Text style={styles.cancelReplyText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendReplyButton} onPress={handleReply}>
                <Text style={styles.sendReplyText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newQuestion}
          onChangeText={setNewQuestion}
          placeholder="Ask a question..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleAskQuestion}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingTop: StatusBar.currentHeight,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowIcon: {
    marginLeft: 5,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: 5,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownFlag: {
    marginRight: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  questionList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionUser: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  questionTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 15,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answerButton: {
    backgroundColor: '#1e88e5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  toggleRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleRepliesText: {
    fontSize: 14,
    color: '#1e88e5',
    marginRight: 4,
  },
  replyList: {
    marginTop: 10,
  },
  replyItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  replyUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  replyTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  replyText: {
    fontSize: 14,
    color: '#555',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  sendButton: {
    marginLeft: 15,
    backgroundColor: '#1e88e5',
    borderRadius: 25,
    padding: 10,
  },
  replyContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  replyingToText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  replyInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  replyButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  cancelReplyButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  cancelReplyText: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sendReplyButton: {
    backgroundColor: '#1e88e5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendReplyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Community;