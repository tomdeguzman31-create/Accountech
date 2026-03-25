import { Schema, Types, model } from 'mongoose';

const drillSessionSchema = new Schema(
  {
    studentId: { type: String, required: true, index: true },
    subjectId: { type: Types.ObjectId, ref: 'Subject', required: true, index: true },
    score: { type: Number, required: true },
    totalQ: { type: Number, required: true, default: 20 },
    accuracyPercentage: { type: Number, required: true },
    difficulty: { type: String, enum: ['Easy', 'Average', 'Difficult'], default: null },
  },
  { timestamps: { createdAt: 'takenAt', updatedAt: false }, versionKey: false },
);

drillSessionSchema.index({ studentId: 1, subjectId: 1, takenAt: -1 });

export const DrillSessionModel = model('DrillSession', drillSessionSchema);
