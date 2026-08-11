import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Company from '../models/Company.js';
import Location from '../models/Location.js';
import Department from '../models/Department.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Equipment from '../models/Equipment.js';
import Assignment from '../models/Assignment.js';
import Maintenance from '../models/Maintenance.js';
import SoftwareLicense from '../models/SoftwareLicense.js';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

await Promise.all([
  SoftwareLicense.deleteMany(), Maintenance.deleteMany(), Assignment.deleteMany(), Equipment.deleteMany(),
  User.deleteMany(), Department.deleteMany(), Location.deleteMany(), Category.deleteMany(), Company.deleteMany()
]);

const companies = await Company.insertMany([
  { companyCode: 'TGC', companyName: 'Togico Company Limited', shortName: 'TGC' },
  { companyCode: 'KSV', companyName: 'Kato Sangyo Vietnam Company Limited', shortName: 'KSV' },
  { companyCode: 'SMRC', companyName: 'Song Ma Retail Company Limited', shortName: 'SMRC' },
  { companyCode: 'RAD', companyName: 'Red Apple Distribution Company Limited', shortName: 'RAD' }
]);
const [tgc, ksv, smrc, rad] = companies;

const locations = await Location.insertMany([
  { locationCode: 'LV1', locationName: 'LakeView 1 Head Office', company: tgc._id, locationType: 'office' },
  { locationCode: 'BT', locationName: 'Bình Tân Warehouse', company: smrc._id, locationType: 'warehouse' },
  { locationCode: 'GV', locationName: 'Gò Vấp Warehouse', company: smrc._id, locationType: 'warehouse' },
  { locationCode: 'Q7', locationName: 'District 7 Warehouse', company: rad._id, locationType: 'warehouse' },
  { locationCode: 'D9', locationName: 'District 9 Warehouse', company: smrc._id, locationType: 'warehouse' }
]);
const [lv1, bt, gv, q7, d9] = locations;

const departments = await Department.insertMany([
  { departmentCode: 'HR', departmentName: 'Phòng Hành chính Nhân sự', company: tgc._id, location: lv1._id },
  { departmentCode: 'ACC', departmentName: 'Phòng Kế toán', company: tgc._id, location: lv1._id },
  { departmentCode: 'SALE', departmentName: 'Phòng Kinh doanh', company: tgc._id, location: lv1._id },
  { departmentCode: 'LOG', departmentName: 'Phòng Logistics', company: smrc._id, location: bt._id },
  { departmentCode: 'WH', departmentName: 'Kho', company: smrc._id, location: bt._id }
]);
const [hr, acc, sale, logistics, warehouse] = departments;

const categoryRows = [
  ['LT', 'Laptop - Máy tính xách tay'], ['DT', 'Desktop - Máy tính để bàn'], ['PR', 'Printer - Máy in'],
  ['MN', 'Monitor - Màn hình'], ['SV', 'Server - Máy chủ'], ['SW', 'Network Switch'],
  ['BS', 'Barcode Scanner'], ['FL', 'Forklift - Xe nâng'], ['TR', 'Truck - Xe tải'], ['TA', 'Time Attendance']
];
const categories = await Category.insertMany(categoryRows.map(([categoryCode, categoryName]) => ({ categoryCode, categoryName })));
const byCode = Object.fromEntries(categories.map(item => [item.categoryCode, item]));

const admin = await User.create({
  employeeCode: 'EMP0001', fullName: 'Admin System', email: 'admin@demo.com', phone: '0900000001',
  company: tgc._id, department: hr._id, location: lv1._id, position: 'System Administrator',
  canLogin: true, password: '123456', role: 'admin'
});
const users = await User.create([
  { employeeCode: 'EMP0002', fullName: 'Nguyễn Văn Sales', email: 'sales@demo.com', company: tgc._id, department: sale._id, location: lv1._id, position: 'Sales Staff' },
  { employeeCode: 'EMP0003', fullName: 'Trần Thị Logistics', email: 'logistics@demo.com', company: smrc._id, department: logistics._id, location: bt._id, position: 'Logistics Manager', canLogin: true, password: '123456', role: 'manager' },
  { employeeCode: 'EMP0004', fullName: 'Lê Văn Warehouse', company: smrc._id, department: warehouse._id, location: bt._id, position: 'Warehouse Staff' }
]);

const equipments = await Equipment.insertMany([
  { assetCode: 'TGC-LT-0001', assetName: 'Dell Latitude 5420', category: byCode.LT._id, company: tgc._id, location: lv1._id, manufacturer: 'Dell', model: 'Latitude 5420', serialNumber: 'DL5420-001', supplier: 'FPT', purchaseDate: '2024-04-01', receivedDate: '2024-04-03', purchasePrice: 18000000, warrantyEndDate: '2027-04-01', depreciationYears: 3, condition: 'good', status: 'assigned' },
  { assetCode: 'TGC-LT-0002', assetName: 'HP ProBook 450', category: byCode.LT._id, company: tgc._id, location: lv1._id, manufacturer: 'HP', model: 'ProBook 450', serialNumber: 'HP450-002', purchaseDate: '2023-08-10', purchasePrice: 16500000, warrantyEndDate: '2026-08-10', condition: 'good', status: 'available' },
  { assetCode: 'TGC-MN-0001', assetName: 'Samsung 24 inch Monitor', category: byCode.MN._id, company: tgc._id, location: lv1._id, manufacturer: 'Samsung', model: 'S24R350', serialNumber: 'SS24-003', purchasePrice: 3200000, condition: 'good', status: 'available' },
  { assetCode: 'TGC-PR-0001', assetName: 'Canon LBP 2900 Printer', category: byCode.PR._id, company: tgc._id, location: lv1._id, manufacturer: 'Canon', model: 'LBP 2900', serialNumber: 'CN2900-004', purchasePrice: 4200000, condition: 'fair', status: 'maintenance' },
  { assetCode: 'SMRC-BS-0001', assetName: 'Zebra Barcode Scanner', category: byCode.BS._id, company: smrc._id, location: bt._id, manufacturer: 'Zebra', model: 'DS2208', serialNumber: 'ZB2208-005', purchasePrice: 2800000, condition: 'good', status: 'available' }
]);

await Assignment.create({
  assignmentCode: 'ASN-2026-0001', equipment: equipments[0]._id, user: users[0]._id,
  company: tgc._id, department: sale._id, issuedFromLocation: lv1._id, assignedLocation: lv1._id,
  assignDate: '2026-01-10', assignedBy: admin._id, equipmentConditionOut: 'good', status: 'active', note: 'Cấp cho nhân viên Sales'
});

await Maintenance.create({
  maintenanceCode: 'MNT-2026-0001', equipment: equipments[3]._id, requestedBy: admin._id,
  company: tgc._id, location: lv1._id, problemDescription: 'Máy in bị kẹt giấy thường xuyên',
  priority: 'medium', maintenanceType: 'corrective', status: 'processing', repairCost: 300000
});

await SoftwareLicense.insertMany([
  { licenseCode: 'LIC-2026-0001', equipment: equipments[0]._id, softwareName: 'Windows 11 Pro', category: 'Operating System', version: '11 Pro', licenseType: 'OEM', status: 'active' },
  { licenseCode: 'LIC-2026-0002', equipment: equipments[0]._id, softwareName: 'Microsoft Office', category: 'Office Suite', version: '2021', licenseType: 'Volume', status: 'active' }
]);

console.log('Seed completed');
console.log('Login: admin@demo.com / 123456');
await mongoose.disconnect();
