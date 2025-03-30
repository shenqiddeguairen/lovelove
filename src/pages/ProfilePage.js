import React, { useState } from 'react';
import { UserOutlined, HeartOutlined, BellOutlined, CalendarOutlined, EditOutlined } from '@ant-design/icons';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    name: "张小明",
    partnerName: "李小红",
    anniversary: "2022-11-15",
    avatar: "",
    partnerAvatar: "",
    notifications: true,
    specialDates: [
      { id: 1, title: "认识纪念日", date: "2022-10-01" },
      { id: 2, title: "第一次约会", date: "2022-10-20" },
      { id: 3, title: "生日", date: "1998-05-12" }
    ]
  });

  const [newDate, setNewDate] = useState({
    title: "",
    date: ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({...profile});
  
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setNewDate(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSpecialDate = (e) => {
    e.preventDefault();
    if (!newDate.title.trim() || !newDate.date) return;
    
    const date = {
      id: Date.now(),
      title: newDate.title,
      date: newDate.date
    };
    
    setProfile(prev => ({
      ...prev,
      specialDates: [...prev.specialDates, date]
    }));
    
    setNewDate({ title: "", date: "" });
  };

  const handleRemoveDate = (id) => {
    setProfile(prev => ({
      ...prev,
      specialDates: prev.specialDates.filter(date => date.id !== id)
    }));
  };

  const toggleEdit = () => {
    if (isEditing) {
      setProfile(editedProfile);
    } else {
      setEditedProfile({...profile});
    }
    setIsEditing(!isEditing);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleNotifications = () => {
    setProfile(prev => ({
      ...prev,
      notifications: !prev.notifications
    }));
  };

  return (
    <div className="profile-page">
      <h2 className="page-title">
        用户中心 <UserOutlined />
      </h2>
      
      <div className="profile-content">
        <div className="card profile-card">
          <div className="profile-header">
            <h3>个人信息</h3>
            <button 
              className="edit-btn"
              onClick={toggleEdit}
            >
              {isEditing ? '保存' : '编辑'} <EditOutlined />
            </button>
          </div>
          
          <div className="profile-details">
            <div className="profile-avatars">
              <div className="avatar-container">
                <div className="avatar-placeholder">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="你的头像" className="profile-avatar" />
                  ) : (
                    <UserOutlined />
                  )}
                </div>
                <p>我</p>
              </div>
              
              <div className="love-connector">
                <HeartOutlined className="heart-icon" />
              </div>
              
              <div className="avatar-container">
                <div className="avatar-placeholder">
                  {profile.partnerAvatar ? (
                    <img src={profile.partnerAvatar} alt="伴侣头像" className="profile-avatar" />
                  ) : (
                    <UserOutlined />
                  )}
                </div>
                <p>Ta</p>
              </div>
            </div>
            
            {isEditing ? (
              <div className="profile-form">
                <div className="form-group">
                  <label htmlFor="name">你的名字</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    value={editedProfile.name}
                    onChange={handleEditChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="partnerName">Ta的名字</label>
                  <input
                    type="text"
                    id="partnerName"
                    name="partnerName"
                    className="form-control"
                    value={editedProfile.partnerName}
                    onChange={handleEditChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="anniversary">恋爱纪念日</label>
                  <input
                    type="date"
                    id="anniversary"
                    name="anniversary"
                    className="form-control"
                    value={editedProfile.anniversary}
                    onChange={handleEditChange}
                  />
                </div>
              </div>
            ) : (
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">你的名字:</span>
                  <span className="info-value">{profile.name}</span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">Ta的名字:</span>
                  <span className="info-value">{profile.partnerName}</span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">恋爱纪念日:</span>
                  <span className="info-value">{profile.anniversary}</span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">在一起:</span>
                  <span className="info-value">
                    {Math.floor((new Date() - new Date(profile.anniversary)) / (1000 * 60 * 60 * 24))} 天
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="card settings-card">
          <h3>通知设置</h3>
          <div className="setting-item">
            <div className="setting-info">
              <BellOutlined className="setting-icon" />
              <span>重要日期提醒</span>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={profile.notifications}
                onChange={toggleNotifications}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
        
        <div className="card dates-card">
          <h3>重要日期</h3>
          <div className="dates-list">
            {profile.specialDates.map(date => (
              <div key={date.id} className="date-item">
                <div className="date-info">
                  <CalendarOutlined className="date-icon" />
                  <div>
                    <h4>{date.title}</h4>
                    <p>{date.date}</p>
                  </div>
                </div>
                <button 
                  className="remove-date-btn"
                  onClick={() => handleRemoveDate(date.id)}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleAddSpecialDate} className="add-date-form">
            <h4>添加新日期</h4>
            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  name="title"
                  placeholder="日期名称"
                  className="form-control"
                  value={newDate.title}
                  onChange={handleDateChange}
                />
              </div>
              
              <div className="form-group">
                <input
                  type="date"
                  name="date"
                  className="form-control"
                  value={newDate.date}
                  onChange={handleDateChange}
                />
              </div>
            </div>
            
            <button type="submit" className="btn">添加</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 