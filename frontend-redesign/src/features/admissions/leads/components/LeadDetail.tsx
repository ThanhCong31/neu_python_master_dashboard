import { StatusLabel } from '@/shared/StatusLabel';
import {Button} from '@/components/expressive/button';
import {dateText} from '@/shared/format';
import {resultLabel,textValue,type LeadRow} from '../model';
import {Dialog} from './Dialog';
export function Result({value}:{value?:string|null}){return <StatusLabel tone={value==='Lead mới'?'primary':value==='Đã có trong Data'?'secondary':'neutral'}>{resultLabel(value)}</StatusLabel>;}
function Fields({title,items}:{title:string;items:[string,unknown][]}){return <section className="ld-detail-section"><h3>{title}</h3><dl>{items.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{textValue(v)}</dd></div>)}</dl></section>;}
export function LeadDetail({row:r,canViewPii,onClose}:{row:LeadRow;canViewPii:boolean;onClose:()=>void}){return <Dialog title="Chi tiết dòng lead" onClose={onClose} footer={<Button motion="standard" onClick={onClose}>Đóng</Button>}>
<div className="ld-detail-hero"><h3>{r.full_name||'Chưa có họ tên'}</h3><p>Mã liên kết: {textValue(r.contact_id)}</p><Result value={r.result}/></div>
<Fields title="Biểu mẫu & đối soát" items={ [['Nguồn',r.source],['Dòng gốc',r.row_no],['Ngày gửi',r.created_at?dateText(r.created_at):null],['Nhóm CRM',r.segment],['Người phụ trách',r.pic]] }/>
<Fields title="Thông tin liên hệ" items={ [['Email',r.email],['Điện thoại',r.phone],['Bảng quan tâm',r.board_interest],['Tỉnh/thành',r.province],['Miền',r.region]] }/>
<Fields title="Nguồn và nhu cầu" items={ [['Chiến dịch',r.campaign],['Nền tảng',r.platform],['Biết Talkshow qua',r.heard_from],['Muốn nhận lịch Talkshow',r.wants_talkshow===true?'Có ghi nhận':r.wants_talkshow===false?'Không ghi nhận':'Chưa có dữ liệu'],['Tự khai đăng ký (chưa xác minh)',r.self_declared]] }/>
{canViewPii&&<Fields title="Nội dung tự do" items={ [['Câu hỏi',r.question],['Ghi chú',r.note]] }/>}
<p className="ld-note">Dữ liệu từ biểu mẫu đã đối soát, không phải trạng thái đăng ký hoặc thanh toán hiện tại của CRM.</p>
</Dialog>;}
