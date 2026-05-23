// src/controllers/admin.controller.ts
import type { Request, Response } from 'express';
import { prisma } from '../server';
import { CarCategory, Transmission, CarStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: Скачивание картинки на сервер (Проксирование)
const downloadImage = async (url: string, destFolder: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    // Читаем бинарные данные картинки
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Генерируем уникальное локальное имя для файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `car-proxy-${uniqueSuffix}.jpg`;
    const filepath = path.join(destFolder, filename);

    // Проверяем, существует ли папка, если нет — создаем
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }

    // Записываем файл на диск
    fs.writeFileSync(filepath, buffer);
    console.log(`💾 Картинка успешно проксирована и сохранена локально: /uploads/cars/${filename}`);
    
    return `/uploads/cars/${filename}`; // Возвращаем локальный путь для записи в БД
  } catch (error) {
    console.error('❌ Ошибка при скачивании картинки прокси-сервером:', error);
    return null;
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalCars = await prisma.car.count();
    const availableCars = await prisma.car.count({ where: { status: CarStatus.AVAILABLE } });
    const activeBookings = await prisma.booking.count({ where: { status: 'ACTIVE' } });
    
    const completedBookings = await prisma.booking.findMany({ where: { status: 'COMPLETED' } });
    const totalRevenue = completedBookings.reduce((sum: number, b: any) => sum + b.totalPrice, 0);

    res.json({ totalCars, availableCars, activeBookings, totalRevenue });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
        car: { select: { brand: true, model: true } },
        inspection: true 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения бронирований' });
  }
};

export const updateCarStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const updatedCar = await prisma.car.update({
      where: { id: id },
      data: { status: status as CarStatus }
    });
    res.json(updatedCar);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления статуса' });
  }
};

// УМНОЕ ДОБАВЛЕНИЕ С ПРОКСИРОВАНИЕМ КАРТИНОК НА СЕРВЕР
export const addCar = async (req: Request, res: Response) => {
  try {
    const { brand, model, year, pricePerDay, category } = req.body;
    const carsUploadFolder = path.join(process.cwd(), 'uploads/cars');

    let imageUrl = '';

    // 1. Если админ сам загрузил файл с компьютера
    if (req.file) {
      imageUrl = `/uploads/cars/${req.file.filename}`;
    } else {
      // 2. Если файл НЕ загружен — сервер сам запрашивает LoremFlickr, 
      // скачивает картинку на диск и выдает локальную ссылку!
      const queryBrand = encodeURIComponent(brand.toLowerCase());
      const queryModel = encodeURIComponent(model.toLowerCase());
      const remoteUrl = `https://loremflickr.com/600/400/${queryBrand},${queryModel},car/all`;
      
      console.log(`🤖 Прокси-загрузчик: Скачиваем фото для ${brand} ${model}...`);
      
      const localPath = await downloadImage(remoteUrl, carsUploadFolder);
      if (localPath) {
        imageUrl = localPath; // Записываем локальный путь: /uploads/cars/car-proxy-xxx.jpg
      } else {
        // Резервная заглушка, если LoremFlickr недоступен даже для сервера
        imageUrl = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600';
      }
    }

    // 3. Получаем тех. характеристики из API Ninjas
    let transmission: Transmission = 'AUTOMATIC';
    let fuelType = 'Petrol';
    let seats = 5;

    try {
      const apiResponse = await fetch(
        `https://api.api-ninjas.com/v1/cars?make=${brand}&model=${model}&year=${year}`,
        { headers: { 'X-Api-Key': '6n8eRE3S/7fGzAtK8gD9WA==b0H8YgN0jH9XWp2y' } }
      );
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        if (data && data.length > 0) {
          transmission = data[0].transmission === 'a' ? 'AUTOMATIC' : 'MANUAL';
          fuelType = data[0].fuel_type === 'gas' ? 'Petrol' : data[0].fuel_type.charAt(0).toUpperCase() + data[0].fuel_type.slice(1);
        }
      }
    } catch (apiError) {
      console.warn('Не удалось загрузить ТТХ с API Ninjas, ставим дефолтные.');
    }

    // 4. Запись в БД
    const newCar = await prisma.car.create({
      data: {
        brand,
        model,
        year: Number(year),
        pricePerDay: Number(pricePerDay),
        category: category as CarCategory,
        transmission,
        fuelType,
        seats,
        images: [imageUrl],
        status: CarStatus.AVAILABLE
      }
    });

    res.status(201).json(newCar);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при сохранении авто' });
  }
};