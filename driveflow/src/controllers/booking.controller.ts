// src/controllers/booking.controller.ts
import type { Request, Response } from 'express';
import { prisma } from '../server';
// Импортируем официальные типы статусов из Prisma
import { CarStatus, BookingStatus } from '@prisma/client';

// Вспомогательная функция: Расчет цены с учетом выходных дней (+20%)
const calculateTotalPrice = (startDate: Date, endDate: Date, basePrice: number): number => {
  let totalPrice = 0;
  let currentDate = new Date(startDate);

  while (currentDate < endDate) {
    const dayOfWeek = currentDate.getDay(); // 0 - Воскресенье, 6 - Суббота
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      totalPrice += basePrice * 1.2;
    } else {
      totalPrice += basePrice;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return Math.round(totalPrice);
};

export const createBooking = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId, carId, start, end } = req.body;
    const startDate = new Date(start);
    const endDate = new Date(end);

    // 1. Проверяем, существует ли авто
    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car || car.status !== CarStatus.AVAILABLE) {
      return res.status(400).json({ error: 'Автомобиль недоступен для бронирования' });
    }

    // 2. Считаем итоговую стоимость
    const totalPrice = calculateTotalPrice(startDate, endDate, car.pricePerDay);

    // 3. Создаем бронирование в транзакции (типы tx выводятся автоматически)
    const booking = await prisma.$transaction(async (tx) => {
      // Меняем статус авто на RENTED
      await tx.car.update({
        where: { id: carId },
        data: { status: CarStatus.RENTED } // Используем строго типизированный Enum
      });

      // Создаем запись бронирования
      return tx.booking.create({
        data: {
          userId,
          carId,
          startDate,
          endDate,
          totalPrice,
          status: BookingStatus.PENDING // Используем строго типизированный Enum
        }
      });
    });

    res.status(201).json({ 
      message: 'Бронирование успешно создано', 
      booking 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при создании бронирования' });
  }
};