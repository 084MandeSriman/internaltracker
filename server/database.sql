
CREATE DATABASE recruitmentDB;
USE recruitmentDB;

CREATE TABLE candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(100),
  experience INT,
  status VARCHAR(50),
  client VARCHAR(100)
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'hr', 'client') DEFAULT 'hr',
  client_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT,
  interviewer_name VARCHAR(100),
  scheduled_at DATETIME,
  meet_link VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);
