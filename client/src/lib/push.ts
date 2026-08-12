import { Capacitor } from '@capacitor/core';
import { PushNotifications, ActionPerformed } from '@capacitor/push-notifications';
import { apiPost } from './api';
import { useAppStore } from '@/store/useAppStore';

let registeredToken: string | null = null;

// Requests permission and registers this device for push notifications.
// Only runs on native Android/iOS builds — no-ops on the web (Capacitor.isNativePlatform() is false there).
export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== 'granted') return;

    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      registeredToken = token.value;
      try {
        await apiPost('/api/auth/push-token', { token: token.value });
      } catch (err) {
        console.error('Failed to register push token:', err);
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err);
    });

    // Tapping a notification (app backgrounded/closed) should jump straight to Messages
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      const data = action.notification.data;
      if (data?.type === 'new_message') {
        useAppStore.getState().setActiveTab('chats');
      }
    });
  } catch (err) {
    console.error('Failed to init push notifications:', err);
  }
}

// Best-effort: unregister this device's token so logging out on one account
// stops it from receiving another account's notifications on shared devices.
export async function clearPushToken() {
  if (!registeredToken) return;
  try {
    await apiPost('/api/auth/push-token/remove', { token: registeredToken });
  } catch (err) {
    console.error('Failed to remove push token:', err);
  } finally {
    registeredToken = null;
  }
}
