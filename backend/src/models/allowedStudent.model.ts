import { Schema, model } from 'mongoose';

const allowedStudentSchema = new Schema(
  {
    studentId: { type: String, required: true, unique: true, trim: true },
    phinmaEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isRegistered: { type: Boolean, default: false },
    enrolledByFacultyUserId: { type: String, default: null, index: true },
    enrolledByFacultyEmail: { type: String, default: null },
    section: { type: String, default: null, trim: true, index: true },
    department: { type: String, default: null, trim: true, index: true },
    enrolledAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export const AllowedStudentModel = model('AllowedStudent', allowedStudentSchema);
