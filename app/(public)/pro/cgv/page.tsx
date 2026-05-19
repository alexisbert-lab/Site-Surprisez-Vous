import { permanentRedirect } from 'next/navigation';

const CGV_PDF_URL = 'https://www.surprisez-vous.fr/FICHIERS/document/cgv-2024.pdf?1774453193';

export default function CGVPage() {
  permanentRedirect(CGV_PDF_URL);
}
