import React, { useState, useRef, useEffect } from 'react';
import { message } from 'antd';
import { HeartFilled, CalendarOutlined, TagsOutlined, AudioOutlined, VideoCameraOutlined, FileTextOutlined, CloseCircleOutlined, SaveOutlined, FilterOutlined, DownOutlined, UpOutlined, UploadOutlined } from '@ant-design/icons';
import '../styles/PromisesPage.css';

const PromisesPage = () => {
  // 从本地存储加载数据，如果没有则使用默认数据
  const loadPromisesFromStorage = () => {
    const savedPromises = localStorage.getItem('promises');
    if (savedPromises) {
      return JSON.parse(savedPromises);
    }
    return [
      {
        id: 1,
        content: "我承诺每天给你说早安和晚安，让你感受到我的爱和陪伴。",
        date: "2023-03-25",
        tag: "陪伴",
        type: "text"
      },
      {
        id: 2,
        content: "我承诺在你难过的时候，第一时间陪在你身边，给你温暖的拥抱。",
        date: "2023-03-20",
        tag: "支持",
        type: "text"
      },
      {
        id: 3,
        content: "我承诺记住你所有重要的日子，并且用心准备惊喜。",
        date: "2023-03-15",
        tag: "记念",
        type: "text"
      }
    ];
  };

  const [promises, setPromises] = useState(loadPromisesFromStorage);
  const [showTimeline, setShowTimeline] = useState(true);
  const [filterTag, setFilterTag] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [availableDates, setAvailableDates] = useState({ min: '', max: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [promiseToDelete, setPromiseToDelete] = useState(null);

  const [newPromise, setNewPromise] = useState({
    content: "",
    description: "", // 新增语音/视频的文字描述
    tag: "",
    type: "text"
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState(null); // 'audio' or 'video'
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingMedia, setRecordingMedia] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaChunksRef = useRef([]);
  const videoPreviewRef = useRef(null);
  const fileInputRef = useRef(null);

  // 每当promises变化时，保存到本地存储并计算可用的日期范围
  useEffect(() => {
    localStorage.setItem('promises', JSON.stringify(promises));
    
    if (promises.length > 0) {
      const dates = promises.map(promise => promise.date);
      const sortedDates = dates.sort();
      setAvailableDates({
        min: sortedDates[0],
        max: sortedDates[sortedDates.length - 1]
      });
    }
  }, [promises]);

  // 计算所有可用的标签
  useEffect(() => {
    const tags = promises
      .map(promise => promise.tag)
      .filter((tag, index, self) => self.indexOf(tag) === index); // 去重
    setAvailableTags(tags);
  }, [promises]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewPromise(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newFiles = files.map(file => {
      // 检查文件类型是否匹配当前选择的类型
      if (newPromise.type === 'text' && !file.type.includes('text') && !file.type.includes('document') && !file.type.includes('pdf')) {
        alert('请上传文本文档文件');
        return null;
      } else if (newPromise.type === 'audio' && !file.type.includes('audio')) {
        alert('请上传音频文件');
        return null;
      } else if (newPromise.type === 'video' && !file.type.includes('video')) {
        alert('请上传视频文件');
        return null;
      }

      // 创建文件URL
      const fileUrl = URL.createObjectURL(file);
      return {
        file: file,
        name: file.name,
        url: fileUrl,
        id: Date.now() + Math.random()
      };
    }).filter(file => file !== null);

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      // 移除自动填充输入框内容的逻辑
      // 仅更新上传文件状态
      // 显示上传成功提示
      message.success('文件上传成功！');
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (newPromise.type === 'text' && !newPromise.content.trim() && uploadedFiles.length === 0) return;
    if ((newPromise.type === 'audio' || newPromise.type === 'video') && (!recordedBlob && !uploadedFiles.length)) return;
    // 标签为选填，如果未填写则使用默认标签
    
    let content = newPromise.content;
    if (newPromise.type === 'audio' || newPromise.type === 'video') {
      content = recordedBlob ? URL.createObjectURL(recordedBlob) : uploadedFiles[0]?.url;
    } else if (uploadedFiles.length > 0 && !content.trim()) {
      content = `已上传文件：${uploadedFiles[0].name}`;
    }
    
    const promise = {
      id: Date.now(),
      content: content,
      description: newPromise.type !== 'text' ? newPromise.description : "",
      date: new Date().toISOString().slice(0, 10),
      tag: newPromise.tag || "承诺",
      type: newPromise.type,
      files: uploadedFiles.map(file => ({
        name: file.name,
        url: file.url
      }))
    };
    
    setPromises([promise, ...promises]);
    setNewPromise({ content: "", description: "", tag: "", type: "text" });
    setRecordedBlob(null);
    setRecordingMedia(null);
    setUploadedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async (type) => {
    try {
      setRecordingType(type);
      const constraints = {
        audio: true,
        video: type === 'video' ? { width: 480, height: 360 } : false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      mediaChunksRef.current = [];
      
      // 如果是视频录制，显示实时预览
      if (type === 'video' && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          mediaChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, {
          type: type === 'audio' ? 'audio/webm' : 'video/webm'
        });
        setRecordedBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setRecordingMedia(url);
        
        // 停止所有轨道
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        
        // 清除实时预览
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("录制出错:", error);
      alert("无法访问媒体设备，请确保允许浏览器访问麦克风和摄像头。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // 停止所有轨道
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // 清除实时预览
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
    }
    
    setIsRecording(false);
    setRecordingType(null);
    setRecordedBlob(null);
    setRecordingMedia(null);
    setUploadedFiles([]);
    setNewPromise(prev => ({ ...prev, type: "text", description: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectPromiseType = (type) => {
    setNewPromise(prev => ({ ...prev, type }));
    setUploadedFiles([]);
    setRecordedBlob(null);
    setRecordingMedia(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const toggleTimeline = () => {
    setShowTimeline(!showTimeline);
  };

  const handleTagFilter = (tag) => {
    setFilterTag(tag === filterTag ? '' : tag);
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearDateFilter = () => {
    setDateRange({ start: '', end: '' });
  };

  const renderPromiseForm = () => {
    if (isRecording || recordingMedia) {
      return (
        <div className="recording-container">
          {isRecording ? (
            <div className="recording-feedback">
              <div className={`recording-indicator ${recordingType}`}></div>
              <p>{recordingType === 'audio' ? '正在录音...' : '正在录像...'}</p>
              {recordingType === 'video' && (
                <div className="video-preview-container">
                  <video 
                    ref={videoPreviewRef} 
                    className="video-preview-live"
                    autoPlay 
                    muted 
                    playsInline
                  ></video>
                </div>
              )}
              <button className="btn stop-recording-btn" onClick={stopRecording}>
                停止录制
              </button>
            </div>
          ) : (
            <div className="recorded-media">
              {recordingType === 'audio' ? (
                <>
                  <audio controls src={recordingMedia} className="audio-preview"></audio>
                  <div className="form-group">
                    <label htmlFor="description">甜言蜜语</label>
                    <textarea
                      id="description"
                      name="description"
                      className="form-control"
                      placeholder="写下你想对Ta说的甜言蜜语..."
                      value={newPromise.description}
                      onChange={handleChange}
                      rows="3"
                    ></textarea>
                  </div>
                </>
              ) : (
                <>
                  <video controls src={recordingMedia} className="video-preview"></video>
                  <div className="form-group">
                    <label htmlFor="description">想见你时，我会说</label>
                    <textarea
                      id="description"
                      name="description"
                      className="form-control"
                      placeholder="写下你想对Ta说的话..."
                      value={newPromise.description}
                      onChange={handleChange}
                      rows="3"
                    ></textarea>
                  </div>
                </>
              )}
              <div className="form-group">
                <label htmlFor="tag">标签</label>
                <input
                  type="text"
                  id="tag"
                  name="tag"
                  className="form-control"
                  placeholder="例如：陪伴、支持、理解..."
                  value={newPromise.tag}
                  onChange={handleChange}
                />
              </div>
              <div className="media-controls">
                <button className="btn media-control-btn cancel-btn" onClick={cancelRecording}>
                  <CloseCircleOutlined /> 取消
                </button>
                <button className="btn media-control-btn save-btn" onClick={handleSubmit}>
                  <SaveOutlined /> 保存
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <form onSubmit={handleSubmit}>
        <div className="promise-type-selector">
          <button 
            type="button" 
            className={`type-btn ${newPromise.type === 'text' ? 'active' : ''}`}
            onClick={() => selectPromiseType('text')}
          >
            <FileTextOutlined /> 文字
          </button>
          <button 
            type="button" 
            className={`type-btn ${newPromise.type === 'audio' ? 'active' : ''}`}
            onClick={() => selectPromiseType('audio')}
          >
            <AudioOutlined /> 语音
          </button>
          <button 
            type="button" 
            className={`type-btn ${newPromise.type === 'video' ? 'active' : ''}`}
            onClick={() => selectPromiseType('video')}
          >
            <VideoCameraOutlined /> 视频
          </button>
        </div>
        
        {newPromise.type === 'text' ? (
          <>
            <div className="form-group">
              <label htmlFor="content">你的承诺</label>
              <textarea
                id="content"
                name="content"
                className="form-control"
                placeholder="写下你想对Ta说的承诺..."
                value={newPromise.content}
                onChange={handleChange}
                rows="3"
              ></textarea>
            </div>
            <div className="upload-container">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".txt,.doc,.docx,.pdf" 
                style={{display: 'none'}} 
              />
              <button type="button" className="upload-btn" onClick={triggerFileInput}>
                <UploadOutlined /> 上传文档
              </button>
              <div className="uploaded-files">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="file-item">
                    <span className="file-name">{file.name}</span>
                    <button
                      type="button"
                      className="delete-file-btn"
                      onClick={() => {
                        setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <CloseCircleOutlined />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="form-group">
            <div className="media-options">
              <div className="media-record-btn">
                <button
                  type="button"
                  className="btn"
                  onClick={() => startRecording(newPromise.type)}
                >
                  {newPromise.type === 'audio' ? '开始录音' : '开始录像'}
                </button>
              </div>
              <span className="or-divider">或</span>
              <div className="media-upload">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept={newPromise.type === 'audio' ? 'audio/*' : 'video/*'} 
                  style={{display: 'none'}} 
                />
                <button type="button" className="upload-btn" onClick={triggerFileInput}>
                  <UploadOutlined /> 上传{newPromise.type === 'audio' ? '音频' : '视频'}
                </button>
                {uploadedFiles[0] && (
                  <span className="file-name">{uploadedFiles[0].name}</span>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="tag">标签</label>
          <input
            type="text"
            id="tag"
            name="tag"
            className="form-control"
            placeholder="例如：陪伴、支持、理解..."
            value={newPromise.tag}
            onChange={handleChange}
          />
        </div>
        
        {(newPromise.type === 'text' || uploadedFiles[0]) && (
          <button type="submit" className="btn">记录这段誓言</button>
        )}
      </form>
    );
  };

  const handleDelete = (promise) => {
    setPromiseToDelete(promise);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (promiseToDelete) {
      const newPromises = promises.filter(p => p.id !== promiseToDelete.id);
      setPromises(newPromises);
      setShowDeleteConfirm(false);
      setPromiseToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setPromiseToDelete(null);
  };

  const renderPromiseContent = (promise) => {
    if (promise.type === 'text') {
      return (
        <div className="promise-content">
          <p>"{promise.content}"</p>
          <div className="file-links">
            {promise.files && promise.files.map((file, index) => (
              <a key={index} href={file.url} className="file-link" download={file.name}>
                <FileTextOutlined /> {file.name}
              </a>
            ))}
          </div>
        </div>
      );
    } else if (promise.type === 'audio') {
      return (
        <div className="promise-media">
          <audio controls src={promise.content} className="audio-player"></audio>
          {promise.files && promise.files.map((file, index) => (
            <div key={index} className="file-label">文件: {file.name}</div>
          ))}
          {promise.description && (
            <div className="promise-description">
              <h4>甜言蜜语:</h4>
              <p>"{promise.description}"</p>
            </div>
          )}
        </div>
      );
    } else if (promise.type === 'video') {
      return (
        <div className="promise-media">
          <video controls src={promise.content} className="video-player"></video>
          {promise.files && promise.files.map((file, index) => (
            <div key={index} className="file-label">文件: {file.name}</div>
          ))}
          {promise.description && (
            <div className="promise-description">
              <h4>想见你时，我会说:</h4>
              <p>"{promise.description}"</p>
            </div>
          )}
        </div>
      );
    }
  };
  
  // 按日期对承诺进行分组，并应用筛选
  const groupPromisesByDate = () => {
    let filtered = promises;
    
    // 应用标签筛选
    if (filterTag) {
      filtered = filtered.filter(promise => promise.tag === filterTag);
    }
    
    // 应用日期范围筛选
    if (dateRange.start) {
      filtered = filtered.filter(promise => promise.date >= dateRange.start);
    }
    
    if (dateRange.end) {
      filtered = filtered.filter(promise => promise.date <= dateRange.end);
    }
    
    const grouped = {};
    filtered.forEach(promise => {
      if (!grouped[promise.date]) {
        grouped[promise.date] = [];
      }
      grouped[promise.date].push(promise);
    });
    return grouped;
  };

  const groupedPromises = groupPromisesByDate();
  const sortedDates = Object.keys(groupedPromises).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="promises-page">
      <h2 className="page-title">
        誓言记录 <HeartFilled className="heart-icon" />
      </h2>
      
      <div className="card promise-form-card">
        <h3>记录新的誓言</h3>
        {renderPromiseForm()}
      </div>
      
      <div className="timeline-controls">
        <button className="timeline-toggle-btn" onClick={toggleTimeline}>
          {showTimeline ? <UpOutlined /> : <DownOutlined />} 
          {showTimeline ? '收起时间轴' : '展开时间轴'}
        </button>
        
        <div className="date-filter">
          <span className="filter-label">
            <CalendarOutlined /> 日期:
          </span>
          <div className="date-inputs">
            <input
              type="date"
              name="start"
              value={dateRange.start}
              onChange={handleDateRangeChange}
              min={availableDates.min}
              max={availableDates.max}
              className="date-input"
              placeholder="开始日期"
            />
            <span className="date-separator">至</span>
            <input
              type="date"
              name="end"
              value={dateRange.end}
              onChange={handleDateRangeChange}
              min={dateRange.start || availableDates.min}
              max={availableDates.max}
              className="date-input"
              placeholder="结束日期"
            />
            {(dateRange.start || dateRange.end) && (
              <button className="clear-filter-btn" onClick={clearDateFilter}>
                清除
              </button>
            )}
          </div>
        </div>
        
        <div className="tag-filter">
          <span className="filter-label">
            <FilterOutlined /> 筛选:
          </span>
          <div className="tag-buttons">
            <button 
              className={`tag-filter-btn ${filterTag === '' ? 'active' : ''}`} 
              onClick={() => setFilterTag('')}
            >
              全部
            </button>
            {availableTags.map(tag => (
              <button 
                key={tag} 
                className={`tag-filter-btn ${filterTag === tag ? 'active' : ''}`} 
                onClick={() => handleTagFilter(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {showTimeline && (
        <div className="promises-timeline">
          {sortedDates.length > 0 ? (
            sortedDates.map(date => (
              <div key={date} className="timeline-section">
                <div className="timeline-date">
                  <span>{date}</span>
                </div>
                <div className="promises-list">
                  {groupedPromises[date].map(promise => (
                    <div key={promise.id} className="card promise-card">
                      {renderPromiseContent(promise)}
                      <div className="promise-meta">
                        <div className="promise-info">
                          <span className="promise-date">
                            <CalendarOutlined /> {promise.date}
                          </span>
                          <span className="promise-tag">
                            <TagsOutlined /> {promise.tag}
                          </span>
                        </div>
                        <button className="delete-btn" onClick={() => handleDelete(promise)}>
                          <CloseCircleOutlined /> 删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-timeline">
              <p>没有找到符合条件的誓言记录</p>
            </div>
          )}
        </div>
      )}
      
      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="delete-confirm-content">
            <h3>确认删除</h3>
            <p>确定要删除这条誓言记录吗？此操作不可撤销。</p>
            <div className="delete-confirm-buttons">
              <button className="cancel-btn" onClick={cancelDelete}>取消</button>
              <button className="confirm-btn" onClick={confirmDelete}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromisesPage;