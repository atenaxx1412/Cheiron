import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('user') && localStorage.getItem('token');
  };

  const getUserRole = () => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        return parsedUser.role;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const PrivateRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ 
    children, 
    requiredRole 
  }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/" replace />;
    }

    if (requiredRole && getUserRole() !== requiredRole) {
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated() ? (
                getUserRole() === 'admin' ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/chat" replace />
                )
              ) : (
                <LoginPage />
              )
            } 
          />
          <Route 
            path="/chat" 
            element={
              <PrivateRoute requiredRole="student">
                <ChatPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <PrivateRoute requiredRole="admin">
                <AdminPage />
              </PrivateRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
