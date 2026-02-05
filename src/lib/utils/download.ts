/**
 * Utility function to trigger a browser download for a Blob.
 *
 * Creates a temporary anchor element, sets the download attribute,
 * and programmatically clicks it to initiate the download.
 *
 * @param blob - The Blob object to download
 * @param filename - The filename for the downloaded file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
