package android.content;
import java.io.File;
public class Context {
  public File filesDir; public android.content.res.AssetManager assets;
  public Context getApplicationContext() { return this; }
  public File getFilesDir() { return filesDir; }
  public android.content.res.AssetManager getAssets() { return assets; }
}
