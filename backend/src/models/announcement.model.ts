import { Schema, model, type InferSchemaType } from 'mongoose';

const announcementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorEmail: { type: String, required: true },
    authorRole: { type: String, enum: ['ADMIN', 'FACULTY'], required: true },
    targetRoles: {
      type: [String],
      enum: ['ADMIN', 'FACULTY', 'STUDENT'],
      default: ['ADMIN', 'FACULTY', 'STUDENT'],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

export type AnnouncementDocument = InferSchemaType<typeof announcementSchema>;
export const AnnouncementModel = model('Announcement', announcementSchema);
