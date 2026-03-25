CREATE DATABASE IF NOT EXISTS accountech_db;
USE accountech_db;

CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS allowed_students (
  student_id VARCHAR(20) PRIMARY KEY,
  phinma_email VARCHAR(120) UNIQUE NOT NULL,
  is_registered TINYINT(1) NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NULL,
  otp_hash VARCHAR(255) NULL,
  otp_expires_at DATETIME NULL,
  role ENUM('ADMIN', 'FACULTY', 'STUDENT') NOT NULL,
  name VARCHAR(120) NULL,
  student_id VARCHAR(20) NULL,
  is_activated TINYINT(1) NOT NULL DEFAULT 0,
  last_login DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_allowed_students FOREIGN KEY (student_id)
    REFERENCES allowed_students(student_id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS difficulty_tiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(40) UNIQUE NOT NULL,
  description VARCHAR(255) NULL,
  weight INT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  topic VARCHAR(140) NOT NULL,
  difficulty ENUM('Easy', 'Average', 'Difficult') NOT NULL DEFAULT 'Average',
  content TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
  reference_text TEXT NULL,
  created_by INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_questions_subject FOREIGN KEY (subject_id)
    REFERENCES subjects(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_questions_user FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE SET NULL,
  INDEX idx_questions_subject_difficulty (subject_id, difficulty)
);

CREATE TABLE IF NOT EXISTS drill_sessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,
  subject_id INT NOT NULL,
  score INT NOT NULL,
  total_q INT NOT NULL DEFAULT 20,
  accuracy_percentage DECIMAL(5,2) NOT NULL,
  taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_student FOREIGN KEY (student_id)
    REFERENCES allowed_students(student_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_sessions_subject FOREIGN KEY (subject_id)
    REFERENCES subjects(id)
    ON DELETE CASCADE,
  INDEX idx_sessions_student_subject (student_id, subject_id),
  INDEX idx_sessions_taken_at (taken_at)
);

CREATE TABLE IF NOT EXISTS drill_responses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,
  question_id INT NOT NULL,
  selected_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
  is_correct TINYINT(1) NOT NULL,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_responses_student FOREIGN KEY (student_id)
    REFERENCES allowed_students(student_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_responses_question FOREIGN KEY (question_id)
    REFERENCES questions(id)
    ON DELETE CASCADE,
  INDEX idx_responses_student (student_id),
  INDEX idx_responses_question (question_id)
);

CREATE TABLE IF NOT EXISTS historical_board_data (
  year YEAR PRIMARY KEY,
  passing_rate DECIMAL(5,2) NOT NULL,
  cohort_size INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
