import React, { useState, useRef, useEffect } from 'react';
import { HeartFilled, CalendarOutlined, TagsOutlined, AudioOutlined, VideoCameraOutlined, FileTextOutlined, CloseCircleOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { message } from 'antd';
import '../styles/MomentsPage.css';

const MomentsPage = () => {
  // 从本地存储加载数据
  const loadMomentsFromStorage = () => {
    const savedMoments = localStorage.getItem('moments');
    if (savedMoments) {
      return JSON.parse(savedMoments);
    }
    return [
      {
        id: 1,
        content: "今天你给我发了一张你笑得特别灿烂的照片，瞬间让我的心情变得无比美好。",
        date: "2023-04-15",
        tag: "小确幸",
        type: "text"
      },
      {
        id: 2,
        content: "我们一起看日落的时候，你靠在我肩膀上的那一刻，我感觉世界都静止了。",
        date: "2023-04-10",
        tag: "浪漫",
        type: "text"
      }
    ];
  };

  const [moments, setMoments] = useState(loadMomentsFromStorage);
  const [newMoment, setNewMoment] = useState({
    content: "",
    description: "",
    tag: "",
    type: "text"
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [momentToDelete, setMomentToDelete] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingMedia, setRecordingMedia] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaChunksRef = useRef([]);
  const videoPreviewRef = useRef(null);
  const fileInputRef = useRef(null);

  // 保存到本地存储
  useEffect(() => {
    localStorage.setItem('moments', JSON.stringify(moments));
  }, [moments]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewMoment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newFiles = files.map(file => {
      // 检查文件类型是否匹配当前选择的类型
      if (newMoment.type === 'text' && !file.type.includes('text') && !file.type.includes('document')) {
        alert('请上传文本文档文件');
        return null;
      } else if (newMoment.type === 'audio' && !file.type.includes('audio')) {
        alert('请上传音频文件');
        return null;
      } else if (newMoment.type === 'video' && !file.type.includes('video')) {
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
    if (newMoment.type === 'text' && !newMoment.content.trim() && uploadedFiles.length === 0) return;
    if ((newMoment.type === 'audio' || newMoment.type === 'video') && (!recordedBlob)) return;
    // 标签为选填，如果未填写则使用默认标签
    
    let content = newMoment.content;
    if (newMoment.type === 'audio' || newMoment.type === 'video') {
      content = URL.createObjectURL(recordedBlob);
    } else if (uploadedFiles.length > 0 && !content.trim()) {
      content = `已上传文件：${uploadedFiles.map(file => file.name).join(', ')}`;
    }
    
    const moment = {
      id: Date.now(),
      content: content,
      description: newMoment.type !== 'text' ? newMoment.description : "",
      date: new Date().toISOString().slice(0, 10),
      tag: newMoment.tag || "心动",
      type: newMoment.type,
      files: uploadedFiles.length > 0 ? [{
        name: uploadedFiles[0].name,
        url: uploadedFiles[0].url
      }] : []
    };
    
    setMoments([moment, ...moments]);
    setNewMoment({ content: "", description: "", tag: "", type: "text" });
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
      
      // 视频预览
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
        
        // 清除预览
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
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
    }
    
    setIsRecording(false);
    setRecordingType(null);
    setRecordedBlob(null);
    setRecordingMedia(null);
    setUploadedFiles([]);
    setNewMoment(prev => ({ ...prev, type: "text", description: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectMomentType = (type) => {
    setNewMoment(prev => ({ ...prev, type }));
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

  const renderMomentForm = () => {
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
                    <label htmlFor="description">描述这个心动瞬间</label>
                    <textarea
                      id="description"
                      name="description"
                      className="form-control"
                      placeholder="描述这个让你心动的瞬间..."
                      value={newMoment.description}
                      onChange={handleChange}
                      rows="3"
                    ></textarea>
                  </div>
                </>
              ) : (
                <>
                  <video controls src={recordingMedia} className="video-preview"></video>
                  <div className="form-group">
                    <label htmlFor="description">描述这个心动瞬间</label>
                    <textarea
                      id="description"
                      name="description"
                      className="form-control"
                      placeholder="描述这个让你心动的瞬间..."
                      value={newMoment.description}
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
                  placeholder="例如：小确幸、浪漫、感动..."
                  value={newMoment.tag}
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
        <div className="moment-type-selector">
          <button 
            type="button" 
            className={`type-btn ${newMoment.type === 'text' ? 'active' : ''}`}
            onClick={() => selectMomentType('text')}
          >
            <FileTextOutlined /> 文字
          </button>
          <button 
            type="button" 
            className={`type-btn ${newMoment.type === 'audio' ? 'active' : ''}`}
            onClick={() => selectMomentType('audio')}
          >
            <AudioOutlined /> 语音
          </button>
          <button 
            type="button" 
            className={`type-btn ${newMoment.type === 'video' ? 'active' : ''}`}
            onClick={() => selectMomentType('video')}
          >
            <VideoCameraOutlined /> 视频
          </button>
        </div>
        
        {newMoment.type === 'text' ? (
          <>
            <div className="form-group">
              <label htmlFor="content">心动瞬间</label>
              <textarea
                id="content"
                name="content"
                className="form-control"
                placeholder="描述那个让你心动的瞬间..."
                value={newMoment.content}
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
                  onClick={() => startRecording(newMoment.type)}
                >
                  {newMoment.type === 'audio' ? '开始录音' : '开始录像'}
                </button>
              </div>
              <span className="or-divider">或</span>
              <div className="media-upload">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept={newMoment.type === 'audio' ? 'audio/*' : 'video/*'} 
                  style={{display: 'none'}} 
                />
                <button type="button" className="upload-btn" onClick={triggerFileInput}>
                  <UploadOutlined /> 上传{newMoment.type === 'audio' ? '音频' : '视频'}
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
            placeholder="例如：小确幸、浪漫、感动..."
            value={newMoment.tag}
            onChange={handleChange}
          />
        </div>
        
        {(newMoment.type === 'text' || uploadedFiles[0]) && (
          <button type="submit" className="btn">记录这个心动瞬间</button>
        )}
      </form>
    );
  };

  const handleDelete = (moment) => {
    setMomentToDelete(moment);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (momentToDelete) {
      const newMoments = moments.filter(m => m.id !== momentToDelete.id);
      setMoments(newMoments);
      setShowDeleteConfirm(false);
      setMomentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setMomentToDelete(null);
  };

  const renderMomentContent = (moment) => {
    if (moment.type === 'text') {
      return (
        <div className="moment-content">
          <p>"{moment.content}"</p>
          <div className="file-links">
            {moment.files && moment.files.map((file, index) => (
              <a key={index} href={file.url} className="file-link" download={file.name}>
                <FileTextOutlined /> {file.name}
              </a>
            ))}
          </div>
        </div>
      );
    } else if (moment.type === 'audio') {
      return (
        <div className="moment-media">
          <audio controls src={moment.content} className="audio-player"></audio>
          {moment.files && moment.files.map((file, index) => (
            <div key={index} className="file-label">文件: {file.name}</div>
          ))}
          {moment.description && (
            <div className="moment-description">
              <p>"{moment.description}"</p>
            </div>
          )}
        </div>
      );
    } else if (moment.type === 'video') {
      return (
        <div className="moment-media">
          <video controls src={moment.content} className="video-player"></video>
          {moment.files && moment.files.map((file, index) => (
            <div key={index} className="file-label">文件: {file.name}</div>
          ))}
          {moment.description && (
            <div className="moment-description">
              <p>"{moment.description}"</p>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="moments-page">
      <h2 className="page-title">
        心动瞬间 <HeartFilled className="heart-icon" />
      </h2>
      
      <div className="card moment-form-card">
        <h3>记录新的心动瞬间</h3>
        {renderMomentForm()}
      </div>
      
      <div className="moments-list">
        {moments.map(moment => (
          <div key={moment.id} className="card moment-card">
            {renderMomentContent(moment)}
            <div className="moment-meta">
              <span className="moment-date">
                <CalendarOutlined /> {moment.date}
              </span>
              <span className="moment-tag">
                <TagsOutlined /> {moment.tag}
              </span>
              <button className="delete-btn" onClick={() => handleDelete(moment)}>
                <CloseCircleOutlined /> 删除
              </button>
            </div>
          </div>
        ))}
      </div>
      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="delete-confirm-content">
            <p>确定要删除这条记录吗？</p>
            <div className="delete-confirm-buttons">
              <button onClick={confirmDelete}>确定</button>
              <button onClick={cancelDelete}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MomentsPage;