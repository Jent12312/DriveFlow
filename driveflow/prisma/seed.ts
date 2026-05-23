// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Очистка старой базы данных...');
  await prisma.inspection.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.car.deleteMany();
  await prisma.user.deleteMany();

  console.log('🚗 Наполнение базы данных новыми автомобилями...');

  // 1. Создаем тестового пользователя-клиента (чтобы было кому бронировать)
  const testUser = await prisma.user.create({
    data: {
      email: 'client@driveflow.ru',
      passwordHash: '$2a$10$Y5V48Qv7X8gA1A9S3gP8O.D3P2t1r8B1w2o3i4p5e6r7t8y9u0i1o', // хэш "password123"
      firstName: 'Atabek',
      lastName: 'Babajanow',
      phone: '+7 (999) 123-45-67',
      role: 'CLIENT',
      kycStatus: 'APPROVED'
    }
  });

  // 2. Создаем премиальный автопарк с качественными фото с Unsplash
  await prisma.car.createMany({
    data: [
      {
        brand: 'Tesla',
        model: 'Model Y Long Range',
        year: 2022,
        category: 'SUV',
        transmission: 'AUTOMATIC',
        fuelType: 'Electric',
        seats: 5,
        pricePerDay: 8500,
        status: 'AVAILABLE',
        mileage: 12000,
        fuelLevel: 94, // Заряд батареи
        images: ['https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=600&auto=format&fit=crop'],
        hasGps: true,
        hasChildSeat: true
      },
      {
        brand: 'BMW',
        model: '5 Series M Sport',
        year: 2021,
        category: 'BUSINESS',
        transmission: 'AUTOMATIC',
        fuelType: 'Petrol',
        seats: 5,
        pricePerDay: 7000,
        status: 'AVAILABLE',
        mileage: 34000,
        fuelLevel: 100,
        images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=600&auto=format&fit=crop'],
        hasGps: true
      },
      {
        brand: 'Porsche',
        model: 'Taycan 4S',
        year: 2021,
        category: 'BUSINESS',
        transmission: 'AUTOMATIC',
        fuelType: 'Electric',
        seats: 4,
        pricePerDay: 15000,
        status: 'AVAILABLE',
        mileage: 8000,
        fuelLevel: 80,
        images: ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=600&auto=format&fit=crop'],
        hasGps: true
      },
      {
        brand: 'Hyundai',
        model: 'Solaris',
        year: 2020,
        category: 'ECONOMY',
        transmission: 'AUTOMATIC',
        fuelType: 'Petrol',
        seats: 5,
        pricePerDay: 2500,
        status: 'AVAILABLE',
        mileage: 85000,
        fuelLevel: 50,
        images: ['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=600&auto=format&fit=crop'],
        hasChildSeat: true
      }
    ]
  });

  console.log('✅ База успешно наполнена!');
}

main()
  .catch((e) => {
    console.error(e);
    throw e; // <-- Заменили process.exit(1) на throw e
  })
  .finally(async () => {
    await prisma.$disconnect();
  });