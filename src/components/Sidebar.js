import React from 'react';
import { NavLink } from 'react-router-dom';
import { HeartOutlined, MessageOutlined, UserOutlined, FireOutlined } from '@ant-design/icons';
import '../styles/Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="logo">
        <h1>海誓山盟</h1>
      </div>
      <nav className="nav-menu">
        <NavLink to="/promises" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <HeartOutlined className="nav-icon" />
          <span>誓言记录</span>
        </NavLink>
        <NavLink to="/moments" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <FireOutlined className="nav-icon" />
          <span>心动瞬间</span>
        </NavLink>
        <NavLink to="/conflicts" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <MessageOutlined className="nav-icon" />
          <span>矛盾管理</span>
        </NavLink>
        <NavLink to="/profile" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <UserOutlined className="nav-icon" />
          <span>用户中心</span>
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <p className="love-quote">"爱情是灵魂与灵魂的相遇"</p>
      </div>
    </div>
  );
};

export default Sidebar; 