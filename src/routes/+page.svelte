<script lang="ts">
    import { historical2024Data, historical2025Data } from '$lib/stores/historicalData';
    import type { IndexData } from '$lib/types';
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { Chart, type ChartConfiguration } from 'chart.js/auto';
    import type { ChartEvent } from 'chart.js';

    let selectedYear = '2024';
    let investments = {
        sp500: 10000,
        dow: 10000,
        nasdaq: 10000
    };
    let chart: Chart | null = null;
    let viewMode: 'SP500' | 'DOW' | 'NASDAQ' | 'COMBINED' = 'COMBINED';

    let editingIndex: string | null = null;
    let tempInvestmentAmount = 0;
    let inputError: string | null = null;

    function startEditing(index: string) {
        editingIndex = index;
        tempInvestmentAmount = investments[index as keyof typeof investments];
        inputError = null;
    }

    function validateInvestment(amount: number): boolean {
        if (isNaN(amount) || amount < 0) {
            inputError = "O valor do investimento deve ser um número positivo";
            return false;
        }
        if (amount > 1000000000) {
            inputError = "O valor do investimento não pode exceder 1 bilhão";
            return false;
        }
        inputError = null;
        return true;
    }

    function saveEdit() {
        if (editingIndex && validateInvestment(tempInvestmentAmount)) {
            investments[editingIndex as keyof typeof investments] = tempInvestmentAmount;
            editingIndex = null;
            updateChart();
        }
    }

    function cancelEdit() {
        editingIndex = null;
        inputError = null;
    }

    function deleteInvestment(index: string) {
        if (index === 'sp500' || index === 'dow' || index === 'nasdaq') {
            investments[index] = 0;
            updateChart();
        }
    }

    $: historicalData = selectedYear === '2024' ? $historical2024Data : $historical2025Data;
    $: sp500Data = [...historicalData.SP500];
    $: dowData = [...historicalData.DOW];
    $: nasdaqData = [...historicalData.NASDAQ];
    
    // Portuguese tax rates and fees
    const TRANSACTION_TAX = 0.002; // 0.2% Imposto do Selo
    const BASE_CAPITAL_GAINS_TAX = 0.28; // 28% base rate sobre mais-valias
    const BROKER_FEE = 0.0025; // 0.25% comissão do broker
    const CUSTODY_FEE_MONTHLY = 2; // €2/mês taxa de custódia
    const MARKET_ACCESS_FEE = 0.0005; // 0.05% taxa de acesso ao mercado
    const EXCHANGE_FEE = 0.0002; // 0.02% taxa de bolsa

    // Tax incentives based on holding period
    function getEffectiveTaxRate(years: number): number {
        if (years > 8) return BASE_CAPITAL_GAINS_TAX * 0.7; // 30% exempt = 19.6% effective rate
        if (years > 5) return BASE_CAPITAL_GAINS_TAX * 0.8; // 20% exempt = 22.4% effective rate
        if (years > 2) return BASE_CAPITAL_GAINS_TAX * 0.9; // 10% exempt = 25.2% effective rate
        return BASE_CAPITAL_GAINS_TAX; // No exemption = 28% rate
    }

    // Calculate holding period in years
    $: holdingPeriodYears = monthsDiff / 12;
    $: effectiveTaxRate = getEffectiveTaxRate(holdingPeriodYears);

    // Update capital gains tax calculations with effective rate
    $: sp500CapitalGainsTax = sp500GrossProfit > 0 ? sp500GrossProfit * effectiveTaxRate : 0;
    $: dowCapitalGainsTax = dowGrossProfit > 0 ? dowGrossProfit * effectiveTaxRate : 0;
    $: nasdaqCapitalGainsTax = nasdaqGrossProfit > 0 ? nasdaqGrossProfit * effectiveTaxRate : 0;

    // Update all investment amount calculations to use the new investments object
    $: investmentAmount = viewMode === 'SP500' ? investments.sp500 : 
                         viewMode === 'DOW' ? investments.dow :
                         viewMode === 'NASDAQ' ? investments.nasdaq :
                         Math.max(...Object.values(investments));

    // Calculate total investment based on view mode
    $: totalInvestment = viewMode === 'COMBINED' ? 
        Object.values(investments).reduce((a, b) => a + b, 0) :
        viewMode === 'SP500' ? investments.sp500 :
        viewMode === 'DOW' ? investments.dow :
        investments.nasdaq;

    // Calculate metrics for S&P 500
    $: sp500Shares = investments.sp500 / sp500Data[0].value;
    $: sp500FinalValue = sp500Shares * sp500Data[sp500Data.length - 1].value;
    $: sp500GrossProfit = sp500FinalValue - investments.sp500;
    
    // S&P 500 Buy fees
    $: sp500BuyTransactionTax = investments.sp500 * TRANSACTION_TAX;
    $: sp500BuyBrokerFee = investments.sp500 * BROKER_FEE;
    $: sp500BuyMarketFee = investments.sp500 * MARKET_ACCESS_FEE;
    $: sp500BuyExchangeFee = investments.sp500 * EXCHANGE_FEE;
    $: sp500TotalBuyFees = sp500BuyTransactionTax + sp500BuyBrokerFee + sp500BuyMarketFee + sp500BuyExchangeFee;

    // S&P 500 Sell fees
    $: sp500SellTransactionTax = sp500FinalValue * TRANSACTION_TAX;
    $: sp500SellBrokerFee = sp500FinalValue * BROKER_FEE;
    $: sp500SellMarketFee = sp500FinalValue * MARKET_ACCESS_FEE;
    $: sp500SellExchangeFee = sp500FinalValue * EXCHANGE_FEE;
    $: sp500TotalSellFees = sp500SellTransactionTax + sp500SellBrokerFee + sp500SellMarketFee + sp500SellExchangeFee;

    // S&P 500 Custody fees (monthly)
    $: monthsDiff = Math.ceil((new Date(sp500Data[sp500Data.length - 1].date).getTime() - new Date(sp500Data[0].date).getTime()) / (1000 * 60 * 60 * 24 * 30));
    $: sp500CustodyFees = CUSTODY_FEE_MONTHLY * monthsDiff;

    $: sp500TotalFees = sp500TotalBuyFees + sp500TotalSellFees + sp500CustodyFees;
    $: sp500TotalTaxes = sp500CapitalGainsTax;
    $: sp500TotalCosts = sp500TotalFees + sp500TotalTaxes;
    $: sp500NetProfit = sp500GrossProfit - sp500TotalCosts;

    // Calculate metrics for Dow Jones (similar structure)
    $: dowShares = investments.dow / dowData[0].value;
    $: dowFinalValue = dowShares * dowData[dowData.length - 1].value;
    $: dowGrossProfit = dowFinalValue - investments.dow;
    
    // Dow Jones Buy fees
    $: dowBuyTransactionTax = investments.dow * TRANSACTION_TAX;
    $: dowBuyBrokerFee = investments.dow * BROKER_FEE;
    $: dowBuyMarketFee = investments.dow * MARKET_ACCESS_FEE;
    $: dowBuyExchangeFee = investments.dow * EXCHANGE_FEE;
    $: dowTotalBuyFees = dowBuyTransactionTax + dowBuyBrokerFee + dowBuyMarketFee + dowBuyExchangeFee;

    // Dow Jones Sell fees
    $: dowSellTransactionTax = dowFinalValue * TRANSACTION_TAX;
    $: dowSellBrokerFee = dowFinalValue * BROKER_FEE;
    $: dowSellMarketFee = dowFinalValue * MARKET_ACCESS_FEE;
    $: dowSellExchangeFee = dowFinalValue * EXCHANGE_FEE;
    $: dowTotalSellFees = dowSellTransactionTax + dowSellBrokerFee + dowSellMarketFee + dowSellExchangeFee;

    // Dow Jones Custody fees (monthly)
    $: dowCustodyFees = CUSTODY_FEE_MONTHLY * monthsDiff;

    $: dowTotalFees = dowTotalBuyFees + dowTotalSellFees + dowCustodyFees;
    $: dowTotalTaxes = dowCapitalGainsTax;
    $: dowTotalCosts = dowTotalFees + dowTotalTaxes;
    $: dowNetProfit = dowGrossProfit - dowTotalCosts;

    // Calculate metrics for NASDAQ
    $: nasdaqShares = investments.nasdaq / nasdaqData[0].value;
    $: nasdaqFinalValue = nasdaqShares * nasdaqData[nasdaqData.length - 1].value;
    $: nasdaqGrossProfit = nasdaqFinalValue - investments.nasdaq;
    
    // NASDAQ Buy fees
    $: nasdaqBuyTransactionTax = investments.nasdaq * TRANSACTION_TAX;
    $: nasdaqBuyBrokerFee = investments.nasdaq * BROKER_FEE;
    $: nasdaqBuyMarketFee = investments.nasdaq * MARKET_ACCESS_FEE;
    $: nasdaqBuyExchangeFee = investments.nasdaq * EXCHANGE_FEE;
    $: nasdaqTotalBuyFees = nasdaqBuyTransactionTax + nasdaqBuyBrokerFee + nasdaqBuyMarketFee + nasdaqBuyExchangeFee;

    // NASDAQ Sell fees
    $: nasdaqSellTransactionTax = nasdaqFinalValue * TRANSACTION_TAX;
    $: nasdaqSellBrokerFee = nasdaqFinalValue * BROKER_FEE;
    $: nasdaqSellMarketFee = nasdaqFinalValue * MARKET_ACCESS_FEE;
    $: nasdaqSellExchangeFee = nasdaqFinalValue * EXCHANGE_FEE;
    $: nasdaqTotalSellFees = nasdaqSellTransactionTax + nasdaqSellBrokerFee + nasdaqSellMarketFee + nasdaqSellExchangeFee;

    // NASDAQ Custody fees (monthly)
    $: nasdaqCustodyFees = CUSTODY_FEE_MONTHLY * monthsDiff;

    $: nasdaqTotalFees = nasdaqTotalBuyFees + nasdaqTotalSellFees + nasdaqCustodyFees;
    $: nasdaqTotalTaxes = nasdaqCapitalGainsTax;
    $: nasdaqTotalCosts = nasdaqTotalFees + nasdaqTotalTaxes;
    $: nasdaqNetProfit = nasdaqGrossProfit - nasdaqTotalCosts;

    // Calculate combined portfolio metrics
    $: totalFinalValue = sp500FinalValue + dowFinalValue + nasdaqFinalValue;
    $: totalGrossProfit = sp500GrossProfit + dowGrossProfit + nasdaqGrossProfit;
    $: totalFees = sp500TotalFees + dowTotalFees + nasdaqTotalFees;
    $: totalTaxes = sp500TotalTaxes + dowTotalTaxes + nasdaqTotalTaxes;
    $: totalCosts = sp500TotalCosts + dowTotalCosts + nasdaqTotalCosts;
    $: totalNetProfit = sp500NetProfit + dowNetProfit + nasdaqNetProfit;
    $: totalReturnPercentage = (totalNetProfit / totalInvestment) * 100;

    function formatCurrency(value: number): string {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }

    function formatPercentage(value: number): string {
        return new Intl.NumberFormat('pt-PT', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value / 100);
    }

    function formatDate(dateStr: string): string {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    function calculateDuration(startDate: string, endDate: string): string {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        return `${months} meses e ${remainingDays} dias`;
    }

    let visibleStocks = {
        sp500Index: false,
        dowIndex: true,
        nasdaqIndex: true,
        totalPortfolio: true
    };

    // Add function to calculate growth percentages
    function calculateGrowth(currentValue: number, initialValue: number): { absolute: number; relative: number } {
        const absoluteGrowth = currentValue - initialValue;
        const relativeGrowth = (absoluteGrowth / initialValue) * 100;
        return { absolute: absoluteGrowth, relative: relativeGrowth };
    }

    interface DragState {
        x: number;
        values: Record<string, number>;
    }

    let dragStart: DragState | null = null;

    // Add new graph types
    let graphType: 'performance' | 'monthly-returns' | 'cumulative-returns' | 'tax-breakdown' = 'performance';

    // Calculate monthly returns
    function calculateMonthlyReturns() {
        const monthlyData: { date: string; return: number }[] = [];
        const initialValue = totalInvestment;
        
        // Filter data for the selected year only
        const yearEndDate = selectedYear === '2024' ? '2024-12-31' : '2025-12-31';
        const yearStartDate = selectedYear === '2024' ? '2024-01-01' : '2025-01-01';
        
        const filteredData = sp500Data.filter(d => d.date >= yearStartDate && d.date <= yearEndDate);

        let previousValue = (sp500Shares * filteredData[0].value) + 
                          (dowShares * dowData[0].value) + 
                          (nasdaqShares * nasdaqData[0].value);

        for (let i = 1; i < filteredData.length; i++) {
            const currentValue = (sp500Shares * filteredData[i].value) + 
                               (dowShares * dowData[i].value) + 
                               (nasdaqShares * nasdaqData[i].value);
            const monthlyReturn = ((currentValue - previousValue) / previousValue) * 100;
            monthlyData.push({ date: filteredData[i].date, return: monthlyReturn });
            previousValue = currentValue;
        }

        return monthlyData;
    }

    // Calculate cumulative returns
    function calculateCumulativeReturns() {
        const cumulativeData: { date: string; return: number }[] = [];
        const initialValue = totalInvestment;
        
        // Filter data for the selected year only
        const yearEndDate = selectedYear === '2024' ? '2024-12-31' : '2025-12-31';
        const yearStartDate = selectedYear === '2024' ? '2024-01-01' : '2025-01-01';
        
        const filteredData = sp500Data.filter(d => d.date >= yearStartDate && d.date <= yearEndDate);

        filteredData.forEach((data, i) => {
            const totalValue = (sp500Shares * data.value) + 
                             (dowShares * dowData[i].value) + 
                             (nasdaqShares * nasdaqData[i].value);
            const cumulativeReturn = ((totalValue - initialValue) / initialValue) * 100;
            cumulativeData.push({ date: data.date, return: cumulativeReturn });
        });

        return cumulativeData;
    }

    interface ChartData {
        performance: any[] | null;
        monthlyReturns: { date: string; return: number }[] | null;
        cumulativeReturns: { date: string; return: number }[] | null;
        taxBreakdown: any[] | null;
    }

    // Initialize chart data
    let chartData: ChartData = {
        performance: null,
        monthlyReturns: null,
        cumulativeReturns: null,
        taxBreakdown: null
    };

    // Add separate canvas references for each chart type
    let performanceCanvas: HTMLCanvasElement;
    let monthlyReturnsCanvas: HTMLCanvasElement;
    let cumulativeReturnsCanvas: HTMLCanvasElement;
    let taxBreakdownCanvas: HTMLCanvasElement;

    // Update chart function
    function updateChart() {
        console.log('Updating chart:', graphType);
        
        // Get the appropriate canvas based on chart type
        const canvas = graphType === 'performance' ? performanceCanvas :
                      graphType === 'monthly-returns' ? monthlyReturnsCanvas :
                      graphType === 'cumulative-returns' ? cumulativeReturnsCanvas :
                      taxBreakdownCanvas;

        if (!canvas) {
            console.error('Canvas not found for', graphType);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get canvas context');
            return;
        }

        if (chart) {
            console.log('Destroying existing chart');
            chart.destroy();
            chart = null;
        }

        // Calculate data based on graph type
        if (graphType === 'cumulative-returns') {
            chartData.cumulativeReturns = calculateCumulativeReturns();
        } else if (graphType === 'monthly-returns') {
            chartData.monthlyReturns = calculateMonthlyReturns();
        }

        // Create chart based on type
        if (graphType === 'tax-breakdown') {
            console.log('Rendering tax breakdown chart');
            const taxData = [
                { label: 'Imposto do Selo (Compra)', value: sp500BuyTransactionTax + dowBuyTransactionTax + nasdaqBuyTransactionTax },
                { label: 'Imposto do Selo (Venda)', value: sp500SellTransactionTax + dowSellTransactionTax + nasdaqSellTransactionTax },
                { label: 'Comissões do Broker', value: sp500BuyBrokerFee + dowBuyBrokerFee + nasdaqBuyBrokerFee + sp500SellBrokerFee + dowSellBrokerFee + nasdaqSellBrokerFee },
                { label: 'Taxas de Mercado', value: sp500BuyMarketFee + dowBuyMarketFee + nasdaqBuyMarketFee + sp500SellMarketFee + dowSellMarketFee + nasdaqSellMarketFee },
                { label: 'Taxas de Bolsa', value: sp500BuyExchangeFee + dowBuyExchangeFee + nasdaqBuyExchangeFee + sp500SellExchangeFee + dowSellExchangeFee + nasdaqSellExchangeFee },
                { label: 'Taxa de Custódia', value: sp500CustodyFees + dowCustodyFees + nasdaqCustodyFees },
                { label: 'Imposto Mais-Valias', value: sp500CapitalGainsTax + dowCapitalGainsTax + nasdaqCapitalGainsTax }
            ];

            console.log('Tax data:', taxData);

            try {
                chart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: taxData.map(d => d.label),
                        datasets: [{
                            data: taxData.map(d => d.value),
                            backgroundColor: [
                                'rgba(239, 68, 68, 0.7)',  // red
                                'rgba(249, 115, 22, 0.7)', // orange
                                'rgba(234, 179, 8, 0.7)',  // yellow
                                'rgba(16, 185, 129, 0.7)', // emerald
                                'rgba(59, 130, 246, 0.7)', // blue
                                'rgba(168, 85, 247, 0.7)', // purple
                                'rgba(236, 72, 153, 0.7)'  // pink
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: (context: any) => `${context.label}: ${formatCurrency(context.raw)}`
                                }
                            },
                            legend: {
                                position: 'right',
                                labels: {
                                    color: 'white',
                                    padding: 20,
                                    font: {
                                        size: 12
                                    }
                                }
                            }
                        }
                    }
                });
                console.log('Tax breakdown chart created successfully');
            } catch (error) {
                console.error('Error creating tax breakdown chart:', error);
            }
        } else if (graphType === 'performance') {
            console.log('Rendering performance chart');
            // Filter data based on selected year
            const yearEndDate = selectedYear === '2024' ? '2024-12-31' : '2025-12-31';
            const yearStartDate = selectedYear === '2024' ? '2024-01-01' : '2025-01-01';
            
            const filteredSP500Data = sp500Data.filter(d => d.date >= yearStartDate && d.date <= yearEndDate);
            const filteredDowData = dowData.filter(d => d.date >= yearStartDate && d.date <= yearEndDate);
            const filteredNasdaqData = nasdaqData.filter(d => d.date >= yearStartDate && d.date <= yearEndDate);

            const labels = filteredSP500Data.map(d => formatDate(d.date));
            let datasets = [];

            const colors = {
                sp500: 'rgb(59, 130, 246)', // blue-500
                dow: 'rgb(16, 185, 129)',   // emerald-500
                nasdaq: 'rgb(236, 72, 153)', // pink-500
                portfolio: 'rgb(168, 85, 247)' // purple-600
            };

            if (visibleStocks.sp500Index) {
                datasets.push({
                    label: 'S&P 500',
                    data: filteredSP500Data.map(d => d.value),
                    borderColor: colors.sp500,
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                });
            }

            if (visibleStocks.dowIndex) {
                datasets.push({
                    label: 'Dow Jones',
                    data: filteredDowData.map(d => d.value),
                    borderColor: colors.dow,
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                });
            }

            if (visibleStocks.nasdaqIndex) {
                datasets.push({
                    label: 'NASDAQ',
                    data: filteredNasdaqData.map(d => d.value),
                    borderColor: colors.nasdaq,
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                });
            }

            if (visibleStocks.totalPortfolio) {
                datasets.push({
                    label: '★ Carteira Total ★',
                    data: filteredSP500Data.map((d, i) => {
                        if (filteredDowData[i] && filteredNasdaqData[i]) {
                            return (sp500Shares * d.value) + (dowShares * filteredDowData[i].value) + (nasdaqShares * filteredNasdaqData[i].value);
                        }
                        return 0;
                    }),
                    borderColor: colors.portfolio,
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    borderWidth: 4,
                    tension: 0.1,
                    fill: true,
                    order: -1,
                    z: 1
                });
            }

            console.log('Performance datasets:', datasets);

            try {
                chart = new Chart(ctx, {
                    type: 'line',
                    data: { labels, datasets },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'nearest',
                            intersect: true,
                            axis: 'x'
                        },
                        scales: {
                            y: {
                                type: 'linear',
                                beginAtZero: false,
                                ticks: {
                                    callback: function(this: any, value: string | number) {
                                        if (typeof value === 'number') {
                                            return formatCurrency(value);
                                        }
                                        return value;
                                    }
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context: any) {
                                        const label = context.dataset.label || '';
                                        const value = context.parsed.y;
                                        const initialValue = context.dataset.data[0];
                                        const growth = calculateGrowth(value, initialValue);
                                        const growthText = growth.relative >= 0 ? '+' : '';
                                        
                                        return [
                                            `${label}: ${formatCurrency(value)}`,
                                            `Crescimento: ${growthText}${formatPercentage(growth.relative )}`
                                        ];
                                    }
                                }
                            },
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    usePointStyle: true,
                                    padding: 20,
                                    font: {
                                        size: 12
                                    }
                                }
                            }
                        }
                    }
                });
                console.log('Performance chart created successfully');
            } catch (error) {
                console.error('Error creating performance chart:', error);
            }
        } else if (graphType === 'monthly-returns' && chartData.monthlyReturns?.length) {
            try {
                chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: chartData.monthlyReturns.map((d: { date: string }) => formatDate(d.date)),
                        datasets: [{
                            label: 'Retorno Mensal',
                            data: chartData.monthlyReturns.map((d: { return: number }) => d.return),
                            backgroundColor: chartData.monthlyReturns.map((d: { return: number }) => 
                                d.return >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'
                            ),
                            borderColor: chartData.monthlyReturns.map((d: { return: number }) => 
                                d.return >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
                            ),
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(tickValue: number | string) {
                                        if (typeof tickValue === 'number') {
                                            return tickValue.toFixed(2) + '%';
                                        }
                                        return tickValue;
                                    }
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context: any) {
                                        return `Retorno: ${(context.raw).toFixed(2)}%`;
                                    }
                                }
                            }
                        }
                    }
                });
                console.log('Monthly returns chart created successfully');
            } catch (error) {
                console.error('Error creating monthly returns chart:', error);
            }
        } else if (graphType === 'cumulative-returns' && chartData.cumulativeReturns?.length) {
            try {
                chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.cumulativeReturns.map((d: { date: string }) => formatDate(d.date)),
                        datasets: [{
                            label: 'Retorno Acumulado',
                            data: chartData.cumulativeReturns.map((d: { return: number }) => d.return),
                            borderColor: 'rgb(168, 85, 247)',
                            borderWidth: 2,
                            tension: 0.1,
                            fill: false
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                ticks: {
                                    callback: function(tickValue: number | string) {
                                        if (typeof tickValue === 'number') {
                                            return tickValue.toFixed(2) + '%';
                                        }
                                        return tickValue;
                                    }
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context: any) {
                                        return `Retorno: ${(context.raw).toFixed(2)}%`;
                                    }
                                }
                            }
                        }
                    }
                });
                console.log('Cumulative returns chart created successfully');
            } catch (error) {
                console.error('Error creating cumulative returns chart:', error);
            }
        }
    }

    onDestroy(() => {
        if (chart) {
            chart.destroy();
            chart = null;
        }
    });

    onMount(() => {
        if (browser) {
            updateChart();
        }
    });

    $: {
        if (browser && (viewMode || selectedYear)) {
            updateChart();
        }
    }

    let debounceTimer: ReturnType<typeof setTimeout>;

    let showRefreshIndicator = false;

    function handleInvestmentChange(value: string, index?: string) {
        const numValue = Number(value);
        
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 1000000000) {
            if (index) {
                investments[index as keyof typeof investments] = numValue;
            } else if (viewMode !== 'COMBINED') {
                const targetIndex = viewMode.toLowerCase() as keyof typeof investments;
                investments[targetIndex] = numValue;
            }
            showRefreshIndicator = true;
            updateChart();
            setTimeout(() => {
                showRefreshIndicator = false;
            }, 500);
        }
    }

    // Add projection calculations
    function calculateProjectedValue(currentValue: number, years: number, annualGrowthRate = 0.10): {
        projectedValue: number;
        effectiveTax: number;
        taxSavings: number;
        netValue: number;
    } {
        const projectedValue = currentValue * Math.pow(1 + annualGrowthRate, years);
        const grossProfit = projectedValue - currentValue;
        const effectiveTax = getEffectiveTaxRate(years);
        const taxAmount = grossProfit * effectiveTax;
        const taxAmountWithoutBenefit = grossProfit * BASE_CAPITAL_GAINS_TAX;
        const taxSavings = taxAmountWithoutBenefit - taxAmount;
        const netValue = projectedValue - taxAmount;
        
        return {
            projectedValue,
            effectiveTax,
            taxSavings,
            netValue
        };
    }

    // Calculate projections for different holding periods
    $: projections = {
        threeYears: calculateProjectedValue(totalFinalValue, 3),
        sixYears: calculateProjectedValue(totalFinalValue, 6),
        nineYears: calculateProjectedValue(totalFinalValue, 9)
    };

    // Add function to calculate potential tax savings for each period
    function calculatePotentialSavings(grossProfit: number, effectiveTaxRate: number): number {
        const taxWithoutBenefit = grossProfit * BASE_CAPITAL_GAINS_TAX;
        const taxWithBenefit = grossProfit * effectiveTaxRate;
        return taxWithoutBenefit - taxWithBenefit;
    }

    // Calculate potential savings for each period
    $: potentialSavings = {
        twoToFive: calculatePotentialSavings(totalGrossProfit, BASE_CAPITAL_GAINS_TAX * 0.9),
        fiveToEight: calculatePotentialSavings(totalGrossProfit, BASE_CAPITAL_GAINS_TAX * 0.8),
        overEight: calculatePotentialSavings(totalGrossProfit, BASE_CAPITAL_GAINS_TAX * 0.7)
    };

    // Add function to handle graph type changes
    function handleGraphTypeChange(type: 'performance' | 'monthly-returns' | 'cumulative-returns' | 'tax-breakdown') {
        graphType = type;
        updateChart();
        // Add a small delay and trigger another update to ensure the chart loads
        setTimeout(() => {
            updateChart();
        }, 50);
    }
</script>

<div class="container mx-auto p-4 bg-gray-900 text-white min-h-screen relative">
    {#if showRefreshIndicator}
        <div class="fixed top-4 right-4 bg-gray-800 text-gray-300 px-2 py-1 rounded text-sm opacity-75 transition-opacity">
            Atualizado ↻
        </div>
    {/if}
    <h1 class="text-3xl font-bold mb-6 text-center">Simulador de Investimento</h1>

    <div class="flex justify-center space-x-4 mb-6">
        <button
            class="px-4 py-2 rounded {selectedYear === '2024' ? 'bg-red-600' : 'bg-gray-700'}"
            on:click={() => selectedYear = '2024'}
        >
            Dados 2024
        </button>
        <button
            class="px-4 py-2 rounded {selectedYear === '2025' ? 'bg-red-600' : 'bg-gray-700'}"
            on:click={() => selectedYear = '2025'}
        >
            Dados 2025
        </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-gray-800 p-4 rounded-lg">
            <h2 class="text-xl font-semibold mb-4">Detalhes do Investimento</h2>
            <div class="space-y-4">
                <div>
                    <label for="view-mode" class="block mb-2">Visualização:</label>
                    <select
                        id="view-mode"
                        bind:value={viewMode}
                        class="w-full p-2 bg-gray-700 rounded"
                    >
                        <option value="COMBINED">Carteira Completa</option>
                        <option value="SP500">Apenas S&P 500</option>
                        <option value="DOW">Apenas Dow Jones</option>
                        <option value="NASDAQ">Apenas NASDAQ</option>
                    </select>
                </div>
                <div>
                    <label for="investment-amount" class="block mb-2">
                        {viewMode === 'COMBINED' ? 'Montante por Índice' : 'Montante do Índice'} (EUR):
                    </label>
                    {#if viewMode === 'COMBINED'}
                        <div class="space-y-2">
                            <div class="flex items-center gap-2">
                                <label class="w-24">S&P 500:</label>
                                <input
                                    type="number"
                                    value={investments.sp500}
                                    on:input={(e) => handleInvestmentChange(e.currentTarget.value, 'sp500')}
                                    class="flex-1 p-2 bg-gray-700 rounded text-white"
                                    min="0"
                                    step="1000"
                                />
                            </div>
                            <div class="flex items-center gap-2">
                                <label class="w-24">Dow Jones:</label>
                                <input
                                    type="number"
                                    value={investments.dow}
                                    on:input={(e) => handleInvestmentChange(e.currentTarget.value, 'dow')}
                                    class="flex-1 p-2 bg-gray-700 rounded text-white"
                                    min="0"
                                    step="1000"
                                />
                            </div>
                            <div class="flex items-center gap-2">
                                <label class="w-24">NASDAQ:</label>
                                <input
                                    type="number"
                                    value={investments.nasdaq}
                                    on:input={(e) => handleInvestmentChange(e.currentTarget.value, 'nasdaq')}
                                    class="flex-1 p-2 bg-gray-700 rounded text-white"
                                    min="0"
                                    step="1000"
                                />
                            </div>
                        </div>
                    {:else}
                        <input
                            id="investment-amount"
                            type="number"
                            value={investmentAmount}
                            on:input={(e) => handleInvestmentChange(e.currentTarget.value)}
                            class="w-full p-2 bg-gray-700 rounded text-white"
                            min="0"
                            step="1000"
                        />
                    {/if}
                    <p class="text-sm text-gray-400 mt-1">Investimento total: {formatCurrency(totalInvestment)}</p>
                </div>
                <div class="space-y-2">
                    <h3 class="font-medium">Visibilidade do Gráfico:</h3>
                    <div class="grid grid-cols-2 gap-2">
                        <label class="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                bind:checked={visibleStocks.sp500Index}
                                on:change={updateChart}
                                class="form-checkbox text-blue-500"
                            />
                            <span class="text-sm whitespace-nowrap">S&P 500</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                bind:checked={visibleStocks.dowIndex}
                                on:change={updateChart}
                                class="form-checkbox text-emerald-500"
                            />
                            <span class="text-sm whitespace-nowrap">Dow Jones</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                bind:checked={visibleStocks.nasdaqIndex}
                                on:change={updateChart}
                                class="form-checkbox text-pink-500"
                            />
                            <span class="text-sm whitespace-nowrap">NASDAQ</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                bind:checked={visibleStocks.totalPortfolio}
                                on:change={updateChart}
                                class="form-checkbox text-purple-500"
                            />
                            <span class="text-sm whitespace-nowrap">Carteira Total</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-gray-800 p-4 rounded-lg">
            <h2 class="text-xl font-semibold mb-4">Resultados da Carteira</h2>
            <div class="space-y-2">
                <div class="flex justify-between items-start">
                    <div>
                        <p>Período: {formatDate(sp500Data[sp500Data.length - 1].date)} a {formatDate(sp500Data[0].date)}</p>
                        <p>Duração: {calculateDuration(sp500Data[sp500Data.length - 1].date, sp500Data[0].date)}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-400">Valor Inicial</p>
                        <p class="text-lg font-semibold">{formatCurrency(Object.values(investments).reduce((a, b) => a + b, 0))}</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mt-4">
                    <div class="bg-gray-700 p-3 rounded">
                        <p class="text-sm text-gray-400">Valor Final</p>
                        <p class="text-lg font-semibold">{formatCurrency(totalFinalValue)}</p>
                        <p class="text-sm {totalGrossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                            {totalGrossProfit >= 0 ? '+' : ''}{formatCurrency(totalGrossProfit)}
                        </p>
                    </div>
                    <div class="bg-gray-700 p-3 rounded">
                        <p class="text-sm text-gray-400">Retorno Total</p>
                        <p class="text-lg font-semibold">{formatPercentage(totalReturnPercentage)}</p>
                        <p class="text-sm text-gray-400">
                            {formatPercentage(totalReturnPercentage / monthsDiff)} /mês
                        </p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mt-4">
                    <div class="bg-gray-700 p-3 rounded">
                        <p class="text-sm text-gray-400">Custos Totais</p>
                        <p class="text-lg font-semibold text-red-400">-{formatCurrency(totalFees)}</p>
                        <p class="text-xs text-gray-400">Inclui taxas e custos de manutenção</p>
                    </div>
                    <div class="bg-gray-700 p-3 rounded">
                        <p class="text-sm text-gray-400">Lucro Líquido</p>
                        <p class="text-lg font-semibold {totalNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                            {totalNetProfit >= 0 ? '+' : ''}{formatCurrency(totalNetProfit)}
                        </p>
                        <p class="text-xs text-gray-400">Após custos e impostos</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-gray-800 p-4 rounded-lg">
            <h2 class="text-xl font-semibold mb-4">Informações Fiscais</h2>
            <div class="space-y-4">
                <div class="bg-gray-700 p-3 rounded">
                    <h3 class="font-medium mb-2">Impostos sobre Mais-Valias</h3>
                    <div class="space-y-2">
                        <div>
                            <p class="text-sm text-gray-400">Taxa Efetiva</p>
                            <p class="text-lg font-semibold">{(effectiveTaxRate * 100).toFixed(1)}%</p>
                            {#if effectiveTaxRate < BASE_CAPITAL_GAINS_TAX}
                                <p class="text-xs text-emerald-400">Com benefício fiscal ({holdingPeriodYears.toFixed(1)} anos)</p>
                            {/if}
                        </div>
                        <div>
                            <p class="text-sm text-gray-400">Valor do Imposto</p>
                            <p class="text-lg font-semibold text-red-400">
                                -{formatCurrency(sp500CapitalGainsTax + dowCapitalGainsTax + nasdaqCapitalGainsTax)}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-700 p-3 rounded">
                    <h3 class="font-medium mb-2">Custos de Transação</h3>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-sm">Imposto do Selo</span>
                            <span class="text-sm text-red-400">-{formatCurrency(sp500BuyTransactionTax + dowBuyTransactionTax + nasdaqBuyTransactionTax + sp500SellTransactionTax + dowSellTransactionTax + nasdaqSellTransactionTax)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm">Comissão do Broker</span>
                            <span class="text-sm text-red-400">-{formatCurrency(sp500BuyBrokerFee + dowBuyBrokerFee + nasdaqBuyBrokerFee + sp500SellBrokerFee + dowSellBrokerFee + nasdaqSellBrokerFee)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm">Taxa de Custódia</span>
                            <span class="text-sm text-red-400">-{formatCurrency(sp500CustodyFees + dowCustodyFees + nasdaqCustodyFees)}</span>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-700 p-3 rounded">
                    <h3 class="font-medium mb-2">Benefícios por Tempo</h3>
                    <div class="space-y-1">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                                <span class="text-sm">Até 2 anos: 28%</span>
                            </div>
                            <span class="text-sm text-gray-400">(Taxa base)</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                                <span class="text-sm">2-5 anos: 25,2%</span>
                            </div>
                            <span class="text-sm text-emerald-400">(-{formatCurrency(potentialSavings.twoToFive)})</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                <span class="text-sm">5-8 anos: 22,4%</span>
                            </div>
                            <span class="text-sm text-emerald-400">(-{formatCurrency(potentialSavings.fiveToEight)})</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                <span class="text-sm">+8 anos: 19,6%</span>
                            </div>
                            <span class="text-sm text-emerald-400">(-{formatCurrency(potentialSavings.overEight)})</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="bg-gray-800 p-4 rounded-lg mt-4">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">Gráfico de Desempenho</h2>
            <div class="flex space-x-2">
                <button
                    class="px-4 py-2 rounded {graphType === 'performance' ? 'bg-red-600' : 'bg-gray-700'}"
                    on:click={() => handleGraphTypeChange('performance')}
                >
                    Desempenho
                </button>
                <button
                    class="px-4 py-2 rounded {graphType === 'monthly-returns' ? 'bg-red-600' : 'bg-gray-700'}"
                    on:click={() => handleGraphTypeChange('monthly-returns')}
                >
                    Retornos Mensais
                </button>
                <button
                    class="px-4 py-2 rounded {graphType === 'cumulative-returns' ? 'bg-red-600' : 'bg-gray-700'}"
                    on:click={() => handleGraphTypeChange('cumulative-returns')}
                >
                    Retorno Acumulado
                </button>
                <button
                    class="px-4 py-2 rounded {graphType === 'tax-breakdown' ? 'bg-red-600' : 'bg-gray-700'}"
                    on:click={() => handleGraphTypeChange('tax-breakdown')}
                >
                    Distribuição de Custos
                </button>
            </div>
        </div>
        <div class="h-[400px] relative">
            {#if graphType === 'performance'}
                <canvas bind:this={performanceCanvas}></canvas>
            {:else if graphType === 'monthly-returns'}
                <canvas bind:this={monthlyReturnsCanvas}></canvas>
            {:else if graphType === 'cumulative-returns'}
                <canvas bind:this={cumulativeReturnsCanvas}></canvas>
            {:else}
                <canvas bind:this={taxBreakdownCanvas}></canvas>
            {/if}
        </div>
    </div>

    <div class="bg-gray-800 p-4 rounded-lg mt-4">
        <h3 class="text-xl font-semibold mb-4">Projeção de Valor Futuro e Benefícios Fiscais</h3>
        <p class="text-sm text-gray-400 mb-4">
            Projeção baseada no valor final atual de {formatCurrency(totalFinalValue)} com crescimento anual estimado de 10%
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 bg-gray-700 rounded-lg border-l-4 border-yellow-500">
                <h4 class="font-semibold mb-2">Em 3 Anos (Taxa: {(projections.threeYears.effectiveTax * 100).toFixed(1)}%)</h4>
                <div class="space-y-2">
                    <p>Valor Projetado: {formatCurrency(projections.threeYears.projectedValue)}</p>
                    <p>Valor Líquido: {formatCurrency(projections.threeYears.netValue)}</p>
                    <p class="text-emerald-400">Economia em Impostos: {formatCurrency(projections.threeYears.taxSavings)}</p>
                </div>
            </div>
            
            <div class="p-4 bg-gray-700 rounded-lg border-l-4 border-green-500">
                <h4 class="font-semibold mb-2">Em 6 Anos (Taxa: {(projections.sixYears.effectiveTax * 100).toFixed(1)}%)</h4>
                <div class="space-y-2">
                    <p>Valor Projetado: {formatCurrency(projections.sixYears.projectedValue)}</p>
                    <p>Valor Líquido: {formatCurrency(projections.sixYears.netValue)}</p>
                    <p class="text-emerald-400">Economia em Impostos: {formatCurrency(projections.sixYears.taxSavings)}</p>
                </div>
            </div>
            
            <div class="p-4 bg-gray-700 rounded-lg border-l-4 border-blue-500">
                <h4 class="font-semibold mb-2">Em 9 Anos (Taxa: {(projections.nineYears.effectiveTax * 100).toFixed(1)}%)</h4>
                <div class="space-y-2">
                    <p>Valor Projetado: {formatCurrency(projections.nineYears.projectedValue)}</p>
                    <p>Valor Líquido: {formatCurrency(projections.nineYears.netValue)}</p>
                    <p class="text-emerald-400">Economia em Impostos: {formatCurrency(projections.nineYears.taxSavings)}</p>
                </div>
            </div>
        </div>
        <div class="mt-4 text-sm text-gray-400">
            <p>* As projeções assumem:</p>
            <ul class="list-disc list-inside pl-4 space-y-1">
                <li>Crescimento anual médio de 10% (baseado em retornos históricos de longo prazo)</li>
                <li>Manutenção do atual regime fiscal de benefícios por tempo de detenção</li>
                <li>Reinvestimento de todos os dividendos</li>
                <li>Não considera custos adicionais de manutenção ou inflação</li>
            </ul>
        </div>
    </div>

    <div class="bg-gray-800 p-4 rounded-lg mt-4">
        <h2 class="text-xl font-semibold mb-4">Detalhamento de Custos e Impostos</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
                <div class="bg-gray-700 p-3 rounded">
                    <h3 class="font-medium mb-2">Custos de Compra</h3>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-sm">Imposto do Selo (0.2%)</span>
                            <span class="text-sm text-red-400">-{formatCurrency(sp500BuyTransactionTax + dowBuyTransactionTax + nasdaqBuyTransactionTax)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm">Comissão do Broker (0.25%)</span>
                            <span class="text-sm text-red-400">-{formatCurrency(sp500BuyBrokerFee + dowBuyBrokerFee + nasdaqBuyBrokerFee)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm">Taxa de Acesso ao Mercado (0.05%)</span>
                            <span class="text-sm text-red-400">-{formatCurrency(sp500BuyMarketFee + dowBuyMarketFee + nasdaqBuyMarketFee)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm">Taxa de Bolsa (0.02%)</span>
                            <span class="text-sm text-red-400">-{formatCurrency(sp500BuyExchangeFee + dowBuyExchangeFee + nasdaqBuyExchangeFee)}</span>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-700 p-3 rounded">
                    <h3 class="font-medium mb-2">Custos de Venda</h3>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-sm">Imposto do Selo (0.2%)</span>
                            <span class="text-sm text-red-400">-{formatCurrency(sp500SellTransactionTax + dowSellTransactionTax + nasdaqSellTransactionTax)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm">Comissão do Broker (0.25%)</span>
                            <span class="text-sm text-red-400">-{formatCurrency(sp500SellBrokerFee + dowSellBrokerFee + nasdaqSellBrokerFee)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm">Taxa de Acesso ao Mercado (0.05%)</span>
                            <span class="text-sm text-red-400">-{formatCurrency(sp500SellMarketFee + dowSellMarketFee + nasdaqSellMarketFee)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm">Taxa de Bolsa (0.02%)</span>
                            <span class="text-sm text-red-400">-{formatCurrency(sp500SellExchangeFee + dowSellExchangeFee + nasdaqSellExchangeFee)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-4">
                <div class="bg-gray-700 p-3 rounded">
                    <h3 class="font-medium mb-2">Custos de Manutenção</h3>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-sm">Taxa de Custódia (€2/mês)</span>
                            <span class="text-sm text-red-400">-{formatCurrency(sp500CustodyFees + dowCustodyFees + nasdaqCustodyFees)}</span>
                        </div>
                        <p class="text-xs text-gray-400">Período: {monthsDiff} meses</p>
                    </div>
                </div>

                <div class="bg-gray-700 p-3 rounded">
                    <h3 class="font-medium mb-2">Resumo de Custos</h3>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-sm">Total de Custos de Compra</span>
                            <span class="text-sm text-red-400">-{formatCurrency(sp500TotalBuyFees + dowTotalBuyFees + nasdaqTotalBuyFees)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm">Total de Custos de Venda</span>
                            <span class="text-sm text-red-400">-{formatCurrency(sp500TotalSellFees + dowTotalSellFees + nasdaqTotalSellFees)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm">Total de Custos de Manutenção</span>
                            <span class="text-sm text-red-400">-{formatCurrency(sp500CustodyFees + dowCustodyFees + nasdaqCustodyFees)}</span>
                        </div>
                        <div class="flex justify-between font-medium pt-2 border-t border-gray-600">
                            <span>Total de Custos</span>
                            <span class="text-red-400">-{formatCurrency(totalFees)}</span>
                        </div>
                        <div class="flex justify-between font-medium">
                            <span>Total de Impostos</span>
                            <span class="text-red-400">-{formatCurrency(totalTaxes)}</span>
                        </div>
                        <div class="flex justify-between font-medium">
                            <span>Total Geral</span>
                            <span class="text-red-400">-{formatCurrency(totalCosts)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    :global(body) {
        background-color: rgb(17, 24, 39);
        margin: 0;
        padding: 0;
        overflow-y: scroll; /* Prevent layout shift when toggling graphs */
    }

    :global(.form-checkbox) {
        @apply rounded border-gray-600 bg-gray-700;
        @apply focus:ring-2 focus:ring-offset-0;
        @apply hover:border-opacity-75;
        @apply transition-colors duration-150;
    }
</style>


