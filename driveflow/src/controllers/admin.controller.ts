// src/controllers/admin.controller.ts (Загрузка ТТХ и сочных фото с Unsplash API)
import type { Request, Response } from 'express';
import { prisma } from '../server';
import { CarCategory, Transmission, CarStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Рабочий ключ разработчика Unsplash (Access Key) для поиска фото авто
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'uJpGvT_7fGzAtK8gD9WA==b0H8YgN0jH9XWp2y'; 

// Функция скачивания картинки на сервер (Проксирование)
const downloadImage = async (url: string, destFolder: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `car-proxy-${uniqueSuffix}.jpg`;
    const filepath = path.join(destFolder, filename);

    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }

    fs.writeFileSync(filepath, buffer);
    console.log(`💾 Фото успешно проксировано и сохранено локально: /uploads/cars/${filename}`);
    
    return `/uploads/cars/${filename}`; 
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
    const id  = req.params.id as string;
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

// ДОБАВЛЕНИЕ С ИНТЕГРАЦИЕЙ ИСХОДНОГО UNSPLASH API
export const addCar = async (req: Request, res: Response) => {
  try {
    const { brand, model, year, pricePerDay, category } = req.body;
    const carsUploadFolder = path.join(process.cwd(), 'uploads/cars');

    let imageUrl = '';

    // 1. Если админ загрузил файл с компьютера
    if (req.file) {
      imageUrl = `/uploads/cars/${req.file.filename}`;
    } else {
      // 2. Ищем сочное оригинальное фото на Unsplash через API поиска
      const query = `${brand} ${model} car`;
      console.log(`🤖 Делаем запрос к Unsplash API для поиска фото: ${query}...`);
      
      try {
        const searchRes = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=6n8eRE3S/7fGzAtK8gD9WA==b0H8YgN0jH9XWp2y`
        );
        
        if (searchRes.ok) {
          const data = await searchRes.json();
          if (data.results && data.results.length > 0) {
            const unsplashOriginalUrl = data.results[0].urls.regular; // Получаем URL вида https://images.unsplash.com/...
            console.log(`📸 Найдено сочное фото на Unsplash: ${unsplashOriginalUrl}`);
            
            // Скачиваем его на наш сервер, чтобы у клиентов всё работало БЕЗ VPN!
            const localPath = await downloadImage(unsplashOriginalUrl, carsUploadFolder);
            if (localPath) imageUrl = localPath;
          }
        }
      } catch (e) {
        console.warn('⚠️ Ошибка запроса к Unsplash API, используем резервный генератор.');
      }

      // Запасной генератор, если Unsplash API превысил лимиты запросов
      if (!imageUrl) {
        const remoteUrl = `https://loremflickr.com/600/400/${encodeURIComponent(brand.toLowerCase())},car/all`;
        const localPath = await downloadImage(remoteUrl, carsUploadFolder);
        if (localPath) imageUrl = localPath;
      }
    }

    // 3. Получаем ТТХ из API Ninjas
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
      console.warn('Не удалось загрузить ТТХ с API Ninjas, ставим стандартные.');
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
