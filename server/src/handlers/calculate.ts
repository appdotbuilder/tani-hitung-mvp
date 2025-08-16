import { type CalculationInput, type CalculationOutput } from '../schema';

export const calculate = async (slug: string, input: CalculationInput): Promise<CalculationOutput> => {
  try {
    // Validate input parameters
    if (!slug) {
      throw new Error('Calculator slug is required');
    }

    if (!input || typeof input !== 'object') {
      throw new Error('Valid input data is required');
    }

    // Perform calculations based on calculator slug
    switch (slug) {
      case 'fertilizer-requirement': {
        // kgNeeded = areaHa * doseKgPerHa
        const areaHa = input['areaHa'] as number;
        const doseKgPerHa = input['doseKgPerHa'] as number;

        if (typeof areaHa !== 'number' || areaHa <= 0) {
          throw new Error('Area in hectares must be a positive number');
        }
        if (typeof doseKgPerHa !== 'number' || doseKgPerHa <= 0) {
          throw new Error('Dose per hectare must be a positive number');
        }

        return {
          resultValue: areaHa * doseKgPerHa,
          unitLabel: "kg"
        };
      }

      case 'chicken-feed-daily': {
        // kgPerDay = chickenCount * feedKgPerChickenPerDay
        const chickenCount = input['chickenCount'] as number;
        const feedKgPerChickenPerDay = input['feedKgPerChickenPerDay'] as number;

        if (typeof chickenCount !== 'number' || chickenCount <= 0 || !Number.isInteger(chickenCount)) {
          throw new Error('Chicken count must be a positive integer');
        }
        if (typeof feedKgPerChickenPerDay !== 'number' || feedKgPerChickenPerDay <= 0) {
          throw new Error('Feed per chicken per day must be a positive number');
        }

        return {
          resultValue: chickenCount * feedKgPerChickenPerDay,
          unitLabel: "kg/day"
        };
      }

      case 'livestock-medicine-dosage': {
        // mgTotal = weightKg * doseMgPerKg
        const weightKg = input['weightKg'] as number;
        const doseMgPerKg = input['doseMgPerKg'] as number;
        const concentrationMgPerMl = input['concentrationMgPerMl'] as number | undefined;

        if (typeof weightKg !== 'number' || weightKg <= 0) {
          throw new Error('Weight must be a positive number');
        }
        if (typeof doseMgPerKg !== 'number' || doseMgPerKg <= 0) {
          throw new Error('Dose per kg must be a positive number');
        }
        if (concentrationMgPerMl !== undefined && (typeof concentrationMgPerMl !== 'number' || concentrationMgPerMl <= 0)) {
          throw new Error('Concentration must be a positive number');
        }

        const mgTotal = weightKg * doseMgPerKg;
        const result: CalculationOutput = {
          resultValue: mgTotal,
          unitLabel: "mg"
        };

        // Optional volume calculation if concentration is provided
        if (concentrationMgPerMl) {
          result.additionalResults = {
            volumeMl: mgTotal / concentrationMgPerMl
          };
        }

        return result;
      }

      case 'harvest-estimation': {
        // tonTotal = areaHa * yieldTonPerHa
        const areaHa = input['areaHa'] as number;
        const yieldTonPerHa = input['yieldTonPerHa'] as number;

        if (typeof areaHa !== 'number' || areaHa <= 0) {
          throw new Error('Area in hectares must be a positive number');
        }
        if (typeof yieldTonPerHa !== 'number' || yieldTonPerHa <= 0) {
          throw new Error('Yield per hectare must be a positive number');
        }

        return {
          resultValue: areaHa * yieldTonPerHa,
          unitLabel: "ton"
        };
      }

      case 'planting-cost': {
        // totalCost = areaHa * costRpPerHa
        const areaHa = input['areaHa'] as number;
        const costRpPerHa = input['costRpPerHa'] as number;

        if (typeof areaHa !== 'number' || areaHa <= 0) {
          throw new Error('Area in hectares must be a positive number');
        }
        if (typeof costRpPerHa !== 'number' || costRpPerHa <= 0) {
          throw new Error('Cost per hectare must be a positive number');
        }

        return {
          resultValue: areaHa * costRpPerHa,
          unitLabel: "Rp"
        };
      }

      default:
        throw new Error(`Unknown calculator slug: ${slug}`);
    }
  } catch (error) {
    console.error('Calculation failed:', error);
    throw error;
  }
};