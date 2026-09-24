import { addDoc, collection, onSnapshot, query, serverTimestamp, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Notification } from '@/types';

type NotificationRole = 'student' | 'lecturer';
type StoredNotification = Notification & {
  recipientId: string;
  recipientRole: NotificationRole;
  courseId?: string;
  audience?: 'students';
  targetStudentIds?: string[];
  lecturerId?: string;
};

export function buildCourseNotificationTargets(courseId: string, enrollments: Array<{ studentId: string; courseId?: string }>) {
  return enrollments.filter((enrollment) => enrollment.courseId === courseId).map((enrollment) => enrollment.studentId);
}

export async function createUserNotification(
  recipientId: string,
  recipientRole: NotificationRole,
  title: string,
  message: string,
  actionUrl = '/dashboard',
  courseId?: string,
  type: Notification['type'] = 'info',
) {
  await addDoc(collection(db, 'notifications'), {
    recipientId,
    recipientRole,
    title,
    message,
    actionUrl,
    courseId: courseId || null,
    type,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function createStudentAnnouncement(
  lecturerId: string,
  title: string,
  message: string,
  actionUrl = '/dashboard',
  courseId?: string,
  targetStudentIds: string[] = [],
) {
  await Promise.all(targetStudentIds.map((studentId) => addDoc(collection(db, 'notifications'), {
    recipientId: studentId,
    recipientRole: 'student',
    lecturerId,
    title,
    message,
    actionUrl,
    courseId: courseId || null,
    type: 'info',
    read: false,
    createdAt: serverTimestamp(),
  })));
}

export function subscribeUserNotifications(
  userId: string,
  onChange: (notifications: Notification[]) => void,
  onError?: (error: Error) => void,
) {
  const notificationsQuery = query(collection(db, 'notifications'), where('recipientId', '==', userId));
  return onSnapshot(notificationsQuery, (snapshot) => {
    const notifications = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<StoredNotification, 'id'>) } as Notification));
    notifications.sort((left, right) => {
      const toMillis = (value: any) => value?.toMillis?.() || (value ? new Date(value).getTime() : 0);
      return toMillis(right.createdAt) - toMillis(left.createdAt);
    });
    onChange(notifications);
  }, onError);
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsRead(userId: string, notifications: Notification[]) {
  await Promise.all(notifications.filter((notification) => !notification.read).map((notification) => markNotificationRead(notification.id)));
}

// Kept as a compatibility alias for existing callers.
export const subscribeStudentAnnouncements = subscribeUserNotifications;
export const markStudentNotificationRead = (studentId: string, notificationId: string) => markNotificationRead(notificationId);
