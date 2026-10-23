package com.nonodev96.thumder;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

/** THUMDER on Android: the Angular application in the WebView of Capacitor, edge to edge (the page leaves room for the bars) */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // After Capacitor sets the theme without the action bar: before, the window would keep the one of the splash
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
    }
}
