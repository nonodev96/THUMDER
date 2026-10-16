/** Downloads a text or a Blob as a file (the browser asks where, or saves it in its folder of downloads) */
export function download(name: string, content: Blob | string, type = "text/plain"): void {
  const blob = typeof content === "string" ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
