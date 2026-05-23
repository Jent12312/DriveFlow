// src/services/carApi.service.ts
const NINJA_API_KEY = 'cniu4cSSsWQcxHSBT3SqRWoBoa4sY5yvDf1hyoV1';

export const fetchCarSpecs = async (make: string, model: string, year: string) => {
  try {
    const response = await fetch(
      `https://api.api-ninjas.com/v1/cars?make=${make}&model=${model}&year=${year}`,
      {
        headers: { 'X-Api-Key': NINJA_API_KEY }
      }
    );

    if (!response.ok) throw new Error('Ошибка при запросе к внешнему API');
    
    const data = await response.json();
    
    // API возвращает массив модификаций. Берем первую (самую популярную).
    if (data.length > 0) {
      const carData = data[0];
      return {
        brand: carData.make.charAt(0).toUpperCase() + carData.make.slice(1),
        model: carData.model.charAt(0).toUpperCase() + carData.model.slice(1),
        year: carData.year,
        fuelType: carData.fuel_type.toUpperCase(), // gas, diesel, electricity
        transmission: carData.transmission === 'a' ? 'AUTOMATIC' : 'MANUAL',
        cylinders: carData.cylinders,
        drive: carData.drive // fwd, rwd, awd
      };
    }
    return null;
  } catch (error) {
    console.error('API Ninjas Error:', error);
    return null;
  }
};