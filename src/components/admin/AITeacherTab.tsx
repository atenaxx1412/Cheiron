import React from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import ImageUpload from '../ImageUpload';
import personalityQuestionsData from '../../data/teacherPersonalityQuestions.json';
import { useTeacherManagement } from '../../hooks/useTeacherManagement';

interface AITeacherTabProps {
  // 将来的にpropsで状態を受け取る予定
}

export const AITeacherTab: React.FC<AITeacherTabProps> = () => {
  // カスタムフックを使用して状態管理と操作を取得
  const {
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
    handleDeleteTeacher,
    handleAddTeacher
  } = useTeacherManagement();


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">AI情報管理</h2>
        {viewMode === 'detail' && (
          <button 
            onClick={handleBackToList}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center space-x-2"
          >
            <span>← 一覧に戻る</span>
          </button>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">AI先生一覧</h3>
            <button 
              onClick={() => setShowAddTeacherModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>新しい先生を追加</span>
            </button>
          </div>

          {/* 先生カード一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleTeacherCardClick(teacher)}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {teacher.image ? (
                        <img 
                          className="h-10 w-10 rounded-full object-cover" 
                          src={teacher.image} 
                          alt={teacher.displayName}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {teacher.displayName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {teacher.displayName}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {teacher.specialties.join('、')}
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {teacher.personality}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : selectedTeacher ? (
        // 詳細編集画面
        <div className="space-y-6">
          {/* AI先生プロフィール設定 */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">AI先生プロフィール</h3>
                {!isEditingTeacher ? (
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleEditTeacher}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <Edit3 size={16} />
                      <span>編集</span>
                    </button>
                    <button 
                      onClick={handleDeleteTeacher}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2"
                    >
                      <Trash2 size={16} />
                      <span>削除</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleSaveTeacher}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                    >
                      <span>保存</span>
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <span>キャンセル</span>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                {/* プロフィール画像 */}
                <div className="flex justify-center">
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="relative w-32 h-32 rounded-full border-2 border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                          {selectedTeacher?.image ? (
                            <img 
                              src={selectedTeacher.image} 
                              alt="プロフィール画像" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-5xl text-gray-400">📷</div>
                          )}
                        </div>
                        {isEditingTeacher && (
                          <ImageUpload
                            currentImage={editForm.image}
                            onImageChange={(imageUrl) => setEditForm({...editForm, image: imageUrl})}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 基本情報フォーム */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      先生名
                    </label>
                    <input
                      type="text"
                      value={isEditingTeacher ? editForm.name : selectedTeacher.name}
                      onChange={(e) => isEditingTeacher && setEditForm({...editForm, name: e.target.value})}
                      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        isEditingTeacher ? 'bg-white' : 'bg-gray-50'
                      }`}
                      readOnly={!isEditingTeacher}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      表示名
                    </label>
                    <input
                      type="text"
                      value={isEditingTeacher ? editForm.displayName : selectedTeacher.displayName}
                      onChange={(e) => isEditingTeacher && setEditForm({...editForm, displayName: e.target.value})}
                      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        isEditingTeacher ? 'bg-white' : 'bg-gray-50'
                      }`}
                      readOnly={!isEditingTeacher}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    専門分野（カンマ区切り）
                  </label>
                  <input
                    type="text"
                    value={isEditingTeacher ? editForm.specialties : selectedTeacher.specialties.join(', ')}
                    onChange={(e) => setEditForm({...editForm, specialties: e.target.value})}
                    className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      isEditingTeacher ? 'bg-white' : 'bg-gray-50'
                    }`}
                    readOnly={!isEditingTeacher}
                    placeholder="進路指導, 学習相談, 心理カウンセリング"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    挨拶
                  </label>
                  <textarea
                    value={isEditingTeacher ? editForm.greeting : (selectedTeacher.greeting || '')}
                    onChange={(e) => isEditingTeacher && setEditForm({...editForm, greeting: e.target.value})}
                    rows={3}
                    className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      isEditingTeacher ? 'bg-white' : 'bg-gray-50'
                    }`}
                    readOnly={!isEditingTeacher}
                    placeholder="こんにちは！何でもお気軽にご相談ください。"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    性格・特徴
                  </label>
                  <textarea
                    value={isEditingTeacher ? editForm.personality : selectedTeacher.personality}
                    onChange={(e) => isEditingTeacher && setEditForm({...editForm, personality: e.target.value})}
                    rows={4}
                    className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      isEditingTeacher ? 'bg-white' : 'bg-gray-50'
                    }`}
                    readOnly={!isEditingTeacher}
                    placeholder="例: 温厚で親しみやすく、生徒の目線に立った指導を心がける先生です。"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 50問質問システム */}
          <div className="bg-white shadow-sm rounded border">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-gray-800">性格診断（50問システム）</h3>
                <div className="flex items-center space-x-2">
                  {(() => {
                    const totalQuestions = Object.values(personalityQuestionsData.personalityQuestions).flat().length;
                    const answeredQuestions = Object.keys(personalityAnswers).filter(key => personalityAnswers[key]?.trim()).length;
                    const percentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
                    
                    return (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        percentage === 100 ? 'bg-green-100 text-green-700' : 
                        percentage > 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {answeredQuestions}/{totalQuestions} ({percentage}%)
                      </span>
                    );
                  })()}
                  <button
                    onClick={() => setShowPersonalityQuestions(!showPersonalityQuestions)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    {showPersonalityQuestions ? '質問を閉じる' : '質問を開く'}
                  </button>
                </div>
              </div>
              
              {showPersonalityQuestions && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                    {Object.values(personalityQuestionsData.personalityQuestions)
                      .flat()
                      .map((question: any, index: number) => (
                        <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs mr-2">
                              {question.category}
                            </span>
                            <span className="text-gray-500 mr-2">Q{index + 1}.</span>
                            {question.question}
                          </p>
                          <textarea
                            value={personalityAnswers[question.id] || ''}
                            onChange={(e) => setPersonalityAnswers({
                              ...personalityAnswers,
                              [question.id]: e.target.value
                            })}
                            rows={2}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="回答を入力..."
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 詳細情報・返信カスタマイズ */}
          <div className="bg-white shadow-sm rounded border">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-gray-800">詳細情報・返信カスタマイズ</h3>
                <button
                  onClick={() => setShowDetailInfo(!showDetailInfo)}
                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                >
                  {showDetailInfo ? '折りたたむ' : '展開する'}
                </button>
              </div>
              
              {showDetailInfo && (
                <div className="space-y-4 border-t pt-3">
                  {/* 先生詳細情報 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      先生詳細情報
                    </label>
                    <textarea
                      value={editForm.teacherInfo}
                      onChange={(e) => {
                        setEditForm({...editForm, teacherInfo: e.target.value});
                        handleAutoSave({ teacherInfo: e.target.value });
                      }}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      placeholder="先生の詳細な背景情報、教育方針、専門知識等を入力..."
                    />
                  </div>

                  {/* 管理者用フリーメモ */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      管理者用フリーメモ
                    </label>
                    <textarea
                      value={editForm.freeNotes}
                      onChange={(e) => {
                        setEditForm({...editForm, freeNotes: e.target.value});
                        handleAutoSave({ freeNotes: e.target.value });
                      }}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      placeholder="管理者専用メモ（学生には表示されません）"
                    />
                  </div>

                  {/* 返信カスタマイズ */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        返信カスタマイズ機能
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.customizationEnabled}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            setEditForm({...editForm, customizationEnabled: enabled});
                            handleAutoSave({ customizationEnabled: enabled });
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600">有効化</span>
                      </label>
                    </div>
                    
                    {editForm.customizationEnabled && (
                      <div className="ml-4 border-l-2 border-blue-300 pl-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            制限トピック（カンマ区切り）
                          </label>
                          <input
                            type="text"
                            value={editForm.restrictedTopics}
                            onChange={(e) => {
                              setEditForm({...editForm, restrictedTopics: e.target.value});
                              handleAutoSave({ restrictedTopics: e.target.value });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            placeholder="例: 政治, 宗教, 恋愛相談"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* NGワードフィルター */}
          <div className="bg-white shadow-sm rounded border">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-800">NGワードフィルター</h3>
                <button
                  onClick={() => setShowNgWords(!showNgWords)}
                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                >
                  {showNgWords ? '折りたたむ' : '展開する'}
                </button>
              </div>

              {showNgWords && (
                <div className="space-y-4 border-t pt-3">
                  <div className="space-y-4 pl-4 border-l-2 border-red-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NGワード（カンマ区切り）
                      </label>
                      <textarea
                        value={editForm.ngWords}
                        onChange={(e) => {
                          setEditForm({...editForm, ngWords: e.target.value});
                          handleAutoSave({ ngWords: e.target.value });
                        }}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 不適切語1, 不適切語2, 不適切語3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        NGカテゴリ
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['暴力的表現', '差別的表現', '性的表現', '違法行為', 'プライバシー侵害', 'その他'].map((category) => (
                          <label key={category} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editForm.ngCategories.includes(category)}
                              onChange={(e) => {
                                let newCategories;
                                if (e.target.checked) {
                                  newCategories = [...editForm.ngCategories, category];
                                } else {
                                  newCategories = editForm.ngCategories.filter(c => c !== category);
                                }
                                setEditForm({...editForm, ngCategories: newCategories});
                                handleAutoSave({ ngCategories: newCategories });
                              }}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        カスタム警告メッセージ
                      </label>
                      <textarea
                        value={editForm.ngCustomMessage}
                        onChange={(e) => {
                          setEditForm({...editForm, ngCustomMessage: e.target.value});
                          handleAutoSave({ ngCustomMessage: e.target.value });
                        }}
                        rows={2}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="NGワードが検出された際の警告メッセージ"
                      />
                    </div>
                  </div>
                  
                  {/* NGワード有効化ボタンを右下に配置 */}
                  <div className="flex justify-end pt-3 border-t">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editForm.ngWordsEnabled}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          setEditForm({...editForm, ngWordsEnabled: enabled});
                          handleAutoSave({ ngWordsEnabled: enabled });
                        }}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">NGワードフィルターを有効化</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* 新しい先生追加モーダル */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">新しい先生を追加</h2>
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 先生名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  先生名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTeacherForm.name || ''}
                  onChange={(e) => setNewTeacherForm({...newTeacherForm, name: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: 田中先生"
                />
              </div>

              {/* 表示名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  表示名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTeacherForm.displayName || ''}
                  onChange={(e) => setNewTeacherForm({...newTeacherForm, displayName: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: 田中"
                />
              </div>

              {/* 専門分野 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  専門分野
                </label>
                <input
                  type="text"
                  value={newTeacherForm.specialties || ''}
                  onChange={(e) => setNewTeacherForm({...newTeacherForm, specialties: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: 数学, 物理"
                />
              </div>

              {/* 挨拶 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  挨拶
                </label>
                <textarea
                  value={newTeacherForm.greeting || ''}
                  onChange={(e) => setNewTeacherForm({...newTeacherForm, greeting: e.target.value})}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: こんにちは！数学の田中です。一緒に楽しく学びましょう！"
                />
              </div>

              {/* 性格・特徴 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  性格・特徴
                </label>
                <textarea
                  value={newTeacherForm.personality || ''}
                  onChange={(e) => setNewTeacherForm({...newTeacherForm, personality: e.target.value})}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: 明るく親しみやすい性格で、学生との対話を大切にします"
                />
              </div>
            </div>

            {/* ボタン */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddTeacher}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITeacherTab;