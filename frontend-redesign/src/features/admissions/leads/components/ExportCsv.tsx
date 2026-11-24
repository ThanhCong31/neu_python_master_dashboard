import { CsvDownload } from '@/shared/CsvDownload';
export function ExportCsv(props: {path:string;disabled:boolean}) {
  return <CsvDownload {...props} filename="lead_talkshow_fb.csv" confirmMessage="CSV có thể chứa thông tin cá nhân và nội dung tự do. Chỉ lưu và mở trong môi trường tin cậy. Tiếp tục xuất?"/>;
}
