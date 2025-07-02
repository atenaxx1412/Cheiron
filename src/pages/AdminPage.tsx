import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, BarChart3, Bot, Plus, ThumbsUp, ThumbsDown, Database, LogOut, Trash2 } from 'lucide-react';
import { AITeacher } from '../types';
import { Student } from '../types/user';
import { ChatSession } from '../types/chat';
import { firebaseFeedbackService, FeedbackStats } from '../services/firebaseFeedbackService';
import { firebaseStudentService } from '../services/firebaseStudentService';
import { firebaseChatService } from '../services/firebaseChatService';
import LazyChatLogViewer from '../components/admin/LazychatLogViewer';
import ChatSessionDetail from '../components/admin/ChatSessionDetail';
import ProfileEditModal from '../components/admin/ProfileEditModal';
import AITeacherTab from '../components/admin/AITeacherTab';
import { firebaseAITeacherService } from '../services/firebaseAITeacherService';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ai-info' | 'students' | 'history' | 'feedback' | 'ai-test' | 'migration'>('dashboard');
  


  // 開発用データ削除のstate
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showStudentHistoryModal, setShowStudentHistoryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentChatSessions, setStudentChatSessions] = useState<ChatSession[]>([]);
  const [selectedChatSession, setSelectedChatSession] = useState<ChatSession | null>(null);
  const [showChatDetail, setShowChatDetail] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    username: '',
    email: '',
    grade: '',
    class: '',
    studentNumber: '',
    chatCount: 0,
    isActive: true,
    loginId: '',
    password: ''
  });
  const [editStudentForm, setEditStudentForm] = useState({
    name: '',
    username: '',
    email: '',
    grade: '',
    class: '',
    studentNumber: '',
    isActive: true
  });
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats>({
    totalFeedbacks: 0,
    goodFeedbacks: 0,
    badFeedbacks: 0,
    satisfactionRate: 0,
    averageReproductionScore: 0,
    feedbacksByCategory: {},
    feedbacksByTeacher: {},
    recentFeedbacks: []
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [recentChatSessions, setRecentChatSessions] = useState<ChatSession[]>([]);
  const [allChatSessions, setAllChatSessions] = useState<ChatSession[]>([]);
  
  // AI テスト用の状態
  const [allTeachers, setAllTeachers] = useState<AITeacher[]>([]);
  const [selectedTestTeacher, setSelectedTestTeacher] = useState<AITeacher | null>(null);
  const [testMessages, setTestMessages] = useState<Array<{ text: string; sender: 'user' | 'ai'; timestamp: string }>>([]);
  const [testInput, setTestInput] = useState('');
  const [isTestingAI, setIsTestingAI] = useState(false);
  const navigate = useNavigate();
  
  // プロフィール情報を取得（カスタム表示名を考慮）
  const getDisplayName = () => {
    const customName = localStorage.getItem('adminDisplayName');
    const defaultUser = JSON.parse(localStorage.getItem('user') || '{}');
    return customName || defaultUser.displayName || '管理者';
  };
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadData = useCallback(async () => {
    try {
      // Firebase students data
      const students = await firebaseStudentService.getAllStudents();
      
      // 全チャットセッションを取得（累計質問数計算用）
      const allChatSessionsData = await firebaseChatService.getAllChatSessions();
      setAllChatSessions(allChatSessionsData);
      setRecentChatSessions(allChatSessionsData.slice(0, 5));
      
      setAllStudents(students);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      alert('データの読み込みに失敗しました');
    }
  }, []);

  useEffect(() => {
    // Initialize Firebase students, set up real-time subscription
    const initializeAndLoad = async () => {
      try {
        await loadData();
        
        // フィードバック統計も読み込み
        const stats = await firebaseFeedbackService.getFeedbackStats();
        setFeedbackStats(stats);
      } catch (error) {
        console.error('初期化エラー:', error);
      }
    };
    
    initializeAndLoad();
    
    // Set up real-time subscriptions
    const unsubscribeStudents = firebaseStudentService.subscribeToStudents((students) => {
      setAllStudents(students);
    });
    
    // Set up real-time feedback subscription
    const unsubscribeFeedbacks = firebaseFeedbackService.subscribeToFeedbacks(async () => {
      try {
        const stats = await firebaseFeedbackService.getFeedbackStats();
        setFeedbackStats(stats);
      } catch (error) {
        console.error('フィードバック統計更新エラー:', error);
      }
    });
    
    // Set up real-time chat sessions subscription for dashboard stats
    const unsubscribeChatSessions = firebaseChatService.subscribeToAllChatSessions((sessions) => {
      setAllChatSessions(sessions);
      setRecentChatSessions(sessions.slice(0, 5));
    });
    
    // AI先生のリアルタイム監視
    const unsubscribeTeachers = firebaseAITeacherService.subscribeToTeachers((teachers) => {
      console.log('AI先生データを受信:', teachers.length, '名の先生');
      setAllTeachers(teachers);
    });
    
    return () => {
      unsubscribeStudents();
      unsubscribeFeedbacks();
      unsubscribeChatSessions();
      unsubscribeTeachers();
    };
  }, [loadData]);


  const handleAddStudent = async () => {
    if (!newStudentForm.name || !newStudentForm.username || !newStudentForm.loginId || !newStudentForm.password) {
      alert('生徒名、ユーザー名、ログインID、パスワードは必須です');
      return;
    }

    if (newStudentForm.password.length < 6) {
      alert('パスワードは6文字以上で設定してください');
      return;
    }

    try {
      // ログインIDの重複チェック
      const existingStudents = await firebaseStudentService.getAllStudents();
      const isDuplicateLoginId = existingStudents.some(student => student.loginId === newStudentForm.loginId);
      
      if (isDuplicateLoginId) {
        alert('このログインIDは既に使用されています。別のIDを設定してください。');
        return;
      }

      await firebaseStudentService.addStudent({
        name: newStudentForm.name,
        username: newStudentForm.username,
        email: newStudentForm.email,
        grade: newStudentForm.grade,
        class: newStudentForm.class,
        studentNumber: newStudentForm.studentNumber,
        chatCount: newStudentForm.chatCount,
        isActive: newStudentForm.isActive,
        loginId: newStudentForm.loginId,
        password: newStudentForm.password
      });

      setNewStudentForm({
        name: '',
        username: '',
        email: '',
        grade: '',
        class: '',
        studentNumber: '',
        chatCount: 0,
        isActive: true,
        loginId: '',
        password: ''
      });
      setShowAddStudentModal(false);
      await loadData();
      alert(`${newStudentForm.name}を追加しました！`);
    } catch (error) {
      console.error('生徒追加エラー:', error);
      alert(error instanceof Error ? error.message : '生徒の追加に失敗しました');
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`${studentName}を削除してもよろしいですか？\nこの操作は取り消すことができません。`)) {
      return;
    }

    try {
      await firebaseStudentService.deleteStudent(studentId);
      await loadData();
      alert(`${studentName}を削除しました`);
    } catch (error) {
      console.error('生徒削除エラー:', error);
      alert(error instanceof Error ? error.message : '削除に失敗しました');
    }
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setEditStudentForm({
      name: student.name,
      username: student.username,
      email: student.email || '',
      grade: student.grade || '',
      class: student.class || '',
      studentNumber: student.studentNumber || '',
      isActive: student.isActive
    });
    setShowEditStudentModal(true);
  };

  const handleSaveEditStudent = async () => {
    if (!selectedStudent) return;
    
    if (!editStudentForm.name || !editStudentForm.username) {
      alert('生徒名とユーザー名は必須です');
      return;
    }

    try {
      await firebaseStudentService.updateStudent(selectedStudent.id, {
        name: editStudentForm.name,
        username: editStudentForm.username,
        email: editStudentForm.email,
        grade: editStudentForm.grade,
        class: editStudentForm.class,
        studentNumber: editStudentForm.studentNumber,
        isActive: editStudentForm.isActive
      });

      setShowEditStudentModal(false);
      setSelectedStudent(null);
      await loadData();
      alert('生徒情報を更新しました！');
    } catch (error) {
      console.error('生徒更新エラー:', error);
      alert(error instanceof Error ? error.message : '更新に失敗しました');
    }
  };

  const handleShowStudentHistory = async (student: Student) => {
    setSelectedStudent(student);
    setStudentChatSessions([]); // ローディング中は空にする
    setShowStudentHistoryModal(true);
    
    try {
      // Firebaseから実際の会話履歴を取得
      const chatSessions = await firebaseChatService.getStudentChatSessions(student.id);
      setStudentChatSessions(chatSessions);
    } catch (error) {
      console.error('会話履歴の取得に失敗:', error);
      setStudentChatSessions([]);
    }
  };

  // ダッシュボードの統計データを計算
  const getDashboardStats = () => {
    const activeStudents = allStudents.filter(s => s.isActive);
    const today = new Date().toISOString().split('T')[0];
    
    console.log('ダッシュボード統計計算:', {
      allTeachersCount: allTeachers.length,
      allStudentsCount: allStudents.length,
      activeStudentsCount: activeStudents.length
    });
    
    // 今日のチャット数（実際のFirebaseデータから計算）
    const todayChats = recentChatSessions.filter(session => 
      session.updatedAt.startsWith(today)
    ).length;
    
    // 緊急チャット数（実際のFirebaseデータから計算）
    const urgentChats = recentChatSessions.filter(session => 
      session.urgencyLevel > 3
    ).length;
    
    // 人気カテゴリの計算（実際のチャットセッションから）
    const categoryStats = recentChatSessions.reduce((acc, session) => {
      acc[session.category] = (acc[session.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const popularCategory = Object.entries(categoryStats).reduce((prev, [category, count]) => 
      count > prev.count ? { name: category, count } : prev,
      { name: '進路', count: 0 }
    );

    // 累計質問数を全チャットセッションの実際のメッセージから計算
    const totalQuestions = allChatSessions.reduce((total, session) => {
      // 各セッションでユーザーからのメッセージ（質問）数をカウント
      const userMessages = session.messages.filter(msg => msg.sender === 'user');
      return total + userMessages.length;
    }, 0);

    return {
      todayChats,
      activeStudents: activeStudents.length,
      popularCategory: popularCategory.name,
      urgentChats,
      totalTeachers: allTeachers.length, // Firebaseから取得したAI先生数
      totalQuestions // Firebase から実際の累計質問数を計算
    };
  };

  // チャットセッションから表示用データを生成
  const formatRecentChats = (sessions: ChatSession[]) => {
    return sessions.map(session => ({
      id: session.id,
      time: new Date(session.updatedAt).toLocaleString('ja-JP', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      student: session.studentName,
      category: session.category,
      messageCount: session.messages.length,
      lastMessage: session.messages[session.messages.length - 1]?.text.slice(0, 30) + '...' || 'メッセージなし',
      urgent: session.urgencyLevel > 3
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  // プロフィール保存ハンドラー
  const handleSaveProfile = (newDisplayName: string) => {
    localStorage.setItem('adminDisplayName', newDisplayName);
    console.log('管理者表示名を更新:', newDisplayName);
  };

  // AI テスト機能のハンドラー
  const handleTestTeacherSelect = (teacher: AITeacher) => {
    setSelectedTestTeacher(teacher);
    setTestMessages([{
      text: `${teacher.displayName}のAIテストを開始します。メッセージを送信して、AI応答の精度を確認してください。`,
      sender: 'ai',
      timestamp: new Date().toISOString()
    }]);
  };

  const handleTestMessageSend = async () => {
    if (!testInput.trim() || !selectedTestTeacher || isTestingAI) return;
    
    const userMessage = {
      text: testInput,
      sender: 'user' as const,
      timestamp: new Date().toISOString()
    };
    
    setTestMessages(prev => [...prev, userMessage]);
    setTestInput('');
    setIsTestingAI(true);

    try {
      // aiChatServiceを使用してAI応答を生成
      const { aiChatService } = await import('../services/aiChatService');
      const chatResponse = await aiChatService.sendMessage({
        message: testInput,
        teacherId: selectedTestTeacher.id,
        category: '日常会話'
      });

      const aiMessage = {
        text: chatResponse.response,
        sender: 'ai' as const,
        timestamp: new Date().toISOString()
      };
      
      setTestMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI応答生成エラー:', error);
      const errorMessage = {
        text: 'AI応答の生成に失敗しました。再度お試しください。',
        sender: 'ai' as const,
        timestamp: new Date().toISOString()
      };
      setTestMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTestingAI(false);
    }
  };

  const handleResetTestChat = () => {
    setTestMessages([]);
    setSelectedTestTeacher(null);
    setTestInput('');
  };

  const tabs = [
    { id: 'dashboard', label: 'ダッシュボード', icon: BarChart3 },
    { id: 'ai-info', label: 'AI情報', icon: Bot },
    { id: 'students', label: '生徒管理', icon: Users },
    { id: 'history', label: '会話履歴', icon: MessageSquare },
    { id: 'feedback', label: 'フィードバック', icon: ThumbsUp },
    { id: 'ai-test', label: 'AIテスト', icon: MessageSquare }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        const dashboardStats = getDashboardStats();
        const recentChats = formatRecentChats(recentChatSessions);
        
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setActiveTab('ai-info')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Bot size={16} />
                  <span>AI管理</span>
                </button>
                <button 
                  onClick={() => setActiveTab('students')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                >
                  <Users size={16} />
                  <span>生徒管理</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <MessageSquare className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          今日のチャット数
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">{dashboardStats.todayChats}件</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          アクティブ生徒
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">{dashboardStats.activeStudents}人</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BarChart3 className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          人気カテゴリ
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">{dashboardStats.popularCategory}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <MessageSquare className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          緊急チャット
                        </dt>
                        <dd className="text-lg font-medium text-red-600">{dashboardStats.urgentChats}件</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    最近のチャット
                  </h3>
                  <div className="space-y-3">
                    {recentChats.length > 0 ? recentChats.map((item, index) => (
                      <div key={item.id || index} className="flex flex-col py-3 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-500">{item.time}</span>
                            <span className="text-sm font-medium">{item.student}</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.category}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.messageCount}件
                            </span>
                            {item.urgent && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                緊急
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => setActiveTab('history')}
                            className="text-blue-600 hover:text-blue-500 text-sm"
                          >
                            詳細
                          </button>
                        </div>
                        <div className="text-xs text-gray-600 ml-0">
                          最新: {item.lastMessage}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>まだチャット履歴がありません</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    システム概要
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">登録AI先生数</span>
                      <span className="text-lg font-semibold text-gray-900">{dashboardStats.totalTeachers}名</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">登録生徒数</span>
                      <span className="text-lg font-semibold text-gray-900">{allStudents.length}名</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">累計質問数</span>
                      <span className="text-lg font-semibold text-gray-900">{dashboardStats.totalQuestions}件</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <button 
                        onClick={() => setActiveTab('history')}
                        className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        全ての履歴を表示
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai-info':
        return <AITeacherTab />;

      case 'students':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">生徒管理</h2>
              <button 
                onClick={() => setShowAddStudentModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>新規生徒追加</span>
              </button>
            </div>
            
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      生徒名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ユーザー名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学年・クラス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最終相談
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      相談回数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.grade && student.class ? `${student.grade} ${student.class}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.lastChatDate || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.chatCount}回
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button 
                          onClick={() => handleShowStudentHistory(student)}
                          className="text-blue-600 hover:text-blue-500"
                        >
                          履歴
                        </button>
                        <button 
                          onClick={() => handleEditStudent(student)}
                          className="text-green-600 hover:text-green-500"
                        >
                          編集
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id, student.name)}
                          className="text-red-600 hover:text-red-500"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'history':
        if (showChatDetail && selectedChatSession) {
          return (
            <ChatSessionDetail
              session={selectedChatSession}
              onBack={() => {
                setShowChatDetail(false);
                setSelectedChatSession(null);
              }}
              onUpdateSession={(sessionId, updates) => {
                // セッション更新処理は必要に応じて実装
                console.log('セッション更新:', sessionId, updates);
              }}
            />
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">会話履歴</h2>
              <div className="text-sm text-gray-600">
                リアルタイム更新中 🟢
              </div>
            </div>
            
            <LazyChatLogViewer
              onSessionSelect={(session) => {
                setSelectedChatSession(session);
                setShowChatDetail(true);
              }}
            />
          </div>
        );

      case 'feedback':
        // フィードバック統計はstateから取得（useEffectで読み込み済み）
        
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">フィードバック管理</h2>
            
            {/* 統計サマリー */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <MessageSquare className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          総フィードバック数
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">{feedbackStats.totalFeedbacks}件</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ThumbsUp className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          良い評価
                        </dt>
                        <dd className="text-lg font-medium text-green-600">{feedbackStats.goodFeedbacks}件</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ThumbsDown className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          悪い評価
                        </dt>
                        <dd className="text-lg font-medium text-red-600">{feedbackStats.badFeedbacks}件</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BarChart3 className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          満足度
                        </dt>
                        <dd className="text-lg font-medium text-blue-600">{feedbackStats.satisfactionRate.toFixed(1)}%</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Bot className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          再現度スコア
                        </dt>
                        <dd className="text-lg font-medium text-purple-600">
                          {feedbackStats.averageReproductionScore > 0 ? feedbackStats.averageReproductionScore.toFixed(1) : 'N/A'}/10
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 先生別フィードバック */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    先生別フィードバック
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(feedbackStats.feedbacksByTeacher).map(([teacherId, stats]) => (
                      <div key={teacherId} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium">{stats.name}</span>
                          {stats.averageReproduction && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              再現度: {stats.averageReproduction.toFixed(1)}/10
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <ThumbsUp size={14} className="text-green-500" />
                            <span className="text-sm text-green-600">{stats.good}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ThumbsDown size={14} className="text-red-500" />
                            <span className="text-sm text-red-600">{stats.bad}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {stats.good + stats.bad > 0 ? `${((stats.good / (stats.good + stats.bad)) * 100).toFixed(1)}%` : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* カテゴリ別フィードバック */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    カテゴリ別フィードバック
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(feedbackStats.feedbacksByCategory).map(([category, stats]) => (
                      <div key={category} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium">{category}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <ThumbsUp size={14} className="text-green-500" />
                            <span className="text-sm text-green-600">{stats.good}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ThumbsDown size={14} className="text-red-500" />
                            <span className="text-sm text-red-600">{stats.bad}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {stats.good + stats.bad > 0 ? `${((stats.good / (stats.good + stats.bad)) * 100).toFixed(1)}%` : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 最近のフィードバック */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  最近のフィードバック
                </h3>
                <div className="space-y-4">
                  {feedbackStats.recentFeedbacks.length > 0 ? feedbackStats.recentFeedbacks.map((feedback) => (
                    <div key={feedback.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`flex items-center space-x-1 ${
                              feedback.type === 'good' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {feedback.type === 'good' ? (
                                <ThumbsUp size={16} />
                              ) : (
                                <ThumbsDown size={16} />
                              )}
                              <span className="text-sm font-medium">
                                {feedback.type === 'good' ? '良い評価' : '悪い評価'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(feedback.timestamp).toLocaleString()}
                            </span>
                            {feedback.reproductionScore && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                再現度: {feedback.reproductionScore}/10
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-900 mb-2">
                            <strong>生徒:</strong> {feedback.studentName} | 
                            <strong> 先生:</strong> {feedback.teacherName} | 
                            <strong> カテゴリ:</strong> {feedback.category}
                          </div>
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {feedback.messageText}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>まだフィードバックがありません</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai-test':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">AIテストチャット</h2>
              <div className="text-sm text-gray-600">
                AI先生の応答精度をテストできます
              </div>
            </div>

            {!selectedTestTeacher ? (
              // 先生選択画面
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">テストする先生を選択してください</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allTeachers.map((teacher: AITeacher) => (
                    <div
                      key={teacher.id}
                      onClick={() => handleTestTeacherSelect(teacher)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                          {teacher.image ? (
                            <img src={teacher.image} alt={teacher.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">👨‍🏫</div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 group-hover:text-blue-600">{teacher.displayName}</h4>
                          <p className="text-sm text-gray-500">{teacher.specialties.join(', ')}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{teacher.personality}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // チャット画面
              <div className="bg-white rounded-lg shadow-sm border">
                {/* ヘッダー */}
                <div className="border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                        {selectedTestTeacher.image ? (
                          <img src={selectedTestTeacher.image} alt={selectedTestTeacher.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">👨‍🏫</div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedTestTeacher.displayName}</h3>
                        <p className="text-sm text-gray-500">テストモード</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleResetTestChat}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        リセット
                      </button>
                      <button
                        onClick={() => setSelectedTestTeacher(null)}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        先生を変更
                      </button>
                    </div>
                  </div>
                </div>

                {/* チャットメッセージ */}
                <div className="h-96 overflow-y-auto p-4 space-y-4">
                  {testMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTestingAI && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 入力フォーム */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTestMessageSend()}
                      placeholder="メッセージを入力してください..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isTestingAI}
                    />
                    <button
                      onClick={handleTestMessageSend}
                      disabled={!testInput.trim() || isTestingAI}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTestingAI ? '送信中...' : '送信'}
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    💡 ヒント: 先生の専門分野や性格に関する質問をして、AI応答の精度を確認してください
                  </div>
                </div>
              </div>
            )}

            {/* 50問質問システムの案内 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 AI先生の性格向上について</h3>
              <p className="text-sm text-blue-800">
                より精度の高いAI応答を実現するため、50問の戦略的質問システムを導入予定です。
                このテストチャットで現在の応答品質を確認し、今後の改善にお役立てください。
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Cheiron 管理画面
                </h1>
              </div>
              <div className="flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`${
                        activeTab === tab.id
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      } border-b-2 py-4 px-1 flex items-center space-x-1 text-sm font-medium`}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 開発用データ削除ボタン */}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
                title="開発用：チャットデータ削除"
              >
                <Database size={20} />
              </button>
              
              <button
                onClick={() => setShowProfileModal(true)}
                className="text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-md transition-colors"
                title="プロフィールを編集"
              >
                {getDisplayName()}さん
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                title="ログアウト"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {renderContent()}
      </main>

      {/* AI先生追加モーダルは独立コンポーネントに移動済み */}

      {/* 生徒追加モーダル */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">新しい生徒を追加</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生徒名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newStudentForm.name}
                    onChange={(e) => setNewStudentForm({...newStudentForm, name: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: 山田太郎"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ユーザー名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newStudentForm.username}
                    onChange={(e) => setNewStudentForm({...newStudentForm, username: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: yamada_taro"
                  />
                </div>
              </div>

              {/* ログイン情報セクション */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-3">ログイン情報</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ログインID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newStudentForm.loginId}
                      onChange={(e) => setNewStudentForm({...newStudentForm, loginId: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="例: student001"
                    />
                    <p className="mt-1 text-xs text-gray-500">生徒がログインに使用するIDです</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      パスワード <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={newStudentForm.password}
                      onChange={(e) => setNewStudentForm({...newStudentForm, password: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="パスワードを入力"
                    />
                    <p className="mt-1 text-xs text-gray-500">8文字以上を推奨します</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={newStudentForm.email}
                  onChange={(e) => setNewStudentForm({...newStudentForm, email: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: yamada@example.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学年
                  </label>
                  <input
                    type="text"
                    value={newStudentForm.grade}
                    onChange={(e) => setNewStudentForm({...newStudentForm, grade: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: 高校2年"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    クラス
                  </label>
                  <input
                    type="text"
                    value={newStudentForm.class}
                    onChange={(e) => setNewStudentForm({...newStudentForm, class: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: A組"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学籍番号
                  </label>
                  <input
                    type="text"
                    value={newStudentForm.studentNumber}
                    onChange={(e) => setNewStudentForm({...newStudentForm, studentNumber: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: 2024001"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddStudentModal(false);
                  setNewStudentForm({
                    name: '',
                    username: '',
                    email: '',
                    grade: '',
                    class: '',
                    studentNumber: '',
                    chatCount: 0,
                    isActive: true,
                    loginId: '',
                    password: ''
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddStudent}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 生徒編集モーダル */}
      {showEditStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">生徒情報編集</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生徒名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editStudentForm.name}
                    onChange={(e) => setEditStudentForm({...editStudentForm, name: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: 山田太郎"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ユーザー名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editStudentForm.username}
                    onChange={(e) => setEditStudentForm({...editStudentForm, username: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: yamada_taro"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={editStudentForm.email}
                  onChange={(e) => setEditStudentForm({...editStudentForm, email: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: yamada@example.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学年
                  </label>
                  <input
                    type="text"
                    value={editStudentForm.grade}
                    onChange={(e) => setEditStudentForm({...editStudentForm, grade: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: 高校2年"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    クラス
                  </label>
                  <input
                    type="text"
                    value={editStudentForm.class}
                    onChange={(e) => setEditStudentForm({...editStudentForm, class: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: A組"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学籍番号
                  </label>
                  <input
                    type="text"
                    value={editStudentForm.studentNumber}
                    onChange={(e) => setEditStudentForm({...editStudentForm, studentNumber: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: 2024001"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editStudentForm.isActive}
                    onChange={(e) => setEditStudentForm({...editStudentForm, isActive: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">アクティブ状態</span>
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditStudentModal(false);
                  setSelectedStudent(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveEditStudent}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 生徒履歴モーダル */}
      {showStudentHistoryModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedStudent.name}の会話履歴
              </h3>
              <button
                onClick={() => {
                  setShowStudentHistoryModal(false);
                  setSelectedStudent(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">学年・クラス:</span>
                  <p>{selectedStudent.grade && selectedStudent.class ? `${selectedStudent.grade} ${selectedStudent.class}` : '-'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">学籍番号:</span>
                  <p>{selectedStudent.studentNumber || '-'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">会話回数:</span>
                  <p>{selectedStudent.chatCount}回</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">最終会話:</span>
                  <p>{selectedStudent.lastChatDate || '-'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">会話履歴</h4>
              <div className="space-y-3">
                {studentChatSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>会話履歴がありません</p>
                  </div>
                ) : (
                  studentChatSessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">
                            {new Date(session.createdAt).toLocaleString('ja-JP')}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {session.category}
                          </span>
                          <span className="text-sm text-gray-600">
                            {session.isAnonymous ? '匿名' : session.studentName}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {session.status === 'active' ? '進行中' : '完了'}
                          </span>
                        </div>
                        <button 
                          className="text-blue-600 hover:text-blue-500 text-sm"
                          onClick={() => {
                            setSelectedChatSession(session);
                            setShowChatDetail(true);
                          }}
                        >
                          詳細表示
                        </button>
                      </div>
                      <p className="text-sm text-gray-700">
                        {session.messages && session.messages.length > 0 
                          ? session.messages[0].text.substring(0, 100) + (session.messages[0].text.length > 100 ? '...' : '')
                          : '会話が開始されていません'
                        }
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* プロフィール編集モーダル */}
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={{
          id: user.id || 'admin',
          username: user.username || 'admin',
          displayName: getDisplayName(),
          role: user.role || 'admin'
        }}
        onSave={handleSaveProfile}
      />

      {/* 開発用データ削除モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <Database className="h-8 w-8 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">開発用データ削除</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                開発中のチャットデータを削除できます。この操作は取り消せません。
              </p>
              
              <div className="space-y-3">
                {/* 全削除ボタン */}
                <button
                  onClick={() => alert('この機能は一時的に無効化されています')}
                  disabled={false}
                  className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>全チャットデータを削除（無効化中）</span>
                </button>
                
                {/* 部分削除オプション */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => alert('この機能は一時的に無効化されています')}
                    disabled={false}
                    className="py-2 px-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 text-sm"
                  >
                    1日より古い
                  </button>
                  <button
                    onClick={() => alert('この機能は一時的に無効化されています')}
                    disabled={false}
                    className="py-2 px-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 text-sm"
                  >
                    3日より古い
                  </button>
                  <button
                    onClick={() => alert('この機能は一時的に無効化されています')}
                    disabled={false}
                    className="py-2 px-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 text-sm"
                  >
                    1週間より古い
                  </button>
                  <button
                    onClick={() => alert('この機能は一時的に無効化されています')}
                    disabled={false}
                    className="py-2 px-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 text-sm"
                  >
                    1ヶ月より古い
                  </button>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ 削除対象: chatSessionsとmessagesコレクション<br/>
                  📊 現在のデータ数はコンソールで確認できます
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={false}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;