// src/controllers/car.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../server';
import { CarCategory, Transmission } from '@prisma/client';

export const getCars = async (req: Request, res: Response) => {
  try {
    const { category, transmission, minPrice, maxPrice } = req.query;

    // Динамическая сборка фильтров
    const filters: any = { status: 'AVAILABLE' }; // Показываем только свободные

    if (category) filters.category = category as CarCategory;
    if (transmission) filters.transmission = transmission as Transmission;
    if (minPrice || maxPrice) {
      filters.pricePerDay = {};
      if (minPrice) filters.pricePerDay.gte = Number(minPrice);
      if (maxPrice) filters.pricePerDay.lte = Number(maxPrice);
    }

    const cars = await prisma.car.findMany({
      where: filters,
      orderBy: { pricePerDay: 'asc' }, // Сортировка по цене
    });

    res.json(cars);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
};