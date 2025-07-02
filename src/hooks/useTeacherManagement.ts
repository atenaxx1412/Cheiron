import { useState, useEffect, useCallback } from 'react';
import { AITeacher } from '../types';
import { firebaseAITeacherService } from '../services/firebaseAITeacherService';
import { firebaseTeacherPersonalityService } from '../services/firebaseTeacherPersonalityService';
import { useToastContext } from '../contexts/ToastContext';

interface EditForm {
  name: string;
  displayName: string;
  personality: string;
  specialties: string;
  image: string;
  greeting: string;
  teacherInfo: string;
  freeNotes: string;
  ngWordsEnabled: boolean;
  ngWords: string;
  ngCategories: string[];
  ngCustomMessage: string;
  customizationEnabled: boolean;
  restrictedTopics: string;
}

interface NewTeacherForm {
  name: string;
  displayName: string;
  personality: string;
  specialties: string;
  image: string;
  greeting: string;
}

export const useTeacherManagement = () => {
  const { showSuccess, showError } = useToastContext();
  
  // AI先生関連の状態管理
  const [allTeachers, setAllTeachers] = useState<AITeacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<AITeacher | null>(null);
  const [isEditingTeacher, setIsEditingTeacher] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ 
    name: '', 
    displayName: '', 
    personality: '', 
    specialties: '', 
    image: '', 
    greeting: '',
    teacherInfo: '',
    freeNotes: '',
    ngWordsEnabled: false,
    ngWords: '',
    ngCategories: [],
    ngCustomMessage: '',
    customizationEnabled: false,
    restrictedTopics: ''
  });
  
  // 50問質問システム用のstate
  const [showPersonalityQuestions, setShowPersonalityQuestions] = useState(false);
  const [personalityAnswers, setPersonalityAnswers] = useState<Record<string, string>>({});
  const [personalityData, setPersonalityData] = useState<any>(null);

  // 折りたたみ用のstate
  const [showDetailInfo, setShowDetailInfo] = useState(false);
  const [showNgWords, setShowNgWords] = useState(false);

  // 新規追加用のstate
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacherForm, setNewTeacherForm] = useState<NewTeacherForm>({
    name: '',
    displayName: '',
    personality: '',
    specialties: '',
    image: '',
    greeting: ''
  });

  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  // データ読み込み
  const loadData = useCallback(async () => {
    try {
      // AI先生データの読み込みはリアルタイムサブスクリプションで行う
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      showError('データ読み込み失敗', 'AI先生データの読み込みに失敗しました');
    }
  }, [showError]);

  // リアルタイム監視の設定
  useEffect(() => {
    loadData();
    
    // リアルタイムでAI先生データを監視
    const unsubscribeTeachers = firebaseAITeacherService.subscribeToTeachers((teachers) => {
      setAllTeachers(teachers);
      
      // 編集中でない場合のみselectedTeacherを更新
      if (selectedTeacher && !isEditingTeacher) {
        const updatedSelected = teachers.find(t => t.id === selectedTeacher.id);
        if (updatedSelected) {
          setSelectedTeacher(updatedSelected);
          // 編集フォームも更新（編集中でない場合のみ）
          updateEditForm(updatedSelected);
        }
      }
    });
    
    return () => {
      unsubscribeTeachers();
    };
  }, [loadData, selectedTeacher, isEditingTeacher]);

  // 編集フォームを更新する共通関数
  const updateEditForm = (teacher: AITeacher) => {
    setEditForm({
      name: teacher.name,
      displayName: teacher.displayName,
      personality: teacher.personality,
      specialties: teacher.specialties.join(', '),
      image: teacher.image || '',
      greeting: teacher.greeting || '',
      teacherInfo: teacher.teacherInfo || '',
      freeNotes: teacher.freeNotes || '',
      ngWordsEnabled: teacher.ngWords?.enabled || false,
      ngWords: teacher.ngWords?.words?.join(', ') || '',
      ngCategories: teacher.ngWords?.categories || [],
      ngCustomMessage: teacher.ngWords?.customMessage || '',
      customizationEnabled: teacher.responseCustomization?.enableCustomization || false,
      restrictedTopics: teacher.responseCustomization?.restrictedTopics?.join(', ') || ''
    });
  };

  // 先生カードクリックハンドラー
  const handleTeacherCardClick = async (teacher: AITeacher) => {
    setSelectedTeacher(teacher);
    setViewMode('detail');
    updateEditForm(teacher);
    
    // 50問の性格データを読み込み
    try {
      const existingData = await firebaseTeacherPersonalityService.getTeacherPersonality(teacher.id);
      setPersonalityData(existingData);
      if (existingData) {
        const answerMap: Record<string, string> = {};
        existingData.answers.forEach(answer => {
          answerMap[answer.questionId] = answer.answer;
        });
        setPersonalityAnswers(answerMap);
      }
    } catch (error) {
      console.error('性格データ読み込みエラー:', error);
      showError('性格データ読み込み失敗', '先生の性格データの読み込みに失敗しました');
    }
  };

  // 一覧に戻る
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedTeacher(null);
    setIsEditingTeacher(false);
    setShowPersonalityQuestions(false);
    setPersonalityAnswers({});
    setPersonalityData(null);
  };

  // 編集開始
  const handleEditTeacher = () => {
    if (selectedTeacher) {
      console.log('編集開始 - 選択された先生:', selectedTeacher.name, selectedTeacher.id);
      updateEditForm(selectedTeacher);
    }
    setIsEditingTeacher(true);
  };

  // 保存処理
  const handleSaveTeacher = async () => {
    if (!selectedTeacher) return;
    
    try {
      await firebaseAITeacherService.updateTeacher(selectedTeacher.id, {
        name: editForm.name,
        displayName: editForm.displayName,
        personality: editForm.personality,
        specialties: editForm.specialties.split(',').map(s => s.trim()).filter(s => s),
        image: editForm.image,
        greeting: editForm.greeting,
        teacherInfo: editForm.teacherInfo,
        freeNotes: editForm.freeNotes,
        responseCustomization: {
          enableCustomization: editForm.customizationEnabled,
          restrictedTopics: editForm.restrictedTopics ? editForm.restrictedTopics.split(',').map(s => s.trim()).filter(s => s) : []
        },
        ngWords: {
          enabled: editForm.ngWordsEnabled,
          words: editForm.ngWords ? editForm.ngWords.split(',').map(s => s.trim()).filter(s => s) : [],
          categories: editForm.ngCategories,
          customMessage: editForm.ngCustomMessage
        }
      });
      
      setIsEditingTeacher(false);
      showSuccess('更新完了', '先生プロフィールを更新しました！');
    } catch (error) {
      console.error('先生更新エラー:', error);
      showError('更新失敗', '先生プロフィールの更新に失敗しました');
    }
  };

  // 自動保存機能（新機能の設定変更時）
  const handleAutoSave = async (updates: Partial<EditForm>) => {
    if (!selectedTeacher) return;
    
    try {
      const updatedForm = { ...editForm, ...updates };
      await firebaseAITeacherService.updateTeacher(selectedTeacher.id, {
        teacherInfo: updatedForm.teacherInfo,
        freeNotes: updatedForm.freeNotes,
        responseCustomization: {
          enableCustomization: updatedForm.customizationEnabled,
          restrictedTopics: updatedForm.restrictedTopics ? updatedForm.restrictedTopics.split(',').map(s => s.trim()).filter(s => s) : []
        },
        ngWords: {
          enabled: updatedForm.ngWordsEnabled,
          words: updatedForm.ngWords ? updatedForm.ngWords.split(',').map(s => s.trim()).filter(s => s) : [],
          categories: updatedForm.ngCategories,
          customMessage: updatedForm.ngCustomMessage
        }
      });
      
      console.log('設定を自動保存しました');
    } catch (error) {
      console.error('自動保存エラー:', error);
    }
  };

  // キャンセル処理
  const handleCancelEdit = () => {
    if (selectedTeacher) {
      updateEditForm(selectedTeacher);
    }
    setIsEditingTeacher(false);
  };

  return {
    // State
    allTeachers,
    selectedTeacher,
    isEditingTeacher,
    editForm,
    setEditForm,
    showPersonalityQuestions,
    setShowPersonalityQuestions,
    personalityAnswers,
    setPersonalityAnswers,
    personalityData,
    setPersonalityData,
    showAddTeacherModal,
    setShowAddTeacherModal,
    newTeacherForm,
    setNewTeacherForm,
    viewMode,
    setViewMode,
    showDetailInfo,
    setShowDetailInfo,
    showNgWords,
    setShowNgWords,
    
    // Actions
    handleTeacherCardClick,
    handleBackToList,
    handleEditTeacher,
    handleSaveTeacher,
    handleAutoSave,
    handleCancelEdit,
    updateEditForm
  };
};