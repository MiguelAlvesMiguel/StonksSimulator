import { writable } from 'svelte/store';
import type { IndexData } from '$lib/types';
import sp500_2024 from '../data/sp500.csv?raw';
import dow_2024 from '../data/dowjones.csv?raw';
import nasdaq_2024 from '../data/nasdaq.csv?raw';
import nanc_2024 from '../data/nanc.csv?raw';
import nvda_2024 from '../data/nvda.csv?raw';

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

// Create writable stores for 2024 data
export const historical2024Data = writable({
    SP500: parseCSV(sp500_2024),
    DOW: parseCSV(dow_2024),
    NASDAQ: parseCSV(nasdaq_2024),
    NANC: parseCSV(nanc_2024),
    NVDA: parseCSV(nvda_2024)
});

// Mock data for 2025 (first 15 days with realistic growth)
const generateMockData = (startValue: number, days: number = 15, volatility: number = 0.02): IndexData[] => {
    const data: IndexData[] = [];
    let currentValue = startValue;
    
    for (let i = 0; i < days; i++) {
        // Generate a random daily return between -volatility and +volatility
        const dailyReturn = (Math.random() * 2 - 1) * volatility;
        // Apply the daily return to the current value
        currentValue = currentValue * (1 + dailyReturn);
        
        // Format the date
        const date = new Date(2025, 0, i + 1);
        const dateStr = date.toISOString().split('T')[0];
        
        data.push({
            date: dateStr,
            value: currentValue
        });
    }
    
    return data;
};

// Create writable store for 2025 data
export const historical2025Data = writable({
    SP500: generateMockData(4800, 15),  // Starting from ~4800
    DOW: generateMockData(37500, 15),   // Starting from ~37500
    NASDAQ: generateMockData(15000, 15), // Starting from ~15000
    NANC: generateMockData(38.58, 15),   // Starting from last 2024 value
    NVDA: generateMockData(134.29, 15)   // Starting from last 2024 value
}); 