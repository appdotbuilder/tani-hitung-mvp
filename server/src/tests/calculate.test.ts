import { describe, expect, it } from 'bun:test';
import { calculate } from '../handlers/calculate';
import { type CalculationInput } from '../schema';

describe('calculate', () => {
  describe('fertilizer-requirement', () => {
    const validInput: CalculationInput = {
      areaHa: 2.5,
      doseKgPerHa: 100
    };

    it('should calculate fertilizer requirement correctly', async () => {
      const result = await calculate('fertilizer-requirement', validInput);

      expect(result.resultValue).toEqual(250);
      expect(result.unitLabel).toEqual('kg');
      expect(result.additionalResults).toBeUndefined();
    });

    it('should handle decimal areas', async () => {
      const result = await calculate('fertilizer-requirement', {
        areaHa: 1.75,
        doseKgPerHa: 120
      });

      expect(result.resultValue).toEqual(210);
      expect(result.unitLabel).toEqual('kg');
    });

    it('should throw error for invalid area', async () => {
      await expect(calculate('fertilizer-requirement', {
        areaHa: -1,
        doseKgPerHa: 100
      })).rejects.toThrow(/area.*positive/i);

      await expect(calculate('fertilizer-requirement', {
        areaHa: 'invalid',
        doseKgPerHa: 100
      })).rejects.toThrow(/area.*positive/i);
    });

    it('should throw error for invalid dose', async () => {
      await expect(calculate('fertilizer-requirement', {
        areaHa: 2.5,
        doseKgPerHa: 0
      })).rejects.toThrow(/dose.*positive/i);

      await expect(calculate('fertilizer-requirement', {
        areaHa: 2.5,
        doseKgPerHa: 'invalid'
      })).rejects.toThrow(/dose.*positive/i);
    });
  });

  describe('chicken-feed-daily', () => {
    const validInput: CalculationInput = {
      chickenCount: 50,
      feedKgPerChickenPerDay: 0.12
    };

    it('should calculate daily chicken feed correctly', async () => {
      const result = await calculate('chicken-feed-daily', validInput);

      expect(result.resultValue).toEqual(6);
      expect(result.unitLabel).toEqual('kg/day');
      expect(result.additionalResults).toBeUndefined();
    });

    it('should handle large chicken counts', async () => {
      const result = await calculate('chicken-feed-daily', {
        chickenCount: 1000,
        feedKgPerChickenPerDay: 0.15
      });

      expect(result.resultValue).toEqual(150);
      expect(result.unitLabel).toEqual('kg/day');
    });

    it('should throw error for invalid chicken count', async () => {
      await expect(calculate('chicken-feed-daily', {
        chickenCount: -5,
        feedKgPerChickenPerDay: 0.12
      })).rejects.toThrow(/chicken count.*positive integer/i);

      await expect(calculate('chicken-feed-daily', {
        chickenCount: 5.5,
        feedKgPerChickenPerDay: 0.12
      })).rejects.toThrow(/chicken count.*positive integer/i);

      await expect(calculate('chicken-feed-daily', {
        chickenCount: 'invalid',
        feedKgPerChickenPerDay: 0.12
      })).rejects.toThrow(/chicken count.*positive integer/i);
    });

    it('should throw error for invalid feed amount', async () => {
      await expect(calculate('chicken-feed-daily', {
        chickenCount: 50,
        feedKgPerChickenPerDay: 0
      })).rejects.toThrow(/feed.*positive/i);

      await expect(calculate('chicken-feed-daily', {
        chickenCount: 50,
        feedKgPerChickenPerDay: -0.1
      })).rejects.toThrow(/feed.*positive/i);
    });
  });

  describe('livestock-medicine-dosage', () => {
    const validInputWithoutConcentration: CalculationInput = {
      weightKg: 25,
      doseMgPerKg: 10
    };

    const validInputWithConcentration: CalculationInput = {
      weightKg: 25,
      doseMgPerKg: 10,
      concentrationMgPerMl: 50
    };

    it('should calculate medicine dosage without concentration', async () => {
      const result = await calculate('livestock-medicine-dosage', validInputWithoutConcentration);

      expect(result.resultValue).toEqual(250);
      expect(result.unitLabel).toEqual('mg');
      expect(result.additionalResults).toBeUndefined();
    });

    it('should calculate medicine dosage with concentration', async () => {
      const result = await calculate('livestock-medicine-dosage', validInputWithConcentration);

      expect(result.resultValue).toEqual(250);
      expect(result.unitLabel).toEqual('mg');
      expect(result.additionalResults).toBeDefined();
      expect(result.additionalResults!['volumeMl']).toEqual(5);
    });

    it('should handle high precision calculations', async () => {
      const result = await calculate('livestock-medicine-dosage', {
        weightKg: 22.5,
        doseMgPerKg: 7.5,
        concentrationMgPerMl: 25
      });

      expect(result.resultValue).toEqual(168.75);
      expect(result.additionalResults!['volumeMl']).toEqual(6.75);
    });

    it('should throw error for invalid weight', async () => {
      await expect(calculate('livestock-medicine-dosage', {
        weightKg: -5,
        doseMgPerKg: 10
      })).rejects.toThrow(/weight.*positive/i);

      await expect(calculate('livestock-medicine-dosage', {
        weightKg: 'invalid',
        doseMgPerKg: 10
      })).rejects.toThrow(/weight.*positive/i);
    });

    it('should throw error for invalid dose', async () => {
      await expect(calculate('livestock-medicine-dosage', {
        weightKg: 25,
        doseMgPerKg: 0
      })).rejects.toThrow(/dose.*positive/i);
    });

    it('should throw error for invalid concentration', async () => {
      await expect(calculate('livestock-medicine-dosage', {
        weightKg: 25,
        doseMgPerKg: 10,
        concentrationMgPerMl: -5
      })).rejects.toThrow(/concentration.*positive/i);

      await expect(calculate('livestock-medicine-dosage', {
        weightKg: 25,
        doseMgPerKg: 10,
        concentrationMgPerMl: 0
      })).rejects.toThrow(/concentration.*positive/i);
    });
  });

  describe('harvest-estimation', () => {
    const validInput: CalculationInput = {
      areaHa: 3.0,
      yieldTonPerHa: 5.5
    };

    it('should calculate harvest estimation correctly', async () => {
      const result = await calculate('harvest-estimation', validInput);

      expect(result.resultValue).toEqual(16.5);
      expect(result.unitLabel).toEqual('ton');
      expect(result.additionalResults).toBeUndefined();
    });

    it('should handle small areas and yields', async () => {
      const result = await calculate('harvest-estimation', {
        areaHa: 0.5,
        yieldTonPerHa: 2.5
      });

      expect(result.resultValue).toEqual(1.25);
      expect(result.unitLabel).toEqual('ton');
    });

    it('should throw error for invalid area', async () => {
      await expect(calculate('harvest-estimation', {
        areaHa: 0,
        yieldTonPerHa: 5
      })).rejects.toThrow(/area.*positive/i);
    });

    it('should throw error for invalid yield', async () => {
      await expect(calculate('harvest-estimation', {
        areaHa: 3,
        yieldTonPerHa: -1
      })).rejects.toThrow(/yield.*positive/i);
    });
  });

  describe('planting-cost', () => {
    const validInput: CalculationInput = {
      areaHa: 2.0,
      costRpPerHa: 1_500_000
    };

    it('should calculate planting cost correctly', async () => {
      const result = await calculate('planting-cost', validInput);

      expect(result.resultValue).toEqual(3_000_000);
      expect(result.unitLabel).toEqual('Rp');
      expect(result.additionalResults).toBeUndefined();
    });

    it('should handle large cost calculations', async () => {
      const result = await calculate('planting-cost', {
        areaHa: 10,
        costRpPerHa: 2_000_000
      });

      expect(result.resultValue).toEqual(20_000_000);
      expect(result.unitLabel).toEqual('Rp');
    });

    it('should throw error for invalid area', async () => {
      await expect(calculate('planting-cost', {
        areaHa: -2,
        costRpPerHa: 1_500_000
      })).rejects.toThrow(/area.*positive/i);
    });

    it('should throw error for invalid cost', async () => {
      await expect(calculate('planting-cost', {
        areaHa: 2,
        costRpPerHa: 0
      })).rejects.toThrow(/cost.*positive/i);
    });
  });

  describe('error handling', () => {
    it('should throw error for unknown calculator slug', async () => {
      await expect(calculate('unknown-calculator', {
        someInput: 10
      })).rejects.toThrow(/unknown calculator slug/i);
    });

    it('should throw error for empty slug', async () => {
      await expect(calculate('', {
        someInput: 10
      })).rejects.toThrow(/slug.*required/i);
    });

    it('should throw error for null slug', async () => {
      await expect(calculate(null as any, {
        someInput: 10
      })).rejects.toThrow(/slug.*required/i);
    });

    it('should throw error for invalid input', async () => {
      await expect(calculate('fertilizer-requirement', null as any))
        .rejects.toThrow(/valid input.*required/i);

      await expect(calculate('fertilizer-requirement', 'invalid' as any))
        .rejects.toThrow(/valid input.*required/i);
    });

    it('should throw error for undefined input', async () => {
      await expect(calculate('fertilizer-requirement', undefined as any))
        .rejects.toThrow(/valid input.*required/i);
    });
  });

  describe('edge cases', () => {
    it('should handle very small numbers', async () => {
      const result = await calculate('fertilizer-requirement', {
        areaHa: 0.001,
        doseKgPerHa: 0.1
      });

      expect(result.resultValue).toEqual(0.0001);
      expect(result.unitLabel).toEqual('kg');
    });

    it('should handle very large numbers', async () => {
      const result = await calculate('planting-cost', {
        areaHa: 1000,
        costRpPerHa: 10_000_000
      });

      expect(result.resultValue).toEqual(10_000_000_000);
      expect(result.unitLabel).toEqual('Rp');
    });

    it('should handle precise decimal calculations', async () => {
      const result = await calculate('livestock-medicine-dosage', {
        weightKg: 33.33,
        doseMgPerKg: 0.75,
        concentrationMgPerMl: 12.5
      });

      expect(result.resultValue).toEqual(24.9975);
      expect(result.additionalResults!['volumeMl']).toBeCloseTo(1.9998, 4);
    });
  });
});