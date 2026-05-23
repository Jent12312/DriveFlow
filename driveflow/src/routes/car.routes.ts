// src/routes/car.routes.ts
import { Router } from 'express';
import { getCars } from '../controllers/car.controller';

const router = Router();

// Маршрут получения автомобилей
router.get('/', getCars);

export default router;