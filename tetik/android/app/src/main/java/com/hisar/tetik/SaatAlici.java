package com.hisar.tetik;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Akıllı saat: bildirimdeki Başla / Dur düğmesi (saatte de görünür) açık uygulamaya iletilir. */
public class SaatAlici extends BroadcastReceiver {
    static final String EYLEM = "com.hisar.tetik.SAAT";

    @Override
    public void onReceive(Context c, Intent i) {
        if (i == null || !EYLEM.equals(i.getAction())) return;
        String k = i.getStringExtra("komut");
        MainActivity a = MainActivity.son.get();
        if (a != null && ("basla".equals(k) || "dur".equals(k))) a.saatKomut(k);
    }
}
