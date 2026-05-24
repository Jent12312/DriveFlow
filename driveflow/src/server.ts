// src/server.ts
import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import carRoutes from './routes/car.routes';
import bookingRoutes from './routes/booking.routes';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import { generateContractPDF } from './utils/pdfGenerator';
import { uploadInspectionPhotos } from './utils/upload';

export const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Подключение роутов
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/auth', authRoutes);

app.post('/api/users/kyc', async (req, res): Promise<any> => {
  try {
    const { userId, passportUrl, licenseUrl } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        passportUrl,
        licenseUrl,
        kycStatus: 'PENDING' // Статус меняется на "Ожидает проверки"
      }
    });
    res.json({ message: 'Документы отправлены на проверку', user: updatedUser });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка загрузки документов' });
  }
});

app.post('/api/inspections', uploadInspectionPhotos, async (req: any, res: any): Promise<any> => {
  try {
    const { bookingId, notes } = req.body;
    const files = req.files;

    if (!files || !files.front?.[0] || !files.back?.[0] || !files.left?.[0] || !files.right?.[0]) {
      return res.status(400).json({ error: 'Загрузите все 4 фото' });
    }

    const frontImgUrl = `/uploads/inspections/${files.front[0].filename}`;
    const backImgUrl = `/uploads/inspections/${files.back[0].filename}`;
    const leftImgUrl = `/uploads/inspections/${files.left[0].filename}`;
    const rightImgUrl = `/uploads/inspections/${files.right[0].filename}`;

    // 1. ИСПРАВЛЕНИЕ P2002: Проверяем, есть ли уже осмотр для этой брони
    const existingInspection = await prisma.inspection.findUnique({
      where: { bookingId }
    });

    let inspection;

    if (existingInspection) {
      // Если осмотр уже создавался ранее — перезаписываем его новыми фото
      console.log(`🔄 Перезаписываем существующий осмотр для брони: ${bookingId}`);
      inspection = await prisma.inspection.update({
        where: { bookingId },
        data: { notes: notes || '', frontImgUrl, backImgUrl, leftImgUrl, rightImgUrl }
      });
    } else {
      // Если это первая попытка — создаем новую запись
      console.log(`📝 Создаем новый осмотр для брони: ${bookingId}`);
      inspection = await prisma.inspection.create({
        data: { bookingId, notes: notes || '', frontImgUrl, backImgUrl, leftImgUrl, rightImgUrl }
      });
    }

    // 2. Получаем полные данные бронирования для PDF договора
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, car: true }
    });

    if (booking) {
      console.log(`📄 Верстаем PDF договор для брони: ${booking.id}...`);
      // Генерируем красивый PDF договор (шрифты теперь найдутся успешно!)
      const contractUrl = await generateContractPDF(booking, booking.user, booking.car);

      // 3. Обновляем бронирование: прикрепляем договор и переводим в статус ACTIVE
      await prisma.booking.update({
        where: { id: bookingId },
        data: { 
          status: 'ACTIVE',
          contractUrl: contractUrl
        }
      });
      console.log(`✅ Договор успешно сгенерирован: ${contractUrl}`);
    }

    res.status(201).json({ message: 'Осмотр пройден, договор сгенерирован!', inspection });
  } catch (error) {
    console.error('❌ Ошибка сохранения осмотра:', error);
    res.status(500).json({ error: 'Ошибка сохранения осмотра' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// src/server.ts (Получить свежий профиль пользователя с сервера)
app.get('/api/users/:id', async (req, res): Promise<any> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, firstName: true, email: true, kycStatus: true } // берем только нужное
    });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});

