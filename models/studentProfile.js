const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentProfileSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  fullName: {
    type: String,
    trim: true,
    required: true,
  },
  profilePhoto: {
    url: String,
    filename: String,
  },
  studentType: {
    type: String,
    enum: ['School Student', 'College Student'],
    required: true,
  },
  schoolName: String,
  currentClass: String,
  board: String,
  collegeName: String,
  currentYear: String,
  branch: String,
  currentSemester: String,
  streamDegree: String,
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    sessionReminders: { type: Boolean, default: true },
    promotionalNotifications: { type: Boolean, default: false },
  },
  walletBalance: { type: Number, default: 0 },
  bookingSummary: {
    upcomingSessions: { type: Number, default: 0 },
    completedSessions: { type: Number, default: 0 },
    cancelledSessions: { type: Number, default: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { strict: false });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
