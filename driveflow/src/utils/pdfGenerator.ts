// src/utils/pdfGenerator.ts
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateContractPDF = async (booking: any, user: any, car: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const dir = path.join(__dirname, '../../uploads/contracts');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const fileName = `contract-${booking.id}.pdf`;
    const filePath = path.join(dir, fileName);
    const fileUrl = `/uploads/contracts/${fileName}`;

    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Безопасное разрешение путей к шрифтам относительно корня проекта (работает в ts-node и в Docker)
    const fontPath = path.join(process.cwd(), 'fonts/Roboto-Regular.ttf');
    const fontBoldPath = path.join(process.cwd(), 'fonts/Roboto-Bold.ttf');
    // Регистрируем шрифты в PDFKit
    doc.registerFont('Roboto', fontPath);
    doc.registerFont('Roboto-Bold', fontBoldPath);

    // Используем зарегистрированные шрифты (кириллица теперь полностью поддерживается!)
    doc.fontSize(24).font('Roboto-Bold').text('DriveFlow.', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(16).font('Roboto-Bold').text('ДЕСЯТЬ ДНЕЙ АРЕНДЫ — ДОГОВОР', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('ДОГОВОР АРЕНДЫ АВТОМОБИЛЯ', { align: 'center' });
    doc.fontSize(10).font('Roboto').text(`Номер бронирования: ${booking.id}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).text(`Дата оформления: ${new Date().toLocaleDateString('ru-RU')}`);
    doc.moveDown();

    doc.font('Roboto-Bold').text('1. Стороны договора');
    doc.font('Roboto').text(`Арендодатель: Сервис DriveFlow.`);
    doc.text(`Арендатор: ${user.firstName} ${user.lastName} (Email: ${user.email}, Тел: ${user.phone || 'Не указан'})`);
    doc.moveDown();

    doc.font('Roboto-Bold').text('2. Предмет договора (Автомобиль)');
    doc.font('Roboto').text(`Марка и модель: ${car.brand} ${car.model} (${car.year} г.в.)`);
    doc.text(`Категория: ${car.category} | Трансмиссия: ${car.transmission === 'AUTOMATIC' ? 'Автомат' : 'Механика'}`);
    doc.moveDown();

    doc.font('Roboto-Bold').text('3. Условия и финансовые расчеты');
    doc.font('Roboto').text(`Период аренды: с ${new Date(booking.startDate).toLocaleDateString('ru-RU')} по ${new Date(booking.endDate).toLocaleDateString('ru-RU')}`);
    doc.font('Roboto-Bold').text(`Итоговая стоимость: ${booking.totalPrice} рублей (включая наценку за выходные дни, если применимо)`);
    doc.moveDown(2);

    doc.font('Roboto').text('Подпись Арендодателя: _________________    Подпись Арендатора: _________________', { align: 'center' });

    doc.end();

    writeStream.on('finish', () => resolve(fileUrl));
    writeStream.on('error', reject);
  });
};