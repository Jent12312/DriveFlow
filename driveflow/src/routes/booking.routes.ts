// src/routes/booking.routes.ts
import { Router } from 'express';
import { createBooking } from '../controllers/booking.controller';
import { prisma } from '../server';
import { BookingStatus, CarStatus } from '@prisma/client';

const router = Router();

router.post('/', createBooking);

// Получить историю бронирований конкретного пользователя
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: { car: true, inspection: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка получения истории' });
  }
});

// Отмена бронирования (клиентом или админом)
router.put('/:id/cancel', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ error: 'Бронь не найдена' });

    // Освобождаем машину и отменяем бронь в транзакции
    await prisma.$transaction([
      prisma.car.update({
        where: { id: booking.carId },
        data: { status: CarStatus.AVAILABLE }
      }),
      prisma.booking.update({
        where: { id },
        data: { status: BookingStatus.CANCELLED }
      })
    ]);

    res.json({ message: 'Бронирование успешно отменено, автомобиль свободен.' });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка отмены бронирования' });
  }
});

export default router;