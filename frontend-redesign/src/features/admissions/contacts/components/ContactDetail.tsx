import { StatusLabel } from '@/shared/StatusLabel';
import {dateText,moneyText} from '@/shared/format';
import {Button} from '@/components/expressive/button';
import {textValue,type ContactRow} from '../model';
import {Dialog} from './Dialog';
export function Payment({status}:{status?:string|null}) {
  const tone=status==='Đã thanh toán'?'primary':status==='Miễn phí'?'tertiary':status==='Chưa thanh toán'?'secondary':'neutral';
  return <StatusLabel tone={tone}>{status||'Chưa xác định'}</StatusLabel>;
}
export function ContactDetail({row,canViewPii,onClose}:{row:ContactRow;canViewPii:boolean;onClose:()=>void}) {
  const sections:{title:string;fields:[string,unknown][]}[]=[
    {title:'Danh tính & liên hệ',fields:[['Mã hồ sơ',row.contact_id],['Họ tên',row.full_name],['Email',row.email],['Điện thoại',row.phone],...(canViewPii? [['Ngày sinh',row.dob?dateText(row.dob):null],['CCCD',row.cccd]] as [string,unknown][]:[])]},
    {title:'Đăng ký & tài chính',fields:[['Bảng thi',row.board],['Tỉnh/thành',row.province],['Miền',row.region],['Điểm thi',row.exam_venue],['Trạng thái thanh toán',row.payment_status],['Lệ phí',moneyText(row.fee)],['Doanh thu ghi nhận',moneyText(row.revenue)],['Ngày tiếp xúc đầu tiên',row.first_touch?dateText(row.first_touch):null],['Ngày đăng ký web',row.web_registered_at?dateText(row.web_registered_at):null]]},
    {title:'Nguồn & chăm sóc',fields:[['Kênh ghi nhận',row.channel],['Phân bổ giả định',row.channel_is_assumed===true?'Có':row.channel_is_assumed===false?'Không':null],['Nguồn dữ liệu',row.sources],['Nhóm CRM',row.segment],['Drip',row.drip],['Người phụ trách',row.pic],['UTM đối tác',row.utm_partners],['Mã ưu đãi',row.promo_codes]]},
    {title:'Chất lượng dữ liệu',fields:[['Cờ kiểm tra',Array.isArray(row.flags)?row.flags.length?row.flags:'Không có cờ ghi nhận':null],...(canViewPii?[['Ghi chú',row.notes],['Câu hỏi',row.question]] as [string,unknown][]:[])]}
  ];
  return <Dialog title="Chi tiết hồ sơ" onClose={onClose} footer={<><span className="ct-note">Chỉ đọc</span><span className="ct-spacer"/><Button motion="standard" onClick={onClose}>Đóng</Button></>}><div className="ct-detail-hero"><h3>{row.full_name||'Chưa có họ tên'}</h3><p>{row.contact_id}</p><Payment status={row.payment_status}/></div>{!canViewPii&&<p className="ct-note">Thông tin liên hệ được giới hạn theo quyền tài khoản.</p>}{sections.map(s=><section className="ct-detail-section" key={s.title}><h3>{s.title}</h3><dl>{s.fields.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{textValue(value)}</dd></div>)}</dl></section>)}</Dialog>;
}
