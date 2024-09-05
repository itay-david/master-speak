import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, FlatList, TextInput, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, push, onValue, off } from 'firebase/database';
import { getAuth } from 'firebase/auth';

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

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
      setUserName(user.displayName || 'Anonymous');
    }

    const db = getDatabase();
    const questionsRef = ref(db, 'questions');

    onValue(questionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const questionList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
          replies: value.replies || {},
        }));
        setQuestions(questionList.reverse());
        setFilteredQuestions(questionList.reverse());
      }
    });

    return () => {
      off(questionsRef);
    };
  }, []);

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
      });
      setNewQuestion('');
    }
  };

  const handleReply = () => {
    if (replyText.trim() && userId && userName && selectedQuestion) {
      const db = getDatabase();
      const replyRef = ref(db, `questions/${selectedQuestion.id}/replies`);
      push(replyRef, {
        userId,
        userName,
        text: replyText.trim(),
        timestamp: Date.now(),
      });
      setReplyText('');
      setModalVisible(false);
    }
  };

  const toggleReplies = (questionId: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const renderReply = ({ item }: { item: Reply }) => (
    <View style={styles.replyItem}>
      <Text style={styles.replyUser}>{item.userName}</Text>
      <Text style={styles.replyText}>{item.text}</Text>
    </View>
  );

  const renderQuestion = ({ item }: { item: Question }) => {
    const replyCount = Object.keys(item.replies).length;
    const isExpanded = expandedQuestions[item.id];

    return (
      <View style={styles.questionItem}>
        <Text style={styles.questionUser}>{item.userName}</Text>
        <Text style={styles.questionText}>{item.text}</Text>
        <View style={styles.questionFooter}>
          <TouchableOpacity 
            style={styles.answerButton} 
            onPress={() => {
              setSelectedQuestion(item);
              setModalVisible(true);
            }}
          >
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
              color="#4CAF50" 
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
      </View>
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
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reply to Question</Text>
            <TextInput
              style={styles.modalInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Your reply..."
              placeholderTextColor="#999"
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]} 
                onPress={handleReply}
              >
                <Text style={styles.modalButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: '#333',
    fontSize: 16,
  },
  questionList: {
    flex: 1,
  },
  questionItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  answerButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  toggleRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleRepliesText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginRight: 4,
    fontSize: 14,
  },
  replyList: {
    marginTop: 8,
  },
  replyItem: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
  },
  replyUser: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  replyText: {
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    color: '#333',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#333',
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default Community;