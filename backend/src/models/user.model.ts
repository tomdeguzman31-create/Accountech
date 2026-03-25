import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null },
    otpHash: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpPurpose: { type: String, enum: ['verification', 'password-reset', 'login'], default: null },
    role: { type: String, enum: ['ADMIN', 'FACULTY', 'STUDENT'], required: true },
    name: { type: String, default: null },
    studentId: { type: String, default: null, index: true },
    isActivated: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const UserModel = model('User', userSchema);
