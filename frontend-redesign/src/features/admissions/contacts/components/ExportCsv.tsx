import { CsvDownload } from '@/shared/CsvDownload';
export function ExportCsv(props: {path:string;disabled:boolean}) {
  return <CsvDownload {...props} filename="lien_he.csv"/>;
}
