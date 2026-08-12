import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';
import { FIREBASE_SERVICE_ACCOUNT_JSON } from './env';

let initialized = false;

export const initFirebase = () => {
  if (initialized || getApps().length > 0) return;

  try {
    let serviceAccount: ServiceAccount;

    if (FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
      const localKeyPath = path.join(__dirname, '../../firebase-admin-key.json');
      if (!fs.existsSync(localKeyPath)) {
        console.warn('⚠️  Firebase Admin not configured — push notifications disabled.');
        return;
      }
      serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf-8'));
    }

    initializeApp({ credential: cert(serviceAccount) });
    initialized = true;
    console.log('✅ Firebase Admin initialized — push notifications enabled');
  } catch (error: any) {
    console.error('❌ Firebase Admin init failed:', error.message || error);
  }
};

export const sendPushNotification = async (
  tokens: string[],
  notification: { title: string; body: string },
  data?: Record<string, string>
) => {
  if (!initialized || tokens.length === 0) return;

  try {
    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification,
      data,
      android: { priority: 'high' },
    });

    // Prune tokens Firebase reports as invalid/unregistered so we stop retrying them
    const staleTokens: string[] = [];
    response.responses.forEach((r, idx) => {
      if (!r.success && r.error && r.error.code === 'messaging/registration-token-not-registered') {
        staleTokens.push(tokens[idx]);
      }
    });
    return { successCount: response.successCount, staleTokens };
  } catch (error: any) {
    console.error('Failed to send push notification:', error.message || error);
  }
};
