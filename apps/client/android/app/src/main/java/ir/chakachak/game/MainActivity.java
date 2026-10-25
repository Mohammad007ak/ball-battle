package ir.chakachak.game;

import android.content.Context;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import java.io.PrintWriter;
import java.io.StringWriter;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        installCrashRecorder(getApplicationContext());
        registerPlugin(StorePlugin.class);
        super.onCreate(savedInstanceState);
    }

    /**
     * A native crash cannot be sent while the process dies, so it is saved where the
     * Capacitor Preferences plugin reads ("CapacitorStorage") and the web code reports it to our
     * own server on the next launch (see src/telemetry.ts).
     */
    private static void installCrashRecorder(Context ctx) {
        final Thread.UncaughtExceptionHandler prev = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, e) -> {
            try {
                StringWriter sw = new StringWriter();
                e.printStackTrace(new PrintWriter(sw));
                String text = e + " [" + BuildConfig.STORE + " " + BuildConfig.VERSION_NAME + "]\n" + sw;
                ctx.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
                    .edit()
                    .putString("nativeCrash", text.length() > 4000 ? text.substring(0, 4000) : text)
                    .commit();
            } catch (Throwable t) {
                Log.e("Chakachak", "crash recorder failed", t);
            }
            if (prev != null) prev.uncaughtException(thread, e);
        });
    }
}
