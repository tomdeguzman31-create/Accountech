import { Schema, Types, model } from 'mongoose';

const examAssignmentSchema = new Schema(
  {
    studentId: { type: String, required: true, index: true },
    subjectId: { type: Types.ObjectId, ref: 'Subject', required: true, index: true },
    difficulty: {
      type: String,
      enum: ['Easy', 'Average', 'Difficult'],
      default: null,
      index: true,
    },
    assignedByFacultyUserId: { type: String, required: true, index: true },
    assignedByFacultyEmail: { type: String, default: null },
    assignedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true, index: true },
  },
  { versionKey: false },
);

examAssignmentSchema.index(
  { studentId: 1, subjectId: 1, difficulty: 1, assignedByFacultyUserId: 1 },
  { unique: true },
);

export const ExamAssignmentModel = model('ExamAssignment', examAssignmentSchema);
