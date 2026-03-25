import { Schema, model } from 'mongoose';

const historicalBoardDataSchema = new Schema(
  {
    year: { type: Number, required: true, unique: true },
    passingRate: { type: Number, required: true },
    cohortSize: { type: Number, required: true },
  },
  { timestamps: true, versionKey: false },
);

export const HistoricalBoardDataModel = model('HistoricalBoardData', historicalBoardDataSchema);
