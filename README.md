# AssetPro - Enterprise Asset Management System

Đồ án môn IE213 sử dụng MERN Stack để quản lý thiết bị cho doanh nghiệp phân phối và bán lẻ.

## Chức năng

- Đăng nhập JWT và phân quyền cơ bản
- Quản lý công ty, địa điểm, phòng ban, nhân viên, loại thiết bị
- Quản lý thiết bị và tự sinh mã `COMPANY-CATEGORY-0001`
- Cấp phát, thu hồi và lưu lịch sử người sử dụng
- Báo hỏng, bảo trì và chi phí sửa chữa
- Quản lý Software License
- Dashboard thống kê

## Công nghệ

- Frontend: React, Vite, Axios
- Backend: Node.js, Express, Mongoose, JWT
- Database: MongoDB Atlas

## Chạy local

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Mở `http://localhost:5173`.

Tài khoản demo:

- Email: `admin@demo.com`
- Password: `123456`

## Biến môi trường

Không đưa file `.env` lên GitHub. Sử dụng `.env.example` để cấu hình.
