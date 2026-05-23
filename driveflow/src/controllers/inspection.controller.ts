// src/controllers/inspection.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../server';
import { BookingStatus } from '@prisma/client';

export const submitInspection = async (req: Request, res: Response): Promise<any> => {
  try {
    const { bookingId, notes } = req.body;
    
    // Явно указываем тип файлов, включая возможность undefined
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    // Проверяем наличие самих файлов И первых элементов в массивах (через опциональную цепочку ?.[0])
    if (!files || !files.front?.[0] || !files.back?.[0] || !files.left?.[0] || !files.right?.[0]) {
      return res.status(400).json({ error: 'Необходимо загрузить фото авто со всех 4-х сторон' });
    }

    // Теперь TypeScript на 100% уверен, что эти файлы существуют и не выдаст ошибку
    const frontImgUrl = `/uploads/inspections/${files.front[0].filename}`;
    const backImgUrl = `/uploads/inspections/${files.back[0].filename}`;
    const leftImgUrl = `/uploads/inspections/${files.left[0].filename}`;
    const rightImgUrl = `/uploads/inspections/${files.right[0].filename}`;

    // Записываем осмотр в БД
    const inspection = await prisma.inspection.create({
      data: {
        bookingId,
        notes: notes || '',
        frontImgUrl,
        backImgUrl,
        leftImgUrl,
        rightImgUrl,
      }
    });

    // Меняем статус брони на ACTIVE (Поездка началась)
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.ACTIVE }
    });

    res.status(201).json({ message: 'Осмотр успешно пройден. Поездка началась!', inspection });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при сохранении осмотра' });
  }
};