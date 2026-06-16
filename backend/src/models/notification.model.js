/**
 * Notification model
 * In-app notifications delivered to a user (deployment finished, scan complete,
 * cost alert, etc.).
 */
import mongoose from 'mongoose';
import { createSchema } from './baseSchema.js';
import { NOTIFICATION_TYPE_VALUES, NOTIFICATION_TYPES } from '../config/constants.js';

const { Schema } = mongoose;

const notificationSchema = createSchema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPE_VALUES, default: NOTIFICATION_TYPES.INFO },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, default: '' },
    link: { type: String, default: null }, // deep link in the UI
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { collection: 'notifications' }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

notificationSchema.methods.markRead = function markRead() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
