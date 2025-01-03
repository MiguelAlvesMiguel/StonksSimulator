export type IndexType = 'SP500' | 'DOW';

export interface IndexData {
    date: string;
    value: number;
}

export interface MonthlyAverage {
    month: string;
    SP500: number;
    DOW: number;
}

export interface IndexHistory {
    SP500: IndexData[];
    DOW: IndexData[];
    monthlyAverages: MonthlyAverage[];
}

export interface InvestmentSimulation {
    indexType: IndexType;
    investmentAmount: number;
    startDate: string;
    endDate: string;
    initialPrice: number;
    finalPrice: number;
    shares: number;
    finalValue: number;
    profitLoss: number;
    profitLossPercentage: number;
    buyTax: number;  // 0.2% transaction tax in Portugal
    sellTax: number; // 0.2% transaction tax on profits in Portugal
    capitalGainsTax: number; // 28% on profits in Portugal
    netProfit: number;
}

export interface HistoricalData {
    SP500: IndexData[];
    DOW: IndexData[];
    NASDAQ: IndexData[];
} 