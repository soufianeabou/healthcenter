import { CertificateDownload } from '../types/certificate';

/** Fetches one certificate file and saves it under its display name. Throws on failure. */
export const downloadCertificateFile = async (api: string, file: CertificateDownload) => {
  const res = await fetch(`${api}/${file.path}`);
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.fileName || 'certificate';
  a.click();
  URL.revokeObjectURL(url);
};
