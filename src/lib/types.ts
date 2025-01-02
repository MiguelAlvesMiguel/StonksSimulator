export type IndexType = 'SP500' | 'DOW';

export interface IndexData {
    date: string;
    value: number;
}

export interface IndexHistory {
    SP500: IndexData[];
    DOW: IndexData[];
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
    sellTax: number; // 0.2% transaction tax in Portugal
    capitalGainsTax: number; // 28% on profits in Portugal
    netProfit: number;
} 