package ir.chakachak.game;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Myket billing is not connected yet: the gem shop shows "soon" in this build. */
@CapacitorPlugin(name = "Store")
public class StorePlugin extends Plugin {

    @PluginMethod
    public void info(PluginCall call) {
        JSObject r = new JSObject();
        r.put("store", "myket");
        r.put("billing", false);
        call.resolve(r);
    }

    @PluginMethod
    public void buy(PluginCall call) {
        call.reject("unavailable");
    }

    @PluginMethod
    public void pending(PluginCall call) {
        JSObject r = new JSObject();
        r.put("items", new com.getcapacitor.JSArray());
        call.resolve(r);
    }

    @PluginMethod
    public void consume(PluginCall call) {
        call.resolve();
    }
}
