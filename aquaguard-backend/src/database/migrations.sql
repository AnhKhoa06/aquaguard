-- Tạo database
CREATE DATABASE IF NOT EXISTS aquaguard;
USE aquaguard;

-- Bảng users (cập nhật thêm field)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('citizen', 'responder', 'admin') DEFAULT 'citizen',
  health_status ENUM('safe', 'danger', 'injured', 'unknown') DEFAULT 'unknown',
  health_note TEXT,
  age INT,
  gender ENUM('male', 'female', 'other'),
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng refresh_tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng family_members
CREATE TABLE IF NOT EXISTS family_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  member_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng rescue_teams
CREATE TABLE IF NOT EXISTS rescue_teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  area VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng rescue_team_members
CREATE TABLE IF NOT EXISTS rescue_team_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  user_id INT NOT NULL,
  FOREIGN KEY (team_id) REFERENCES rescue_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng sos_requests (cập nhật thêm field)
CREATE TABLE IF NOT EXISTS sos_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  responder_id INT,
  team_id INT,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  address TEXT,
  description TEXT,
  urgency_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  num_people INT DEFAULT 1,
  status ENUM('pending', 'assigned', 'in_progress', 'resolved', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (responder_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (team_id) REFERENCES rescue_teams(id) ON DELETE SET NULL
);

-- Bảng sos_images
CREATE TABLE IF NOT EXISTS sos_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sos_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sos_id) REFERENCES sos_requests(id) ON DELETE CASCADE
);

-- Bảng alerts
CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_by INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  severity ENUM('info', 'warning', 'danger', 'critical') DEFAULT 'info',
  center_lat FLOAT,
  center_lng FLOAT,
  radius_km FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng shelters
CREATE TABLE IF NOT EXISTS shelters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  capacity INT NOT NULL,
  current_count INT DEFAULT 0,
  status ENUM('open', 'full', 'closed') DEFAULT 'open',
  address TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng flood_data
CREATE TABLE IF NOT EXISTS flood_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  precipitation_mm FLOAT NOT NULL,
  risk_level ENUM('safe', 'moderate', 'high', 'critical') DEFAULT 'safe',
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  alert_id INT,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE SET NULL
);