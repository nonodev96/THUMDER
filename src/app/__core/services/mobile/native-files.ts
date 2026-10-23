// Saving a file in the applications of Android and iOS: a WebView does not download, so the file is written in the
// cache of the application and the menu of the system to share it opens (save it in Files or Drive, send it...)
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/** The data of a Blob in base64, as Filesystem writes binary files */
export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/** A name that is only a name: no folders, nothing the file system does not take */
export function safeFileName(name: string): string {
  const clean = [...name].map((char) => (char.charCodeAt(0) < 32 || '\\/:*?"<>|'.includes(char) ? "_" : char)).join("");
  return clean.replace(/^\.+/, "_").slice(0, 120) || "thumder";
}

/** Writes the file and offers it with the menu of the system. Cancelling the menu is not an error */
export async function shareFile(name: string, content: Blob | string): Promise<void> {
  const path = `exports/${safeFileName(name)}`;
  const { uri } = await Filesystem.writeFile(
    typeof content === "string"
      ? { path, data: content, directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true }
      : { path, data: await blobToBase64(content), directory: Directory.Cache, recursive: true },
  );
  try {
    await Share.share({ title: name, files: [uri] });
  } catch (error) {
    if (!/cancel/i.test(String((error as Error)?.message ?? error))) throw error;
  }
}
