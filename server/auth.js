const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'isbul-demo-secret-degistir';

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, SECRET, { expiresIn: '7d' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Oturum bulunamadı. Lütfen giriş yapın.' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Oturum geçersiz veya süresi dolmuş.' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
    next();
  };
}

module.exports = { sign, requireAuth, requireRole, SECRET };
