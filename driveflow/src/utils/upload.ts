// src/utils/upload.ts
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Функция для создания папок, если их нет
const ensureDirectoryExistence = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Разделяем папки: для фото осмотра и для профилей (в будущем)
    const dir = path.join(__dirname, '../../uploads/inspections');
    ensureDirectoryExistence(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Уникальное имя: timestamp + оригинальное расширение
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Настраиваем загрузку: ждем 4 конкретных файла
export const uploadInspectionPhotos = multer({ storage }).fields([
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 },
  { name: 'left', maxCount: 1 },
  { name: 'right', maxCount: 1 },
]);

const carStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/cars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'car-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Middleware для загрузки одиночного файла машины
export const uploadCarPhoto = multer({ storage: carStorage }).single('carImage');