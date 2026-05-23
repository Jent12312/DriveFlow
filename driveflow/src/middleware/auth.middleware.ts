// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';

// В реальном проекте здесь будет расшифровка JWT токена
export const requireAdmin = (req: Request, res: Response, next: NextFunction): any => {
  // Имитация: получаем роль из заголовка (в проде берется из токена)
  const userRole = req.headers['x-user-role']; 

  if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
  }
  
  next();
};