import { readable, writable } from 'svelte/store';
import type { HistoricalData } from '$lib/types';

// Import CSV data
import sp500Data from '../data/sp500.csv?raw';
import dowData from '../data/dowjones.csv?raw';
import nasdaqData from '../data/nasdaq.csv?raw';

// Parse CSV data
function parseCSV(csvData: string) {
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
        })
        .reverse(); // Reverse here to get chronological order (oldest to newest)
}

// USD to EUR conversion rate
const USD_TO_EUR = 0.92;

// Convert values from USD to EUR
function convertToEUR(data: any[]) {
    return data.map(item => ({
        date: item.date,
        value: item.value * USD_TO_EUR
    }));
}

// Parse and convert 2024 data
const sp500 = convertToEUR(parseCSV(sp500Data));
const dow = convertToEUR(parseCSV(dowData));
const nasdaq = convertToEUR(parseCSV(nasdaqData));

// Create 2024 store
export const historical2024Data = readable<HistoricalData>({
    SP500: sp500,
    DOW: dow,
    NASDAQ: nasdaq
});

// Mock data for 2025 (first 15 days) - Values already in EUR
// Using historical average growth of ~10% per year, so ~0.8% per month
// For 15 days, that's about 0.4% growth, starting from the last 2024 values
export const historical2025Data = writable<HistoricalData>({
    SP500: [
        { date: '2025-01-01', value: 5881.63 },  // Starting from last 2024 value
        { date: '2025-01-02', value: 5882.20 },
        { date: '2025-01-03', value: 5882.75 },
        { date: '2025-01-04', value: 5883.30 },
        { date: '2025-01-05', value: 5884.45 },
        { date: '2025-01-06', value: 5885.80 },
        { date: '2025-01-07', value: 5886.15 },
        { date: '2025-01-08', value: 5888.95 },
        { date: '2025-01-09', value: 5890.18 },
        { date: '2025-01-10', value: 5895.42 },
        { date: '2025-01-11', value: 5900.40 },
        { date: '2025-01-12', value: 5905.80 },
        { date: '2025-01-13', value: 5910.30 },
        { date: '2025-01-14', value: 5915.50 },
        { date: '2025-01-15', value: 5920.00 }
    ],
    DOW: [
        { date: '2025-01-01', value: 42544.22 },  // Starting from last 2024 value
        { date: '2025-01-02', value: 42550.25 },
        { date: '2025-01-03', value: 42560.80 },
        { date: '2025-01-04', value: 42580.35 },
        { date: '2025-01-05', value: 42600.90 },
        { date: '2025-01-06', value: 42620.65 },
        { date: '2025-01-07', value: 42640.20 },
        { date: '2025-01-08', value: 42660.45 },
        { date: '2025-01-09', value: 42680.30 },
        { date: '2025-01-10', value: 42700.75 },
        { date: '2025-01-11', value: 42720.40 },
        { date: '2025-01-12', value: 42740.80 },
        { date: '2025-01-13', value: 42760.30 },
        { date: '2025-01-14', value: 42780.50 },
        { date: '2025-01-15', value: 42800.00 }
    ],
    NASDAQ: [
        { date: '2025-01-01', value: 21226.50 },  // Starting from last 2024 value
        { date: '2025-01-02', value: 21228.20 },
        { date: '2025-01-03', value: 21230.55 },
        { date: '2025-01-04', value: 21235.90 },
        { date: '2025-01-05', value: 21240.25 },
        { date: '2025-01-06', value: 21250.60 },
        { date: '2025-01-07', value: 21260.85 },
        { date: '2025-01-08', value: 21270.30 },
        { date: '2025-01-09', value: 21280.45 },
        { date: '2025-01-10', value: 21300.80 },
        { date: '2025-01-11', value: 21330.40 },
        { date: '2025-01-12', value: 21360.80 },
        { date: '2025-01-13', value: 21390.30 },
        { date: '2025-01-14', value: 21420.50 },
        { date: '2025-01-15', value: 21450.00 }
    ]
}); 