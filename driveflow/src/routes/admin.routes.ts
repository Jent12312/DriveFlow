// src/routes/admin.routes.ts
import { Router } from 'express';
import { getDashboardStats, getAllBookings, updateCarStatus, addCar } from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/auth.middleware';
import { KycStatus } from '@prisma/client';
import { prisma } from '../server';
import { uploadCarPhoto } from '../utils/upload';

const router = Router();

router.get('/stats', requireAdmin, getDashboardStats);
router.get('/bookings', requireAdmin, getAllBookings);
router.put('/cars/:id/status', requireAdmin, updateCarStatus);
router.post('/cars', requireAdmin, uploadCarPhoto, addCar); 

export default router;

router.get('/kyc/pending', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { kycStatus: KycStatus.PENDING },
      select: { id: true, firstName: true, lastName: true, email: true, passportUrl: true, licenseUrl: true }
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Одобрить или отклонить документы пользователя
router.put('/kyc/:userId', requireAdmin, async (req, res): Promise<any> => {
  try {
    // Явно приводим параметр к типу string
    const userId = req.params.userId as string; 
    const { status } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId }, // Теперь TypeScript спокоен, так как id получает чистую строку
      data: { kycStatus: status as KycStatus }
    });

    res.json(updatedUser);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка верификации' });
  }
});

router.get('/cars', requireAdmin, async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      orderBy: { brand: 'asc' }
    }); // Никаких фильтров по статусу AVAILABLE! Админ видит всё.
    res.json(cars);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка получения автопарка для админа' });
  }
});

