import { logger } from "@core/logger/logger";
import { nativePlatform } from "@core/services/mobile/mobile";

/**
 * Downloads a text or a Blob as a file (the browser asks where, or saves it in its folder of downloads). In the
 * applications of Android and iOS, where a WebView does not download, the menu of the system to share it opens
 */
export function download(name: string, content: Blob | string, type = "text/plain"): void {
  if (nativePlatform() !== null) {
    import("@core/services/mobile/native-files")
      .then(({ shareFile }) => shareFile(name, content))
      .catch((error: unknown) => logger.error(error));
    return;
  }
  const blob = typeof content === "string" ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
