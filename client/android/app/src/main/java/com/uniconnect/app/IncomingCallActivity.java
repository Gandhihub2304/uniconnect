package com.uniconnect.app;

import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

// Full-screen ringing UI shown over the lock screen when a call-type push arrives while
// the app is closed/backgrounded. Built with plain Android views (no layout XML) to keep
// this self-contained. Accept relaunches MainActivity with extras the JS layer reads on
// startup to jump straight into WebRTCCallModal's accept flow; Decline just stops ringing.
public class IncomingCallActivity extends AppCompatActivity {

    public static final String ACTION_CALL_CANCELLED = "com.uniconnect.app.CALL_CANCELLED";
    private static final int CALL_NOTIFICATION_ID = 9001;

    private Ringtone ringtone;
    private Vibrator vibrator;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (ACTION_CALL_CANCELLED.equals(getIntent().getAction())) {
            finish();
            return;
        }

        setShowWhenLockedAndTurnScreenOn();

        String fromName = getIntent().getStringExtra("fromName");
        String fromId = getIntent().getStringExtra("fromId");
        String callType = getIntent().getStringExtra("callType");

        setContentView(buildLayout(fromName, callType, fromId));
        startRinging();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (ACTION_CALL_CANCELLED.equals(intent.getAction())) {
            stopRinging();
            finish();
        }
    }

    private void setShowWhenLockedAndTurnScreenOn() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                    | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }
    }

    private LinearLayout buildLayout(String fromName, String callType, String fromId) {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#0F172A"));
        root.setGravity(Gravity.CENTER);
        root.setPadding(64, 64, 64, 64);

        TextView title = new TextView(this);
        title.setText(fromName != null ? fromName : "Unknown");
        title.setTextColor(Color.WHITE);
        title.setTextSize(28);
        title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        titleParams.bottomMargin = 24;
        root.addView(title, titleParams);

        TextView subtitle = new TextView(this);
        subtitle.setText("video".equals(callType) ? "Incoming video call" : "Incoming voice call");
        subtitle.setTextColor(Color.parseColor("#0095F6"));
        subtitle.setTextSize(16);
        subtitle.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams subtitleParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        subtitleParams.bottomMargin = 96;
        root.addView(subtitle, subtitleParams);

        LinearLayout buttonRow = new LinearLayout(this);
        buttonRow.setOrientation(LinearLayout.HORIZONTAL);
        buttonRow.setGravity(Gravity.CENTER);

        Button declineBtn = new Button(this);
        declineBtn.setText("Decline");
        declineBtn.setBackgroundColor(Color.parseColor("#E11D48"));
        declineBtn.setTextColor(Color.WHITE);
        declineBtn.setOnClickListener(v -> {
            stopRinging();
            dismissNotification();
            finish();
        });
        LinearLayout.LayoutParams declineParams = new LinearLayout.LayoutParams(
            0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        declineParams.rightMargin = 24;
        buttonRow.addView(declineBtn, declineParams);

        Button acceptBtn = new Button(this);
        acceptBtn.setText("Accept");
        acceptBtn.setBackgroundColor(Color.parseColor("#0095F6"));
        acceptBtn.setTextColor(Color.WHITE);
        acceptBtn.setOnClickListener(v -> {
            stopRinging();
            dismissNotification();
            launchAppToAcceptCall(fromId, fromName, callType);
            finish();
        });
        LinearLayout.LayoutParams acceptParams = new LinearLayout.LayoutParams(
            0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        buttonRow.addView(acceptBtn, acceptParams);

        root.addView(buttonRow);
        return root;
    }

    private void launchAppToAcceptCall(String fromId, String fromName, String callType) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("pending_call_accept", true);
        intent.putExtra("fromId", fromId);
        intent.putExtra("fromName", fromName);
        intent.putExtra("callType", callType);
        startActivity(intent);
    }

    private void dismissNotification() {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(CALL_NOTIFICATION_ID);
    }

    private void startRinging() {
        try {
            Uri ringtoneUri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_RINGTONE);
            ringtone = RingtoneManager.getRingtone(this, ringtoneUri);
            if (ringtone != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    AudioAttributes attrs = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                    ringtone.setAudioAttributes(attrs);
                }
                ringtone.play();
            }
        } catch (Exception ignored) {}

        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null) {
            long[] pattern = {0, 1000, 1000};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
            } else {
                vibrator.vibrate(pattern, 0);
            }
        }
    }

    private void stopRinging() {
        if (ringtone != null && ringtone.isPlaying()) ringtone.stop();
        if (vibrator != null) vibrator.cancel();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopRinging();
    }
}
