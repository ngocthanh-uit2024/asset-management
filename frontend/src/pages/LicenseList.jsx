import React, { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function LicenseList(){
  const [items,setItems]=useState([]),[equipments,setEquipments]=useState([]);
  const [form,setForm]=useState({equipment:'',softwareName:'',category:'',version:'',licenseType:'OEM',vendor:'',purchaseDate:'',expireDate:'',quantity:1,status:'active',note:''});
  async function load(){const [l,e]=await Promise.all([api.get('/licenses'),api.get('/equipments')]);setItems(l.data);setEquipments(e.data);}
  useEffect(()=>{load();},[]);
  async function submit(e){e.preventDefault();await api.post('/licenses',form);setForm({equipment:'',softwareName:'',category:'',version:'',licenseType:'OEM',vendor:'',purchaseDate:'',expireDate:'',quantity:1,status:'active',note:''});load();}
  return <section><div className="page-heading"><div><h1>Software License</h1><p>Quản lý Windows, Office, Zoom và các phần mềm có bản quyền</p></div></div>
    <div className="panel"><h3>Thêm license</h3><form className="grid-form" onSubmit={submit}>
      <select value={form.equipment} onChange={e=>setForm({...form,equipment:e.target.value})}><option value="">Chọn thiết bị</option>{equipments.map(x=><option key={x._id} value={x._id}>{x.assetCode} - {x.assetName}</option>)}</select>
      <input placeholder="Tên phần mềm" value={form.softwareName} onChange={e=>setForm({...form,softwareName:e.target.value})} required/><input placeholder="Nhóm phần mềm" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/><input placeholder="Phiên bản" value={form.version} onChange={e=>setForm({...form,version:e.target.value})}/>
      <select value={form.licenseType} onChange={e=>setForm({...form,licenseType:e.target.value})}><option>OEM</option><option>Retail</option><option>Volume</option><option>Subscription</option><option>Trial</option></select>
      <input placeholder="Nhà cung cấp" value={form.vendor} onChange={e=>setForm({...form,vendor:e.target.value})}/><label>Ngày mua<input type="date" value={form.purchaseDate} onChange={e=>setForm({...form,purchaseDate:e.target.value})}/></label><label>Ngày hết hạn<input type="date" value={form.expireDate} onChange={e=>setForm({...form,expireDate:e.target.value})}/></label><button>Thêm license</button>
    </form></div>
    <div className="table-wrap"><table><thead><tr><th>Mã</th><th>Phần mềm</th><th>Thiết bị</th><th>Loại</th><th>Hết hạn</th><th>Trạng thái</th></tr></thead><tbody>{items.map(i=><tr key={i._id}><td>{i.licenseCode}</td><td>{i.softwareName} {i.version}</td><td>{i.equipment?.assetCode||'-'}</td><td>{i.licenseType}</td><td>{i.expireDate?.slice(0,10)||'Không thời hạn'}</td><td><span className="status">{i.status}</span></td></tr>)}</tbody></table></div>
  </section>;
}
