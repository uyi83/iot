-- 1. Tạo cơ sở dữ liệu
CREATE DATABASE IF NOT EXISTS iotdb;

-- 2. Chọn cơ sở dữ liệu
USE iotdb;

-- 3. Tạo bảng sensor_data
CREATE TABLE IF NOT EXISTS sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperature FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    light INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
);

-- 4. Tạo bảng action_history
CREATE TABLE IF NOT EXISTS action_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device VARCHAR(50) NOT NULL,
    action VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device (device),
    INDEX idx_created_at (created_at)
);

-- 5. Tạo bảng device_state
CREATE TABLE IF NOT EXISTS device_state (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_name VARCHAR(50) UNIQUE NOT NULL,
    state VARCHAR(10) NOT NULL DEFAULT 'OFF',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

use iotdb;
SELECT * FROM action_history;
INSERT INTO device_state (device_name, state) 
VALUES 
    ('FAN', 'OFF'),
    ('AIR_CONDITIONER', 'OFF'),
    ('LED', 'OFF');