import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (req.user.status !== 'active' || !req.user.canLogin) {
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa hoặc không được phép đăng nhập' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token invalid' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện chức năng này' });
    }
    next();
  };
}
