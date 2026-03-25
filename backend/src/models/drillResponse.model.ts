import { Schema, Types, model } from 'mongoose';

const drillResponseSchema = new Schema(
  {
    studentId: { type: String, required: true, index: true },
    questionId: { type: Types.ObjectId, ref: 'Question', required: true, index: true },
    selectedAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { timestamps: { createdAt: 'answeredAt', updatedAt: false }, versionKey: false },
);

export const DrillResponseModel = model('DrillResponse', drillResponseSchema);
