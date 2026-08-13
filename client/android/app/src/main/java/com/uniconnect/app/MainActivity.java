package com.uniconnect.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PendingCallPlugin.class);
        super.onCreate(savedInstanceState);
        stashPendingCallAccept(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        stashPendingCallAccept(intent);
    }

    // Persists the "accept this call" signal from IncomingCallActivity so the JS layer can
    // pick it up via the PendingCall plugin once the WebView finishes booting — a killed app
    // has no running JS to hand intent extras to directly at the moment this fires.
    private void stashPendingCallAccept(Intent intent) {
        if (intent == null || !intent.getBooleanExtra("pending_call_accept", false)) return;

        SharedPreferences prefs = getSharedPreferences(PendingCallPlugin.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putBoolean("pending", true)
            .putString("fromId", intent.getStringExtra("fromId"))
            .putString("fromName", intent.getStringExtra("fromName"))
            .putString("callType", intent.getStringExtra("callType"))
            .apply();
    }
}
