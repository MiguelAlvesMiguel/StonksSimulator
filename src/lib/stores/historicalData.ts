import type { IndexData } from '$lib/types';
import sp500CsvData from '$lib/data/sp500.csv?raw';
import dowJonesCsvData from '$lib/data/dowjones.csv?raw';

const USD_TO_EUR = 0.92;

function parseCsvData(csvContent: string): IndexData[] {
    const lines = csvContent.trim().split('\n');
    // Skip header row
    return lines.slice(1).map(line => {
        const [date, valueStr] = line.split(',');
        return {
            date,
            value: parseFloat(valueStr)
        };
    });
}

const allSp500Data = parseCsvData(sp500CsvData);
const allDowData = parseCsvData(dowJonesCsvData);

// Convert USD to EUR
const convertToEur = (data: IndexData[]): IndexData[] => {
    return data.map(entry => ({
        date: entry.date,
        value: entry.value * USD_TO_EUR
    }));
};

// Filter data by year
const filterByYear = (data: IndexData[], year: string): IndexData[] => {
    return data.filter(entry => entry.date.startsWith(year));
};

// Export historical data in EUR for both years
export const historical2024Data = {
    SP500: convertToEur(filterByYear(allSp500Data, '2024')),
    DOW: convertToEur(filterByYear(allDowData, '2024'))
};

export const historical2025Data = {
    SP500: convertToEur(filterByYear(allSp500Data, '2025')),
    DOW: convertToEur(filterByYear(allDowData, '2025'))
}; 