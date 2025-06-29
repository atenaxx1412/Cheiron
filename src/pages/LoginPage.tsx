import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // モックデータ - 後でAPI連携に置き換え
  const mockUsers: Record<string, { password: string; user: User }> = {
    admin: {
      password: 'admin123',
      user: {
        id: '1',
        username: 'admin',
        displayName: '田中先生',
        role: 'admin'
      }
    },
    student01: {
      password: 'student123',
      user: {
        id: '2',
        username: 'student01',
        displayName: '山田太郎',
        role: 'student'
      }
    },
    student02: {
      password: 'student123',
      user: {
        id: '3',
        username: 'student02',
        displayName: '佐藤花子',
        role: 'student'
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // モック認証処理
      const mockUser = mockUsers[username];
      if (mockUser && mockUser.password === password) {
        // ローカルストレージに保存
        localStorage.setItem('user', JSON.stringify(mockUser.user));
        localStorage.setItem('token', 'mock-token-' + Date.now());

        // 役割に応じて画面遷移
        if (mockUser.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/chat');
        }
      } else {
        alert('ログインに失敗しました。ユーザーIDまたはパスワードが間違っています。');
      }
    } catch (error) {
      alert('ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center bg-blue-100 rounded-full mb-4">
            <span className="text-3xl">🤖</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            仮人間AI
          </h2>
          <p className="text-sm text-gray-600">
            ログインしてください
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                ユーザーID
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin / student01 / student02"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin123 / student123"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>
          
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p><strong>テスト用アカウント:</strong></p>
            <p>管理者: admin / admin123</p>
            <p>生徒: student01 / student123</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;