import { Signature } from './Signature';

export interface PdfFile {
  name: string;
  data: string | ArrayBuffer | null;
  signatures: Signature[];
  thumbnails: string[];
}
