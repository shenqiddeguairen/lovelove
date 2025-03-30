import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import '../styles/ChatPage.css';

const ChatPage = () => {
  const { cardId } = useParams();

  const handleAIResponseUpdate = (aiResponse) => {
    // 从本地存储获取当前矛盾列表
    const savedConflicts = localStorage.getItem('conflicts');
    if (savedConflicts) {
      const conflicts = JSON.parse(savedConflicts);
      // 更新指定矛盾的AI建议
      const updatedConflicts = conflicts.map(conflict => {
        if (conflict.id.toString() === cardId) {
          return {
            ...conflict,
            aiSuggestion: aiResponse
          };
        }
        return conflict;
      });
      // 保存更新后的矛盾列表
      localStorage.setItem('conflicts', JSON.stringify(updatedConflicts));
    }
  };

  return (
    <div className="chat-page">
      <ChatInterface cardId={cardId} onAIResponseUpdate={handleAIResponseUpdate} />
    </div>
  );
};

export default ChatPage;