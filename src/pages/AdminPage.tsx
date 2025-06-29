import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, MessageSquare, BarChart3 } from 'lucide-react';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'questions' | 'students' | 'history'>('dashboard');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const tabs = [
    { id: 'dashboard', label: 'ダッシュボード', icon: BarChart3 },
    { id: 'questions', label: '質問管理', icon: MessageSquare },
    { id: 'students', label: '生徒管理', icon: Users },
    { id: 'history', label: '相談履歴', icon: MessageSquare }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
            
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
                          今日の相談件数
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">12件</dd>
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
                        <dd className="text-lg font-medium text-gray-900">8人</dd>
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
                        <dd className="text-lg font-medium text-gray-900">進路</dd>
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
                          緊急相談
                        </dt>
                        <dd className="text-lg font-medium text-red-600">1件</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  最近の相談
                </h3>
                <div className="space-y-3">
                  {[
                    { time: '15:30', student: '山田太郎', category: '進路', urgent: false },
                    { time: '14:20', student: '匿名', category: '人間関係', urgent: true },
                    { time: '13:45', student: '佐藤花子', category: '学習', urgent: false },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500">{item.time}</span>
                        <span className="text-sm font-medium">{item.student}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                        {item.urgent && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            緊急
                          </span>
                        )}
                      </div>
                      <button className="text-blue-600 hover:text-blue-500 text-sm">
                        詳細
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'questions':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">質問管理</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                + 新規質問追加
              </button>
            </div>
            
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-3 gap-6">
                  {['進路', '学習', '人間関係'].map((category) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">{category}</h3>
                      <p className="text-sm text-gray-500 mb-3">登録済み: 100問</p>
                      <button className="text-blue-600 hover:text-blue-500 text-sm">
                        管理する
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'students':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">生徒管理</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                + 新規生徒追加
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
                      ユーザーID
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
                  {[
                    { name: '山田太郎', id: 'student01', lastChat: '今日 15:30', count: 5 },
                    { name: '佐藤花子', id: 'student02', lastChat: '昨日 16:45', count: 3 }
                  ].map((student, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.lastChat}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.count}回
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        <button className="hover:text-blue-500">履歴</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">相談履歴</h2>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex space-x-4 mb-4">
                <select className="px-3 py-2 border border-gray-300 rounded-md">
                  <option>すべての生徒</option>
                  <option>山田太郎</option>
                  <option>佐藤花子</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-md">
                  <option>すべてのカテゴリ</option>
                  <option>進路</option>
                  <option>学習</option>
                  <option>人間関係</option>
                </select>
                <input 
                  type="date" 
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="space-y-4">
                {[
                  {
                    date: '2024/06/30 15:30',
                    student: '山田太郎',
                    category: '進路',
                    question: '将来の夢が見つからなくて不安です...',
                    urgent: false
                  },
                  {
                    date: '2024/06/30 14:20',
                    student: '匿名',
                    category: '人間関係',
                    question: 'クラスメイトとうまくいきません',
                    urgent: true
                  }
                ].map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500">{item.date}</span>
                        <span className="font-medium">{item.student}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                        {item.urgent && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            緊急
                          </span>
                        )}
                      </div>
                      <button className="text-blue-600 hover:text-blue-500 text-sm">
                        詳細表示
                      </button>
                    </div>
                    <p className="text-sm text-gray-700">{item.question}</p>
                  </div>
                ))}
              </div>
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
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🤖</span>
                <h1 className="text-xl font-semibold text-gray-900">
                  仮人間AI 管理画面
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
              <span className="text-sm text-gray-700">
                {user.displayName}さん
              </span>
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
    </div>
  );
};

export default AdminPage;