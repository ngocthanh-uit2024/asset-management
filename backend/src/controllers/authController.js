import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password').populate(['company', 'department', 'location']);
    if (!user || !user.canLogin || user.status !== 'active' || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        employeeCode: user.employeeCode,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        company: user.company,
        department: user.department,
        location: user.location
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function me(req, res) {
  res.json(req.user);
}
