import mongoose, { Schema, Document } from 'mongoose';

export interface IEventDocument extends Document {
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  attendeesCount: number;
  attendees: string[];
  image: string;
  expenses: { title: string; amount: number; paidBy: string }[];
  createdBy?: string;
  createdAt: Date;
}

const EventSchema = new Schema<IEventDocument>(
  {
    title: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    category: { type: String, default: 'General' },
    attendeesCount: { type: Number, default: 0 },
    attendees: { type: [String], default: [] },
    image: { type: String, required: true },
    expenses: {
      type: [{ title: String, amount: Number, paidBy: String }],
      default: [],
    },
    createdBy: { type: String },
  },
  { timestamps: true }
);

export const EventModel = mongoose.models.Event || mongoose.model<IEventDocument>('Event', EventSchema);
