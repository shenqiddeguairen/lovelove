import React, { useState, useEffect, useRef } from 'react';
import { MessageOutlined, CalendarOutlined, SmileOutlined, MehOutlined, FrownOutlined, RobotOutlined, SyncOutlined, AudioOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../styles/ConflictPage.css';

const ConflictPage = () => {
  const navigate = useNavigate();
  // 从本地存储加载数据
  const loadConflictsFromStorage = () => {
    const savedConflicts = localStorage.getItem('conflicts');
    if (savedConflicts) {
      return JSON.parse(savedConflicts);
    }
    return [
      {
        id: 1,
        issue: "约会迟到",
        description: "你昨天答应下午3点见面，但是迟到了半小时。",
        date: "2023-03-22",
        emotion: "sad",
        resolved: false,
        aiSuggestion: "考虑提前设置闹钟提醒，或者在可能迟到时提前通知对方。沟通是解决这类问题的关键。"
      },
      {
        id: 2,
        issue: "忘记纪念日",
        description: "上周是我们在一起100天的纪念日，但你忘记了。",
        date: "2023-03-18",
        emotion: "angry",
        resolved: true,
        resolution: "已经道歉并承诺记住所有重要的日子，设置了日历提醒。",
        aiSuggestion: "在手机和电脑上设置重要日期的提醒，可以使用专门的纪念日应用。可以提前准备一份特别的礼物作为补偿。"
      }
    ];
  };

  const [conflicts, setConflicts] = useState(loadConflictsFromStorage);
  const [filters, setFilters] = useState({
    dateRange: {
      start: '',
      end: ''
    },
    keyword: '',
    status: 'all' // 'all', 'resolved', 'unresolved'
  });

  // 筛选矛盾卡片
  const filteredConflicts = conflicts.filter(conflict => {
    // 日期筛选
    const conflictDate = new Date(conflict.date);
    const isDateInRange = (!filters.dateRange.start || conflictDate >= new Date(filters.dateRange.start)) &&
                         (!filters.dateRange.end || conflictDate <= new Date(filters.dateRange.end));

    // 关键词筛选
    const matchesKeyword = !filters.keyword ||
      conflict.issue.toLowerCase().includes(filters.keyword.toLowerCase()) ||
      conflict.description.toLowerCase().includes(filters.keyword.toLowerCase());

    // 状态筛选
    const matchesStatus = filters.status === 'all' ||
      (filters.status === 'resolved' && conflict.resolved) ||
      (filters.status === 'unresolved' && !conflict.resolved);

    return isDateInRange && matchesKeyword && matchesStatus;
  });
  const [newConflict, setNewConflict] = useState({
    issue: "",
    description: "",
    emotion: "sad",
    audioBlobs: [],
    videoBlob: null
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState(null); // 'audio' or 'video'
  const [transcription, setTranscription] = useState('');
  const mediaRecorderRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);

  // 每当conflicts变化时，保存到本地存储
  useEffect(() => {
    localStorage.setItem('conflicts', JSON.stringify(conflicts));
  }, [conflicts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewConflict(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmotionChange = (emotion) => {
    setNewConflict(prev => ({
      ...prev,
      emotion
    }));
  };

  const startRecording = async (type) => {
    try {
      const constraints = type === 'audio' 
        ? { audio: true }
        : { audio: true, video: true };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (type === 'video' && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: type === 'audio' ? 'audio/webm' : 'video/webm'
        });
        
        if (type === 'audio') {
          setNewConflict(prev => ({
            ...prev,
            audioBlobs: [...prev.audioBlobs, blob]
          }));
        } else {
          setNewConflict(prev => ({
            ...prev,
            videoBlob: blob
          }));
        }
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingType(type);

      // 启动语音识别
      if (type === 'audio' && window.webkitSpeechRecognition) {
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'zh-CN';

        // 只重置转录文本，保持主题内容不变
        setTranscription('');

        recognition.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            }
          }
          if (finalTranscript) {
            setTranscription(prev => prev + finalTranscript);
            setNewConflict(prev => ({
              ...prev,
              issue: prev.issue + finalTranscript
            }));
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (err) {
      console.error('录制失败:', err);
      alert('无法访问媒体设备，请确保已授予相关权限。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingType(null);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newConflict.issue.trim()) return;
    setTranscription('');
    
    const conflict = {
      id: Date.now(),
      issue: newConflict.issue,
      description: newConflict.description,
      date: new Date().toISOString().slice(0, 10),
      emotion: newConflict.emotion,
      resolved: false,
      audioUrl: newConflict.audioBlob ? URL.createObjectURL(newConflict.audioBlob) : null,
      videoUrl: newConflict.videoBlob ? URL.createObjectURL(newConflict.videoBlob) : null,
      aiSuggestion: "AI正在分析您的矛盾，很快将为您提供解决建议..."
    };
    
    // 使用动画效果添加新的矛盾卡片
    const newCard = document.createElement('div');
    newCard.className = 'card conflict-card new-card';
    document.querySelector('.conflicts-list').prepend(newCard);
    
    // 更新状态并保存到本地存储
    setConflicts([conflict, ...conflicts]);
    setNewConflict({ 
      issue: "", 
      description: "", 
      emotion: "sad",
      audioBlobs: [],
      videoBlob: null 
    });
    
    // 将矛盾信息保存到本地存储，供ChatInterface使用
    localStorage.setItem(`conflict_${conflict.id}`, JSON.stringify({
      issue: conflict.issue,
      description: conflict.description
    }));
    
    // 自动导航到聊天界面
    setTimeout(() => {
      navigate(`/chat/${conflict.id}`);
    }, 500); // 等待动画完成后再跳转
  };

  // 模拟异步获取AI建议
  const simulateAIResponse = (conflictId) => {
    setTimeout(() => {
      setConflicts(prevConflicts => 
        prevConflicts.map(conflict => {
          if (conflict.id === conflictId) {
            const suggestions = [
              "尝试换位思考，站在对方的角度考虑问题。开诚布公地交流感受，而非指责对方。",
              "安排一次特别的约会，在轻松的环境中讨论这个问题。避免在情绪激动时进行对话。",
              "设定明确的期望和边界，确保双方都理解并尊重彼此的需求。",
              "考虑写一封真诚的道歉信，表达你的感受和对解决问题的承诺。",
              "给彼此一些空间和时间冷静思考，然后再回来讨论问题。记住，每段关系都需要双方的努力。"
            ];
            return {
              ...conflict,
              aiSuggestion: suggestions[Math.floor(Math.random() * suggestions.length)]
            };
          }
          return conflict;
        })
      );
    }, 2000); // 2秒后更新
  };

  const handleChatClick = (id) => {
    navigate(`/chat/${id}`);
  };

  const handleResolve = (id, resolution) => {
    if (!resolution.trim()) return;
    
    setConflicts(conflicts.map(conflict => {
      if (conflict.id === id) {
        return {
          ...conflict,
          resolved: true,
          resolution
        };
      }
      return conflict;
    }));
  };

  const handleDelete = (id) => {
    if (window.confirm('确定要删除这个矛盾卡片吗？删除后将无法恢复。')) {
      // 删除矛盾卡片
      setConflicts(conflicts.filter(conflict => conflict.id !== id));
      // 删除相关的聊天记录
      localStorage.removeItem(`chat_messages_${id}`);
      localStorage.removeItem(`chat_context_${id}`);
    }
  };

  // 请求新的AI建议
  const requestNewAISuggestion = (conflictId) => {
    // 更新状态显示加载中
    setConflicts(prevConflicts => 
      prevConflicts.map(conflict => {
        if (conflict.id === conflictId) {
          return {
            ...conflict,
            aiSuggestion: "正在生成新的建议..."
          };
        }
        return conflict;
      })
    );
    
    // 模拟异步获取AI建议
    simulateAIResponse(conflictId);
  };

  return (
    <div className="conflicts-page">
      <h2 className="page-title">
        矛盾管理 <MessageOutlined className="message-icon" />
      </h2>
      
      <div className="card conflict-form-card">
        <h3>记录新的矛盾</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="issue">矛盾主题</label>
            <div className="issue-input-group">
              <input
                type="text"
                id="issue"
                name="issue"
                className="form-control"
                placeholder="简要描述矛盾的主题..."
                value={newConflict.issue}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="clear-issue-btn"
                onClick={() => setNewConflict(prev => ({ ...prev, issue: '' }))}
                style={{ display: newConflict.issue ? 'flex' : 'none' }}
              >
                <span>❤</span>
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">详细描述 (选填)</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              placeholder="详细描述矛盾发生的原因和过程..."
              value={newConflict.description}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>
          
          <div className="form-group">
            <label>你的情绪</label>
            <div className="emotion-selector">
              <button
                type="button"
                className={`emotion-btn ${newConflict.emotion === 'sad' ? 'active' : ''}`}
                onClick={() => handleEmotionChange('sad')}
              >
                <FrownOutlined /> 伤心
              </button>
              <button
                type="button"
                className={`emotion-btn ${newConflict.emotion === 'angry' ? 'active' : ''}`}
                onClick={() => handleEmotionChange('angry')}
              >
                <FrownOutlined /> 生气
              </button>
              <button
                type="button"
                className={`emotion-btn ${newConflict.emotion === 'disappointed' ? 'active' : ''}`}
                onClick={() => handleEmotionChange('disappointed')}
              >
                <MehOutlined /> 失望
              </button>
              <button
                type="button"
                className={`emotion-btn ${newConflict.emotion === 'hurt' ? 'active' : ''}`}
                onClick={() => handleEmotionChange('hurt')}
              >
                <FrownOutlined /> 委屈
              </button>
            </div>
          </div>
          
          <div className="media-recording">
            {!isRecording ? (
              <div className="media-buttons">
                <button
                  type="button"
                  className="media-btn"
                  onClick={() => startRecording('audio')}
                  disabled={newConflict.videoBlob}
                >
                  <AudioOutlined /> 录制语音
                </button>
                <button
                  type="button"
                  className="media-btn"
                  onClick={() => startRecording('video')}
                  disabled={newConflict.audioBlob || newConflict.videoBlob}
                >
                  <VideoCameraOutlined /> 录制视频
                </button>
              </div>
            ) : (
              <div className="recording-status">
                <div className={`recording-indicator ${recordingType}`}></div>
                <span>正在录制{recordingType === 'audio' ? '语音' : '视频'}...</span>
                {recordingType === 'audio' && transcription && (
                  <div className="transcription-preview">
                    <p>识别结果：{transcription}</p>
                  </div>
                )}
                <button type="button" className="stop-btn" onClick={stopRecording}>
                  停止录制
                </button>
                {recordingType === 'video' && (
                  <video
                    ref={videoPreviewRef}
                    className="video-preview"
                    autoPlay
                    muted
                    playsInline
                  ></video>
                )}
              </div>
            )}
            
            {(newConflict.audioBlobs.length > 0 || newConflict.videoBlob) && (
              <div className="media-preview">
                {newConflict.audioBlobs.map((blob, index) => (
                  <div key={index} className="audio-item">
                    <audio
                      src={URL.createObjectURL(blob)}
                      controls
                      className="audio-preview"
                    ></audio>
                    <button
                      type="button"
                      className="delete-audio-btn"
                      onClick={() => setNewConflict(prev => ({
                        ...prev,
                        audioBlobs: prev.audioBlobs.filter((_, i) => i !== index)
                      }))}
                    >
                      删除
                    </button>
                  </div>
                ))}
                {newConflict.videoBlob && (
                  <video
                    src={URL.createObjectURL(newConflict.videoBlob)}
                    controls
                    className="video-preview"
                  ></video>
                )}
                {(newConflict.audioBlobs.length > 0 || newConflict.videoBlob) && (
                  <button
                    type="button"
                    className="clear-media-btn"
                    onClick={() => setNewConflict(prev => ({
                      ...prev,
                      audioBlobs: [],
                      videoBlob: null
                    }))}
                  >
                    清除全部媒体
                  </button>
                )}
              </div>
            )}
          </div>
          
          <button type="submit" className="btn">记录这个矛盾</button>
        </form>
      </div>

      <div className="filters-card card">
        <h3>筛选矛盾</h3>
        <div className="filters-container">
          <div className="filter-group">
            <label>时间范围</label>
            <div className="date-range">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
              />
              <span>至</span>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
              />
            </div>
          </div>
          
          <div className="filter-group">
            <label>关键词搜索</label>
            <input
              type="text"
              placeholder="搜索矛盾主题或描述..."
              value={filters.keyword}
              onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            />
          </div>
          
          <div className="filter-group">
            <label>状态</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">全部</option>
              <option value="resolved">已解决</option>
              <option value="unresolved">未解决</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="conflicts-list">
        {filteredConflicts.map(conflict => (
          <div key={conflict.id} className={`card conflict-card ${conflict.resolved ? 'resolved' : ''}`}>
            <button
              className="delete-btn"
              onClick={() => handleDelete(conflict.id)}
              title="删除矛盾卡片"
            >
              ×
            </button>
            <div className="conflict-header">
              <h3 className="conflict-issue">{conflict.issue}</h3>
              <div className={`emotion-indicator ${conflict.emotion}`}>
                {conflict.emotion === 'sad' && <FrownOutlined />}
                {conflict.emotion === 'neutral' && <MehOutlined />}
                {conflict.emotion === 'happy' && <SmileOutlined />}
              </div>
            </div>
            
            {conflict.description && (
              <div className="conflict-description">{conflict.description}</div>
            )}
            
            {(conflict.audioUrl || conflict.videoUrl) && (
              <div className="conflict-media">
                {conflict.audioUrl && (
                  <div className="media-item">
                    <h4>语音记录</h4>
                    <audio src={conflict.audioUrl} controls className="audio-player"></audio>
                  </div>
                )}
                {conflict.videoUrl && (
                  <div className="media-item">
                    <h4>视频记录</h4>
                    <video src={conflict.videoUrl} controls className="video-player"></video>
                  </div>
                )}
              </div>
            )}
            
            <div className="conflict-meta">
              <span className="conflict-date">
                <CalendarOutlined /> {conflict.date}
              </span>
              <span className={`conflict-status ${conflict.resolved ? 'resolved' : 'pending'}`}>
                {conflict.resolved ? '已解决' : '待解决'}
              </span>
            </div>
            
            <div className="ai-suggestion" onClick={() => handleChatClick(conflict.id)}>
              <div className="ai-suggestion-header">
                <h4><RobotOutlined /> AI解决建议</h4>
                <button 
                  className="refresh-suggestion-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    requestNewAISuggestion(conflict.id);
                  }}
                  title="获取新建议"
                >
                  <SyncOutlined />
                </button>
              </div>
              <p>{conflict.aiSuggestion || "AI正在分析您的矛盾..."}</p>
            </div>
            
            {conflict.resolved ? (
              <div className="conflict-resolution">
                <h4>解决方案:</h4>
                <p>{conflict.resolution}</p>
              </div>
            ) : (
              <div className="conflict-resolution-form">
                <h4>你的解决方案</h4>
                <div className="form-group">
                  <textarea
                    className="form-control"
                    placeholder="请输入如何解决这个矛盾..."
                    rows="2"
                    onBlur={(e) => handleResolve(conflict.id, e.target.value)}
                  ></textarea>
                </div>
                <small>输入解决方案后失去焦点自动保存</small>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConflictPage;