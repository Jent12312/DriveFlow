// prisma/seed.js
const { PrismaClient, CarCategory, Transmission, CarStatus, KycStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Очистка старой базы данных...');
  await prisma.inspection.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.car.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Создание тестового пользователя...');
  await prisma.user.create({
    data: {
      id: 'client-user-id',
      email: 'client@driveflow.ru',
      passwordHash: '$2a$10$Y5V48Qv7X8gA1A9S3gP8O.D3P2t1r8B1w2o3i4p5e6r7t8y9u0i1o', // password123
      firstName: 'Иван',
      lastName: 'Иванов',
      phone: '+7 (999) 123-45-67',
      role: 'CLIENT',
      kycStatus: KycStatus.APPROVED
    }
  });

  console.log('🚗 Наполнение автопарка (10 премиальных автомобилей)...');

  await prisma.car.createMany({
    data: [
      {
        brand: 'Tesla',
        model: 'Model Y',
        year: 2022,
        category: CarCategory.SUV,
        transmission: Transmission.AUTOMATIC,
        fuelType: 'Electric',
        seats: 5,
        pricePerDay: 8500,
        status: CarStatus.AVAILABLE,
        images: ['https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=600'],
        hasGps: true,
        hasChildSeat: true
      },
      {
        brand: 'BMW',
        model: '5 Series',
        year: 2021,
        category: CarCategory.BUSINESS,
        transmission: Transmission.AUTOMATIC,
        fuelType: 'Petrol',
        seats: 5,
        pricePerDay: 7000,
        status: CarStatus.AVAILABLE,
        images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=600'],
        hasGps: true
      },
      {
        brand: 'Porsche',
        model: 'Taycan 4S',
        year: 2021,
        category: CarCategory.BUSINESS,
        transmission: Transmission.AUTOMATIC,
        fuelType: 'Electric',
        seats: 4,
        pricePerDay: 15000,
        status: CarStatus.AVAILABLE,
        images: ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=600'],
        hasGps: true
      },
      {
        brand: 'Hyundai',
        model: 'Solaris',
        year: 2020,
        category: CarCategory.ECONOMY,
        transmission: Transmission.AUTOMATIC,
        fuelType: 'Petrol',
        seats: 5,
        pricePerDay: 2500,
        status: CarStatus.AVAILABLE,
        images: ['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=600'],
        hasChildSeat: true
      },
      {
        brand: 'Audi',
        model: 'A4 M-Sport',
        year: 2020,
        category: CarCategory.BUSINESS,
        transmission: Transmission.AUTOMATIC,
        fuelType: 'Petrol',
        seats: 5,
        pricePerDay: 5500,
        status: CarStatus.AVAILABLE,
        images: ['https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?q=80&w=600'],
        hasGps: true
      },
      {
        brand: 'Mercedes-Benz',
        model: 'C-Class AMG',
        year: 2021,
        category: CarCategory.BUSINESS,
        transmission: Transmission.AUTOMATIC,
        fuelType: 'Petrol',
        seats: 5,
        pricePerDay: 6500,
        status: CarStatus.AVAILABLE,
        images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=600'],
        hasGps: true
      },
      {
        brand: 'Kia',
        model: 'Rio',
        year: 2019,
        category: CarCategory.ECONOMY,
        transmission: Transmission.AUTOMATIC,
        fuelType: 'Petrol',
        seats: 5,
        pricePerDay: 2300,
        status: CarStatus.AVAILABLE,
        images: ['https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=600'],
        hasChildSeat: true
      },
      {
        brand: 'Toyota',
        model: 'RAV4 Active',
        year: 2021,
        category: CarCategory.SUV,
        transmission: Transmission.AUTOMATIC,
        fuelType: 'Petrol',
        seats: 5,
        pricePerDay: 5000,
        status: CarStatus.AVAILABLE,
        images: ['https://images.unsplash.com/photo-1621007947382-cc3479411518?q=80&w=600'],
        hasGps: true,
        hasChildSeat: true
      },
      {
        brand: 'Volkswagen',
        model: 'Polo Connect',
        year: 2020,
        category: CarCategory.ECONOMY,
        transmission: Transmission.MANUAL,
        fuelType: 'Petrol',
        seats: 5,
        pricePerDay: 2200,
        status: CarStatus.AVAILABLE,
        images: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=600'],
        hasChildSeat: true
      },
      {
        brand: 'Lexus',
        model: 'RX 350 Luxury',
        year: 2021,
        category: CarCategory.SUV,
        transmission: Transmission.AUTOMATIC,
        fuelType: 'Petrol',
        seats: 5,
        pricePerDay: 9000,
        status: CarStatus.AVAILABLE,
        images: ['https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=600'],
        hasGps: true,
        hasChildSeat: true
      }
    ]
  });

  console.log('✅ База успешно наполнена!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });