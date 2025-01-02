export interface Investment {
    id: string;
    stockName: string;
    ticker: string;
    purchaseDate: string;
    initialPrice: number;
    investmentAmount: number;
    currentPrice: number;
    shares?: number;
    currentValue?: number;
    profitLoss?: number;
    profitLossPercentage?: number;
    estimatedTax?: number;
}

export interface Summary {
    totalInvestment: number;
    totalCurrentValue: number;
    totalProfitLoss: number;
    totalProfitLossPercentage: number;
    totalEstimatedTax: number;
} 