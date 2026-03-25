
/**
 * ACCOUNTECH BACKEND ARCHITECTURE
 * 
 * 1. MySQL Schema (Normalized)
 * 2. Auth Controller (Bcrypt & OTP Logic)
 * 3. AI Parser Implementation (Mammoth/PDF-Parse)
 */

export const SQL_DDL = `
-- Database: accountech_db
-- Normalized Schema for Integrated Informatics Ecosystem

CREATE TABLE Subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL, -- FAR, TAX, etc.
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE AllowedStudents (
    student_id VARCHAR(20) PRIMARY KEY, -- Format: 01-XXXX-XXXXXX
    phinma_email VARCHAR(100) UNIQUE NOT NULL,
    is_registered BOOLEAN DEFAULT FALSE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    otp_hash VARCHAR(255),
    role ENUM('ADMIN', 'FACULTY', 'STUDENT') NOT NULL,
    name VARCHAR(100),
    student_id VARCHAR(20), -- Linked to Phinma ID
    is_activated BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES AllowedStudents(student_id) ON DELETE SET NULL
);

CREATE TABLE Questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    topic VARCHAR(100),
    difficulty ENUM('Easy', 'Average', 'Difficult') DEFAULT 'Average',
    content TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL, -- A, B, C, or D
    reference_text TEXT,
    created_by INT,
    FOREIGN KEY (subject_id) REFERENCES Subjects(id),
    FOREIGN KEY (created_by) REFERENCES Users(id)
);

CREATE TABLE DrillSessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20),
    subject_id INT,
    score INT,
    total_q INT DEFAULT 20,
    accuracy_percentage DECIMAL(5,2),
    taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES AllowedStudents(student_id),
    FOREIGN KEY (subject_id) REFERENCES Subjects(id)
);

-- For Predictive Analytics Trend (2022-2025 Historical Data)
CREATE TABLE HistoricalBoardData (
    year VARCHAR(10) PRIMARY KEY,
    passing_rate DECIMAL(5,2),
    cohort_size INT
);
`;

export const NODE_AUTH_LOGIC = `
/**
 * SECURITY: Bcrypt for hashing all Passwords and OTPs
 * Implementation using Express + MySQL2/Promise
 */
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('./db');

// 1. Initial Email Check & OTP Generation
exports.verifyPhinmaEmail = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check AllowedStudents table first (Filtered Registration)
        const [allowed] = await db.query(
            'SELECT * FROM AllowedStudents WHERE phinma_email = ?', 
            [email]
        );
        
        if (!allowed.length) {
            return res.status(403).json({ message: 'Access Denied: Email not in Whitelist' });
        }

        // Generate Alphanumeric OTP
        const otp = crypto.randomBytes(3).toString('hex').toUpperCase(); 
        const hashedOtp = await bcrypt.hash(otp, 12); // High rounds for security
        
        // Update user record with OTP hash
        await db.query('UPDATE Users SET otp_hash = ? WHERE email = ?', [hashedOtp, email]);
        
        // Trigger Phinma Mail (Nodemailer snippet)
        // await mailer.sendOTP(email, otp);
        
        res.json({ success: true, message: 'OTP dispatched to Phinma Inbox' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Set New Password (Post-OTP Verification)
exports.activateAccount = async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    await db.query(
        'UPDATE Users SET password_hash = ?, is_activated = TRUE, otp_hash = NULL WHERE email = ?',
        [hashedPassword, email]
      );
    res.json({ success: true, message: 'Account Activated. Security setup complete.' });
};
`;

export const AI_PARSER_LOGIC = `
/**
 * AI Document Parser Logic (Note for Dev Team)
 * Use 'mammoth' for .docx and 'pdf-parse' for extraction.
 */
const mammoth = require("mammoth");
const pdf = require("pdf-parse");

exports.parseExamFile = async (req, res) => {
    let rawText = "";
    const file = req.file;

    if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        rawText = result.value;
    } else if (file.mimetype === "application/pdf") {
        const data = await pdf(file.buffer);
        rawText = data.text;
    }

    /**
     * PROMPT STRATEGY for Gemini API:
     * "Extract questions from the following text. 
     * Format as JSON array. 
     * Identify '1. Question', 'A. Option', 'Key: A', 'Ref: Topic X'."
     */
     const structuredQuestions = await gemini.parse(rawText);
     res.json(structuredQuestions);
};
`;
