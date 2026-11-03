package android.content.res;
import java.io.*;
public class AssetManager {
  public File root; public AssetManager(File r) { root = r; }
  public InputStream open(String name) throws IOException { File f = new File(root, name); if (!f.isFile()) throw new FileNotFoundException(name); return new FileInputStream(f); }
}
