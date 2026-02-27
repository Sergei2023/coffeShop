import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Токен отсутствует' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(`🔐 Авторизован: ${decoded.email}, роль: ${decoded.role}`);
    next();
  } catch (err) {
    console.error('❌ Ошибка токена:', err.message);
    return res.status(403).json({ 
      success: false,
      error: 'Токен недействителен' 
    });
  }
};

authMiddleware.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      error: 'Требуются права администратора' 
    });
  }
};

export default authMiddleware;