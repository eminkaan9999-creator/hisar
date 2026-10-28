package com.hisar.tetik;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;

/** Paylaşılan raporları (önbellekteki "paylas" klasörü) diğer uygulamalara salt okunur verir. */
public class ShareProvider extends ContentProvider {
    static final String AUTH = "com.hisar.tetik.paylas";

    @Override public boolean onCreate() { return true; }

    File file(Uri u) {
        String n = u.getLastPathSegment();
        if (n == null || n.contains("/") || n.contains("..") || getContext() == null) return null;
        return new File(new File(getContext().getCacheDir(), "paylas"), n);
    }

    @Override
    public ParcelFileDescriptor openFile(Uri u, String mode) throws FileNotFoundException {
        File f = file(u);
        if (f == null || !f.isFile()) throw new FileNotFoundException(String.valueOf(u));
        return ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override
    public String getType(Uri u) {
        String n = u.getLastPathSegment();
        if (n == null) return "application/octet-stream";
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".pdf")) return "application/pdf";
        if (n.endsWith(".csv")) return "text/csv";
        if (n.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }

    @Override
    public Cursor query(Uri u, String[] projection, String selection, String[] args, String sort) {
        File f = file(u);
        if (f == null || !f.isFile()) return null;
        MatrixCursor c = new MatrixCursor(new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE});
        c.addRow(new Object[]{f.getName(), f.length()});
        return c;
    }

    @Override public Uri insert(Uri u, ContentValues v) { return null; }
    @Override public int delete(Uri u, String s, String[] a) { return 0; }
    @Override public int update(Uri u, ContentValues v, String s, String[] a) { return 0; }
}
