package ir.chakachak.game;

import android.util.Log;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import ir.cafebazaar.poolakey.Connection;
import ir.cafebazaar.poolakey.Payment;
import ir.cafebazaar.poolakey.config.PaymentConfiguration;
import ir.cafebazaar.poolakey.config.SecurityCheck;
import ir.cafebazaar.poolakey.entity.PurchaseInfo;
import ir.cafebazaar.poolakey.request.PurchaseRequest;
import kotlin.Unit;

/**
 * Cafe Bazaar in-app billing (Poolakey) for gem packs, used from src/net/store.ts.
 * Flow: buy → the web code sends the purchase token to our server → the server verifies it with
 * Bazaar and grants the gems → only then consume. Unconsumed purchases are listed by `pending`
 * and re-sent on the next launch (the server grants each token once).
 * The buttons are shown even when the app was installed by hand, as long as Bazaar is on the
 * phone: store reviewers install the APK directly (lesson from the Vazir app's review).
 */
@CapacitorPlugin(name = "Store")
public class StorePlugin extends Plugin {

    private static final String TAG = "Chakachak";
    private Payment payment;
    private Connection connection;
    private boolean connected;

    @Override
    public void load() {
        String key = BuildConfig.BAZAAR_RSA_KEY;
        SecurityCheck check = key.isEmpty() ? SecurityCheck.Disable.INSTANCE : new SecurityCheck.Enable(key);
        payment = new Payment(getContext(), new PaymentConfiguration(check));
    }

    @Override
    protected void handleOnDestroy() {
        if (connection != null) connection.disconnect();
        connected = false;
    }

    @PluginMethod
    public void info(PluginCall call) {
        JSObject r = new JSObject();
        r.put("store", "bazaar");
        r.put("billing", true);
        call.resolve(r);
    }

    @PluginMethod
    public void buy(PluginCall call) {
        String product = call.getString("product");
        if (product == null || !product.startsWith("gems_")) {
            call.reject("badProduct");
            return;
        }
        connect(call, () -> payment.purchaseProduct(getActivity().getActivityResultRegistry(),
                new PurchaseRequest(product, null, null), cb -> {
                    cb.purchaseSucceed(info -> {
                        call.resolve(toJs(info));
                        return Unit.INSTANCE;
                    });
                    cb.purchaseCanceled(() -> {
                        call.reject("canceled");
                        return Unit.INSTANCE;
                    });
                    cb.purchaseFailed(e -> {
                        Log.w(TAG, "bazaar purchase", e);
                        call.reject("failed");
                        return Unit.INSTANCE;
                    });
                    cb.failedToBeginFlow(e -> {
                        Log.w(TAG, "bazaar flow", e);
                        call.reject("failed");
                        return Unit.INSTANCE;
                    });
                    return Unit.INSTANCE;
                }));
    }

    @PluginMethod
    public void pending(PluginCall call) {
        connect(call, () -> payment.getPurchasedProducts(cb -> {
            cb.querySucceed(list -> {
                JSArray items = new JSArray();
                for (PurchaseInfo p : list) if (p.getProductId().startsWith("gems_")) items.put(toJs(p));
                JSObject r = new JSObject();
                r.put("items", items);
                call.resolve(r);
                return Unit.INSTANCE;
            });
            cb.queryFailed(e -> {
                Log.w(TAG, "bazaar query", e);
                call.reject("failed");
                return Unit.INSTANCE;
            });
            return Unit.INSTANCE;
        }));
    }

    @PluginMethod
    public void consume(PluginCall call) {
        String token = call.getString("token");
        if (token == null) {
            call.reject("badToken");
            return;
        }
        connect(call, () -> payment.consumeProduct(token, cb -> {
            cb.consumeSucceed(() -> {
                call.resolve();
                return Unit.INSTANCE;
            });
            cb.consumeFailed(e -> {
                Log.w(TAG, "bazaar consume", e);
                call.reject("failed");
                return Unit.INSTANCE;
            });
            return Unit.INSTANCE;
        }));
    }

    private static JSObject toJs(PurchaseInfo p) {
        JSObject o = new JSObject();
        o.put("product", p.getProductId());
        o.put("token", p.getPurchaseToken());
        // Signed purchase data: the server checks Bazaar's signature with the app's RSA key.
        o.put("json", p.getOriginalJson());
        o.put("sig", p.getDataSignature());
        return o;
    }

    /** Run `then` once connected to the Bazaar app; reject when Bazaar is missing or refuses. */
    private void connect(PluginCall call, Runnable then) {
        if (connected) {
            then.run();
            return;
        }
        connection = payment.connect(cb -> {
            cb.connectionSucceed(() -> {
                connected = true;
                then.run();
                return Unit.INSTANCE;
            });
            cb.connectionFailed(e -> {
                Log.w(TAG, "bazaar connect", e);
                connected = false;
                call.reject("noBazaar");
                return Unit.INSTANCE;
            });
            cb.disconnected(() -> {
                connected = false;
                return Unit.INSTANCE;
            });
            return Unit.INSTANCE;
        });
    }
}
