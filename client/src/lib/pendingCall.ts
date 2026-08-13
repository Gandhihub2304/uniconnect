import { Capacitor, registerPlugin } from '@capacitor/core';

interface PendingCallResult {
  pending: boolean;
  fromId?: string;
  fromName?: string;
  callType?: 'voice' | 'video';
}

interface PendingCallPlugin {
  consume(): Promise<PendingCallResult>;
}

const PendingCall = registerPlugin<PendingCallPlugin>('PendingCall');

// Checks whether this launch was triggered by tapping Accept on the native full-screen
// incoming-call notification (app was closed when the call arrived). Safe to call on web/
// non-native builds — resolves to not-pending there since the plugin is never registered.
export async function consumePendingCallAccept(): Promise<PendingCallResult> {
  if (!Capacitor.isNativePlatform()) return { pending: false };
  try {
    return await PendingCall.consume();
  } catch (err) {
    console.error('Failed to read pending call accept state:', err);
    return { pending: false };
  }
}
