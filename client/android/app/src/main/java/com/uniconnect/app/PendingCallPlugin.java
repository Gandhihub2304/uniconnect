package com.uniconnect.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Tiny bridge so the JS layer can ask "was this launch triggered by tapping Accept on the
// native incoming-call screen?" — MainActivity stashes the answer in SharedPreferences on
// launch (since a killed app has no live JS context to hand intent extras to directly), and
// this plugin reads + clears it once on boot.
@CapacitorPlugin(name = "PendingCall")
public class PendingCallPlugin extends Plugin {

    static final String PREFS_NAME = "uniconnect_pending_call";

    @PluginMethod
    public void consume(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean pending = prefs.getBoolean("pending", false);

        JSObject result = new JSObject();
        result.put("pending", pending);
        if (pending) {
            result.put("fromId", prefs.getString("fromId", null));
            result.put("fromName", prefs.getString("fromName", null));
            result.put("callType", prefs.getString("callType", "voice"));
            prefs.edit().clear().apply();
        }
        call.resolve(result);
    }
}
