import { connectDatabase } from '../config/db.js';
import { AllowedStudentModel } from '../models/allowedStudent.model.js';
import { HistoricalBoardDataModel } from '../models/historicalBoardData.model.js';
import { SubjectModel } from '../models/subject.model.js';
import { UserModel } from '../models/user.model.js';
import { hashValue } from '../utils/auth.js';

async function seed(): Promise<void> {
  await connectDatabase();

  const subjects = [
    { code: 'FAR', name: 'Financial Accounting and Reporting' },
    { code: 'AFAR', name: 'Advanced Financial Accounting and Reporting' },
    { code: 'MAS', name: 'Management Advisory Services' },
    { code: 'TAX', name: 'Taxation' },
    { code: 'RFBT', name: 'Regulatory Framework for Business Transactions' },
    { code: 'AUD', name: 'Auditing' },
  ];

  for (const subject of subjects) {
    await SubjectModel.updateOne(
      { code: subject.code },
      { $set: { name: subject.name, isActive: true } },
      { upsert: true },
    );
  }

  const students = [
    { studentId: '01-2223-123456', phinmaEmail: 'student@phinmaed.com' },
    { studentId: '01-2425-000001', phinmaEmail: 'test@phinmaed.com' },
    { studentId: '01-2223-998877', phinmaEmail: 'juan.delacruz@phinmaed.com' },
    { studentId: '01-2425-000777', phinmaEmail: 'tira.deguzman.au@phinmaed.com' },
  ];

  for (const student of students) {
    await AllowedStudentModel.updateOne(
      { studentId: student.studentId },
      {
        $set: {
          phinmaEmail: student.phinmaEmail,
        },
      },
      { upsert: true },
    );
  }

  const historical = [
    { year: 2022, passingRate: 45, cohortSize: 120 },
    { year: 2023, passingRate: 52, cohortSize: 130 },
    { year: 2024, passingRate: 68, cohortSize: 142 },
    { year: 2025, passingRate: 75, cohortSize: 150 },
  ];

  for (const item of historical) {
    await HistoricalBoardDataModel.updateOne(
      { year: item.year },
      { $set: item },
      { upsert: true },
    );
  }

  // Seed admin, faculty, and student accounts
  const users = [
    {
      email: 'admin@phinmaed.com',
      password: 'admin123',
      role: 'ADMIN',
      name: 'Admin User',
      isActivated: true,
      isActive: true,
    },
    {
      email: 'faculty@phinmaed.com',
      password: 'faculty123',
      role: 'FACULTY',
      name: 'Faculty User',
      isActivated: true,
      isActive: true,
    },
    {
      email: 'student@phinmaed.com',
      password: 'student123',
      role: 'STUDENT',
      name: 'Student User',
      isActivated: true,
      isActive: true,
    },
  ];

  for (const user of users) {
    const passwordHash = await hashValue(user.password);
    await UserModel.updateOne(
      { email: user.email },
      {
        $set: {
          passwordHash,
          role: user.role,
          name: user.name,
          isActivated: user.isActivated,
          isActive: user.isActive,
        },
        $setOnInsert: {
          email: user.email,
        },
      },
      { upsert: true },
    );
  }

  // eslint-disable-next-line no-console
  console.log('MongoDB seed complete.');
  process.exit(0);
}

void seed();
