# AssetPro v2 Upgrade Notes

Phiên bản này nâng cấp source cũ sang cấu trúc 9 collection mới:

- companies
- locations
- departments
- users
- categories
- equipments
- assignments
- maintenances
- softwarelicenses

## Quan trọng

Lệnh `npm run seed` sẽ xóa dữ liệu hiện tại trong các collection trên và tạo dữ liệu mẫu mới. Hãy sao lưu database trước khi chạy.

## Cách chạy

1. Sao chép `backend/.env.example` thành `backend/.env` và nhập chuỗi MongoDB Atlas.
2. Chạy backend: `cd backend && npm install && npm run seed && npm run dev`.
3. Chạy frontend: `cd frontend && npm install && npm run dev`.
4. Đăng nhập: `admin@demo.com` / `123456`.
