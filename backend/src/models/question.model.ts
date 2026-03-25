import { Schema, Types, model } from 'mongoose';

const questionSchema = new Schema(
  {
    subjectId: { type: Types.ObjectId, ref: 'Subject', required: true, index: true },
    topic: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['Easy', 'Average', 'Difficult'], default: 'Average' },
    content: { type: String, required: true },
    options: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true },
    },
    correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    referenceText: { type: String, default: null },
    createdBy: { type: Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

questionSchema.index({ subjectId: 1, difficulty: 1 });

export const QuestionModel = model('Question', questionSchema);
