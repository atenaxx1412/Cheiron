import React from 'react';
import { Category, ChatMode } from '../../types';
import { LogOut, Settings, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChatHeaderProps {
  category: Category;
  setCategory: (category: Category) => void;
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
  isAnonymous: boolean;
  setIsAnonymous: (anonymous: boolean) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  category,
  setCategory,
  mode,
  setMode,
  isAnonymous,
  setIsAnonymous
}) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const categoryOptions: Category[] = ['進路', '学習', '人間関係'];
  const modeOptions: { value: ChatMode; label: string }[] = [
    { value: 'normal', label: '通常' },
    { value: 'detailed', label: '詳しく' },
    { value: 'quick', label: 'さくっと' },
    { value: 'encouraging', label: '励まし' }
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🤖</span>
            <h1 className="text-lg font-semibold text-gray-900">
              田中先生AI
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            ようこそ、{user.displayName}さん
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => {}}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            title="履歴"
          >
            <History size={20} />
          </button>
          <button
            onClick={() => {}}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            title="設定"
          >
            <Settings size={20} />
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

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">カテゴリ:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">モード:</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as ChatMode)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {modeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-1 text-sm">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">匿名モード</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;