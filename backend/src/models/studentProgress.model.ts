import { Schema, Types, model } from 'mongoose';

const studentProgressSchema = new Schema(
  {
    studentId: { type: String, required: true, index: true }, // refs User.studentId
    facultyUserId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    subjectId: { type: Types.ObjectId, ref: 'Subject', required: true, index: true },
    proficiencyScore: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    totalAssignedSets: { type: Number, default: 0 },
    completedSetCount: { type: Number, default: 0 },
    isAtRisk: { type: Boolean, default: false, index: true },
    batchYear: { type: Number, default: null, index: true },
  },
  { timestamps: true, versionKey: false },
);

studentProgressSchema.index({ studentId: 1, facultyUserId: 1, subjectId: 1 }, { unique: true });

export const StudentProgressModel = model('StudentProgress', studentProgressSchema);
