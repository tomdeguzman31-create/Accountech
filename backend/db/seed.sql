USE accountech_db;

INSERT INTO subjects (code, name) VALUES
('FAR', 'Financial Accounting and Reporting'),
('AFAR', 'Advanced Financial Accounting and Reporting'),
('MAS', 'Management Advisory Services'),
('TAX', 'Taxation'),
('RFBT', 'Regulatory Framework for Business Transactions'),
('AUD', 'Auditing')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO difficulty_tiers (name, description, weight) VALUES
('Easy', 'Recall and basic concepts', 1),
('Average', 'Application and analysis', 2),
('Difficult', 'Evaluation and board-level complexity', 3)
ON DUPLICATE KEY UPDATE description = VALUES(description), weight = VALUES(weight);

INSERT INTO allowed_students (student_id, phinma_email) VALUES
('01-2223-123456', 'student@phinmaed.com'),
('01-2425-000001', 'test@phinmaed.com'),
('01-2223-998877', 'juan.delacruz@phinmaed.com')
ON DUPLICATE KEY UPDATE phinma_email = VALUES(phinma_email);

INSERT INTO historical_board_data (year, passing_rate, cohort_size) VALUES
(2022, 45.00, 120),
(2023, 52.00, 130),
(2024, 68.00, 142),
(2025, 75.00, 150)
ON DUPLICATE KEY UPDATE passing_rate = VALUES(passing_rate), cohort_size = VALUES(cohort_size);
