import { db } from '../db';
import { resultsTable, calculatorsTable } from '../db/schema';
import { type ExportHistoryInput } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function exportHistoryCSV(input: ExportHistoryInput): Promise<string> {
  try {
    // Query user's calculation history with calculator details
    const results = await db.select({
      date: resultsTable.createdAt,
      calculatorName: calculatorsTable.name,
      inputJson: resultsTable.inputJson,
      resultValue: resultsTable.resultValue,
      unitLabel: resultsTable.unitLabel
    })
      .from(resultsTable)
      .innerJoin(calculatorsTable, eq(resultsTable.calculatorId, calculatorsTable.id))
      .where(eq(resultsTable.userId, input.userId))
      .orderBy(desc(resultsTable.createdAt))
      .execute();

    // CSV header
    const csvHeader = "Date,Calculator,Input Summary,Result,Unit\n";

    // Convert results to CSV rows
    const csvRows = results.map(result => {
      // Format date as YYYY-MM-DD
      const dateStr = result.date.toISOString().split('T')[0];

      // Create input summary from JSON
      const inputSummary = formatInputSummary(result.inputJson);

      // Convert numeric result value back to number
      const resultValue = parseFloat(result.resultValue);

      // Escape CSV values (handle commas and quotes)
      const escapedCalculatorName = escapeCSVValue(result.calculatorName);
      const escapedInputSummary = escapeCSVValue(inputSummary);
      const escapedUnitLabel = escapeCSVValue(result.unitLabel);

      return `${dateStr},${escapedCalculatorName},${escapedInputSummary},${resultValue},${escapedUnitLabel}`;
    });

    // Join with newlines and add trailing newline if there are results
    if (csvRows.length > 0) {
      return csvHeader + csvRows.join('\n') + '\n';
    } else {
      return csvHeader;
    }
  } catch (error) {
    console.error('CSV export failed:', error);
    throw error;
  }
}

// Helper function to format input JSON as readable summary
function formatInputSummary(inputJson: any): string {
  if (!inputJson || typeof inputJson !== 'object') {
    return 'No input data';
  }

  const entries = Object.entries(inputJson);
  if (entries.length === 0) {
    return 'No input data';
  }

  const summaryParts: string[] = [];
  
  for (const [key, value] of entries) {
    // Convert camelCase to readable format
    const readableKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    
    // Format the value based on its type
    let formattedValue = value;
    if (typeof value === 'number') {
      // Keep reasonable precision for display
      formattedValue = Number(value.toFixed(4)).toString();
    }
    
    summaryParts.push(`${readableKey}: ${formattedValue}`);
  }

  return summaryParts.join(' | ');
}

// Helper function to escape CSV values (handle commas, quotes, newlines)
function escapeCSVValue(value: string): string {
  if (!value) return '';
  
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
}