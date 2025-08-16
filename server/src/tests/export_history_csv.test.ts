import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, calculatorsTable, resultsTable } from '../db/schema';
import { type ExportHistoryInput } from '../schema';
import { exportHistoryCSV } from '../handlers/export_history_csv';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

const testCalculator = {
  name: 'Fertilizer Requirement',
  slug: 'fertilizer-requirement',
  description: 'Calculate fertilizer requirements',
  category: 'farming' as const,
  unitLabel: 'kg',
  formulaKey: 'fertilizer_requirement'
};

const testCalculator2 = {
  name: 'Chicken Feed Daily',
  slug: 'chicken-feed-daily',
  description: 'Calculate daily chicken feed',
  category: 'livestock' as const,
  unitLabel: 'kg/day',
  formulaKey: 'chicken_feed_daily'
};

describe('exportHistoryCSV', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should export empty CSV with header for user with no history', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const input: ExportHistoryInput = {
      userId: user.id
    };

    const result = await exportHistoryCSV(input);

    expect(result).toEqual('Date,Calculator,Input Summary,Result,Unit\n');
  });

  it('should export single calculation result as CSV', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create calculator
    const [calculator] = await db.insert(calculatorsTable)
      .values(testCalculator)
      .returning()
      .execute();

    // Create calculation result
    const testDate = new Date('2024-01-15T10:30:00Z');
    await db.insert(resultsTable)
      .values({
        userId: user.id,
        calculatorId: calculator.id,
        inputJson: { areaHa: 2.5, doseKgPerHa: 100 },
        resultValue: '250.0000',
        unitLabel: 'kg',
        createdAt: testDate
      })
      .execute();

    const input: ExportHistoryInput = {
      userId: user.id
    };

    const result = await exportHistoryCSV(input);

    const lines = result.split('\n');
    expect(lines[0]).toEqual('Date,Calculator,Input Summary,Result,Unit');
    expect(lines[1]).toEqual('2024-01-15,Fertilizer Requirement,Area Ha: 2.5 | Dose Kg Per Ha: 100,250,kg');
    expect(lines[2]).toEqual(''); // Empty line at end
  });

  it('should export multiple calculation results ordered by date desc', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create calculators
    const [calculator1] = await db.insert(calculatorsTable)
      .values(testCalculator)
      .returning()
      .execute();

    const [calculator2] = await db.insert(calculatorsTable)
      .values(testCalculator2)
      .returning()
      .execute();

    // Create calculation results with different dates
    const olderDate = new Date('2024-01-10T08:00:00Z');
    const newerDate = new Date('2024-01-20T14:30:00Z');

    await db.insert(resultsTable)
      .values([
        {
          userId: user.id,
          calculatorId: calculator1.id,
          inputJson: { areaHa: 1.0, doseKgPerHa: 50 },
          resultValue: '50.0000',
          unitLabel: 'kg',
          createdAt: olderDate
        },
        {
          userId: user.id,
          calculatorId: calculator2.id,
          inputJson: { chickenCount: 100, feedKgPerChickenPerDay: 0.12 },
          resultValue: '12.0000',
          unitLabel: 'kg/day',
          createdAt: newerDate
        }
      ])
      .execute();

    const input: ExportHistoryInput = {
      userId: user.id
    };

    const result = await exportHistoryCSV(input);

    const lines = result.split('\n');
    expect(lines[0]).toEqual('Date,Calculator,Input Summary,Result,Unit');
    // Newer date should come first (desc order)
    expect(lines[1]).toEqual('2024-01-20,Chicken Feed Daily,Chicken Count: 100 | Feed Kg Per Chicken Per Day: 0.12,12,kg/day');
    expect(lines[2]).toEqual('2024-01-10,Fertilizer Requirement,Area Ha: 1 | Dose Kg Per Ha: 50,50,kg');
  });

  it('should handle CSV escaping for values with commas', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create calculator with comma in name
    const calculatorWithComma = {
      ...testCalculator,
      name: 'Fertilizer, Pesticide Calculator',
      unitLabel: 'kg, liters'
    };

    const [calculator] = await db.insert(calculatorsTable)
      .values(calculatorWithComma)
      .returning()
      .execute();

    // Create result
    await db.insert(resultsTable)
      .values({
        userId: user.id,
        calculatorId: calculator.id,
        inputJson: { note: 'Area is 2,5 hectares' },
        resultValue: '125.5000',
        unitLabel: 'kg, liters',
        createdAt: new Date('2024-01-15T10:30:00Z')
      })
      .execute();

    const input: ExportHistoryInput = {
      userId: user.id
    };

    const result = await exportHistoryCSV(input);

    const lines = result.split('\n');
    // Values with commas should be escaped with quotes
    expect(lines[1]).toContain('"Fertilizer, Pesticide Calculator"');
    expect(lines[1]).toContain('"kg, liters"');
    expect(lines[1]).toContain('"Note: Area is 2,5 hectares"');
  });

  it('should handle CSV escaping for values with quotes', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create calculator
    const [calculator] = await db.insert(calculatorsTable)
      .values(testCalculator)
      .returning()
      .execute();

    // Create result with quotes in input
    await db.insert(resultsTable)
      .values({
        userId: user.id,
        calculatorId: calculator.id,
        inputJson: { note: 'Field "A" section' },
        resultValue: '100.0000',
        unitLabel: 'kg',
        createdAt: new Date('2024-01-15T10:30:00Z')
      })
      .execute();

    const input: ExportHistoryInput = {
      userId: user.id
    };

    const result = await exportHistoryCSV(input);

    const lines = result.split('\n');
    // Quotes should be escaped as double quotes
    expect(lines[1]).toContain('"Note: Field ""A"" section"');
  });

  it('should format numeric precision correctly', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create calculator
    const [calculator] = await db.insert(calculatorsTable)
      .values(testCalculator)
      .returning()
      .execute();

    // Create result with decimal input values
    await db.insert(resultsTable)
      .values({
        userId: user.id,
        calculatorId: calculator.id,
        inputJson: { areaHa: 2.5555, doseKgPerHa: 100.12345 },
        resultValue: '255.6790',
        unitLabel: 'kg',
        createdAt: new Date('2024-01-15T10:30:00Z')
      })
      .execute();

    const input: ExportHistoryInput = {
      userId: user.id
    };

    const result = await exportHistoryCSV(input);

    const lines = result.split('\n');
    // Should format numbers with reasonable precision
    expect(lines[1]).toContain('Area Ha: 2.5555 | Dose Kg Per Ha: 100.1235');
    expect(lines[1]).toContain('255.679'); // Result value should be converted from string
  });

  it('should handle empty or invalid input JSON gracefully', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create calculator
    const [calculator] = await db.insert(calculatorsTable)
      .values(testCalculator)
      .returning()
      .execute();

    // Create result with empty input JSON
    await db.insert(resultsTable)
      .values({
        userId: user.id,
        calculatorId: calculator.id,
        inputJson: {},
        resultValue: '0.0000',
        unitLabel: 'kg',
        createdAt: new Date('2024-01-15T10:30:00Z')
      })
      .execute();

    const input: ExportHistoryInput = {
      userId: user.id
    };

    const result = await exportHistoryCSV(input);

    const lines = result.split('\n');
    expect(lines[1]).toContain('No input data');
  });

  it('should only export results for specified user', async () => {
    // Create two users
    const [user1] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password456'
      })
      .returning()
      .execute();

    // Create calculator
    const [calculator] = await db.insert(calculatorsTable)
      .values(testCalculator)
      .returning()
      .execute();

    // Create results for both users
    await db.insert(resultsTable)
      .values([
        {
          userId: user1.id,
          calculatorId: calculator.id,
          inputJson: { areaHa: 1.0 },
          resultValue: '100.0000',
          unitLabel: 'kg',
          createdAt: new Date('2024-01-15T10:30:00Z')
        },
        {
          userId: user2.id,
          calculatorId: calculator.id,
          inputJson: { areaHa: 2.0 },
          resultValue: '200.0000',
          unitLabel: 'kg',
          createdAt: new Date('2024-01-16T10:30:00Z')
        }
      ])
      .execute();

    const input: ExportHistoryInput = {
      userId: user1.id
    };

    const result = await exportHistoryCSV(input);

    const lines = result.split('\n');
    expect(lines).toHaveLength(3); // Header + 1 result + empty line
    expect(lines[1]).toContain('Area Ha: 1');
    expect(lines[1]).not.toContain('Area Ha: 2');
  });
});