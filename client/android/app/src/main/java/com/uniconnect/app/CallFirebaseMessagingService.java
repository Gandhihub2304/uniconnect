package com.uniconnect.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.annotation.NonNull;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

// Intercepts data-only "incoming_call" / "call_ended" pushes so a real ringing UI can be
// shown even when the app is fully closed — the default Capacitor push handling only shows
// a normal system-tray notification, which can't launch a full-screen answer/decline screen
// or play a looping ringtone the way a real phone call does.
public class CallFirebaseMessagingService extends FirebaseMessagingService {

    private static final String CALL_CHANNEL_ID = "incoming_calls";
    private static final int CALL_NOTIFICATION_ID = 9001;

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Map<String, String> data = remoteMessage.getData();
        String type = data.get("type");

        if ("incoming_call".equals(type)) {
            showIncomingCallNotification(
                data.get("fromId"),
                data.get("fromName"),
                data.get("callType")
            );
        } else if ("call_ended".equals(type)) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(CALL_NOTIFICATION_ID);
            Intent cancelIntent = new Intent(this, IncomingCallActivity.class);
            cancelIntent.setAction(IncomingCallActivity.ACTION_CALL_CANCELLED);
            cancelIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(cancelIntent);
        }
    }

    private void showIncomingCallNotification(String fromId, String fromName, String callType) {
        createCallChannelIfNeeded();

        Intent fullScreenIntent = new Intent(this, IncomingCallActivity.class);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        fullScreenIntent.putExtra("fromId", fromId);
        fullScreenIntent.putExtra("fromName", fromName);
        fullScreenIntent.putExtra("callType", callType);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(this, CALL_NOTIFICATION_ID, fullScreenIntent, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CALL_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.sym_call_incoming)
            .setContentTitle(fromName != null ? fromName : "Incoming call")
            .setContentText("video".equals(callType) ? "Incoming video call" : "Incoming voice call")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent)
            .setAutoCancel(true)
            .setOngoing(true);

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(CALL_NOTIFICATION_ID, builder.build());

        // Also launch directly — on many OEM skins a full-screen intent notification alone
        // is not enough to reliably wake and foreground the activity while locked/closed.
        startActivity(fullScreenIntent);
    }

    private void createCallChannelIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(CALL_CHANNEL_ID) != null) return;

        Uri ringtoneUri = android.provider.Settings.System.DEFAULT_RINGTONE_URI;
        AudioAttributes audioAttrs = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();

        NotificationChannel channel = new NotificationChannel(
            CALL_CHANNEL_ID,
            "Incoming Calls",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Rings for incoming voice and video calls");
        channel.setSound(ringtoneUri, audioAttrs);
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 1000, 1000, 1000, 1000, 1000});
        channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(channel);
    }
}
