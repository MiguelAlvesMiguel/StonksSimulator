import { readable } from 'svelte/store';
import type { IndexData } from '$lib/types';

// Import CSV data
import sp500Data from '../data/sp500.csv?raw';
import dowData from '../data/dowjones.csv?raw';
import nasdaqData from '../data/nasdaq.csv?raw';

// Parse CSV data
function parseCSV(csvData: string): IndexData[] {
    return csvData
        .trim()
        .split('\n')
        .slice(1) // Skip header
        .map(line => {
            const [date, value] = line.split(',');
            return {
                date,
                value: parseFloat(value)
            };
        });
}

// USD to EUR conversion rate
const USD_TO_EUR = 0.92;

// Convert values from USD to EUR
function convertToEUR(data: IndexData[]): IndexData[] {
    return data.map(item => ({
        date: item.date,
        value: item.value * USD_TO_EUR
    }));
}

// Parse and convert data
const sp500 = convertToEUR(parseCSV(sp500Data));
const dow = convertToEUR(parseCSV(dowData));
const nasdaq = convertToEUR(parseCSV(nasdaqData));

// Create stores
export const historical2024Data = readable({
    SP500: sp500,
    DOW: dow,
    NASDAQ: nasdaq
});

// Mock data for 2025 (using the same data for now)
export const historical2025Data = readable({
    SP500: sp500,
    DOW: dow,
    NASDAQ: nasdaq
}); 