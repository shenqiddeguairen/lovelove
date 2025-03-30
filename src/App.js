import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import PromisesPage from './pages/PromisesPage';
import ConflictPage from './pages/ConflictPage';
import ProfilePage from './pages/ProfilePage';
import MomentsPage from './pages/MomentsPage';
import ChatPage from './pages/ChatPage';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<PromisesPage />} />
            <Route path="/promises" element={<PromisesPage />} />
            <Route path="/moments" element={<MomentsPage />} />
            <Route path="/conflicts" element={<ConflictPage />} />
            <Route path="/chat/:cardId" element={<ChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;