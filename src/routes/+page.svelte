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
    const CAPITAL_GAINS_TAX = 0.28; // 28% sobre mais-valias
    const BROKER_FEE = 0.0025; // 0.25% comissão do broker
    const CUSTODY_FEE_MONTHLY = 2; // €2/mês taxa de custódia
    const MARKET_ACCESS_FEE = 0.0005; // 0.05% taxa de acesso ao mercado
    const EXCHANGE_FEE = 0.0002; // 0.02% taxa de bolsa

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

    // S&P 500 Capital gains tax
    $: sp500CapitalGainsTax = sp500GrossProfit > 0 ? sp500GrossProfit * CAPITAL_GAINS_TAX : 0;
    
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

    // Dow Jones Capital gains tax
    $: dowCapitalGainsTax = dowGrossProfit > 0 ? dowGrossProfit * CAPITAL_GAINS_TAX : 0;
    
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

    // NASDAQ Capital gains tax
    $: nasdaqCapitalGainsTax = nasdaqGrossProfit > 0 ? nasdaqGrossProfit * CAPITAL_GAINS_TAX : 0;
    
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
        let lastMonthValue: number | null = null;
        
        // Filter data for the selected year only
        const yearEndDate = selectedYear === '2024' ? '2024-12-31' : '2025-12-31';
        const yearStartDate = selectedYear === '2024' ? '2024-01-01' : '2025-01-01';
        
        const filteredData = sp500Data.filter(d => d.date >= yearStartDate && d.date <= yearEndDate);
        const monthGroups = new Map<string, { lastDay: any, value: number }>();

        // Group data by month and keep the last day's values
        filteredData.forEach((data, i) => {
            const date = new Date(data.date);
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            monthGroups.set(month, {
                lastDay: data,
                value: (sp500Shares * data.value) + 
                       (dowShares * dowData[i].value) + 
                       (nasdaqShares * nasdaqData[i].value)
            });
        });

        // Calculate returns for each month
        Array.from(monthGroups.entries()).forEach(([month, data], index) => {
            if (lastMonthValue === null) {
                lastMonthValue = totalInvestment;
            }
            
            const monthReturn = ((data.value - lastMonthValue) / lastMonthValue) * 100;
            monthlyData.push({ date: month, return: monthReturn });
            lastMonthValue = data.value;
        });

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
            const cumulativeReturn = ((totalValue - initialValue) / initialValue);
            cumulativeData.push({ date: data.date, return: cumulativeReturn });
        });

        return cumulativeData;
    }

    interface CumulativeDataPoint {
        date: string;
        return: number;
    }

    let chartRef: Chart | null = null;
    let taxData: { label: string; value: number; }[] = [];

    function updateChart() {
        if (!browser) return;
        
        console.log('Updating chart:', graphType);
        console.log('Data lengths:', {
            sp500: sp500Data?.length,
            dow: dowData?.length,
            nasdaq: nasdaqData?.length
        });

        if (chart) {
            console.log('Destroying existing chart');
            chart.destroy();
        }

        const canvasId = graphType === 'tax-breakdown' ? 'costDistributionChart' : 'indexChart';
        console.log('Looking for canvas with ID:', canvasId);
        
        const ctx = document.getElementById(canvasId);
        if (!(ctx instanceof HTMLCanvasElement)) {
            console.error('Canvas element not found:', canvasId);
            // Wait a bit and try again
            setTimeout(updateChart, 100);
            return;
        }

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
        } else if (graphType === 'performance' && sp500Data?.length && dowData?.length && nasdaqData?.length) {
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
                                            `Crescimento: ${growthText}${formatPercentage(growth.relative / 100)}`
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
        } else if (graphType === 'monthly-returns') {
            console.log('Rendering monthly returns chart');
            const monthlyData = calculateMonthlyReturns();
            console.log('Monthly returns data:', monthlyData);

            try {
                chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: monthlyData.map(d => d.date),
                        datasets: [{
                            label: 'Retorno Mensal',
                            data: monthlyData.map(d => d.return),
                            backgroundColor: monthlyData.map(d => d.return >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
                            borderColor: monthlyData.map(d => d.return >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'),
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
                                    callback: (value) => {
                                        if (typeof value === 'number') {
                                            return value.toFixed(2) + '%';
                                        }
                                        return value;
                                    }
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: (context) => `Retorno: ${context.raw.toFixed(2)}%`
                                }
                            }
                        }
                    }
                });
                console.log('Monthly returns chart created successfully');
            } catch (error) {
                console.error('Error creating monthly returns chart:', error);
            }
        } else if (graphType === 'cumulative-returns') {
            console.log('Rendering cumulative returns chart');
            const cumulativeData = calculateCumulativeReturns();
            console.log('Cumulative returns data:', cumulativeData);

            try {
                chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: cumulativeData.map(d => formatDate(d.date)),
                        datasets: [{
                            label: 'Retorno Acumulado',
                            data: cumulativeData.map(d => d.return * 100), // Convert to percentage
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
                                    callback: function(value: number) {
                                        return formatPercentage(value / 100);
                                    }
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: (context: { raw: number }) => {
                                        return `Retorno: ${formatPercentage(context.raw / 100)}`;
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

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                <p>Período: {formatDate(sp500Data[sp500Data.length - 1].date)} a {formatDate(sp500Data[0].date)}</p>
                <p>Duração: {calculateDuration(sp500Data[sp500Data.length - 1].date, sp500Data[0].date)}</p>
                
                <div class="mt-4">
                    <h3 class="font-semibold text-lg">Investimento Total: {formatCurrency(Object.values(investments).reduce((a, b) => a + b, 0))}</h3>
                    <div class="pl-4 mt-2 space-y-2">
                        <div class="flex items-center justify-between bg-gray-800 p-2 rounded">
                            {#if editingIndex === 'sp500'}
                                <div class="flex items-center gap-2 flex-1">
                                    <input
                                        type="number"
                                        bind:value={tempInvestmentAmount}
                                        class="w-32 px-2 py-1 bg-gray-700 rounded text-white {inputError ? 'border-red-500' : ''}"
                                        min="0"
                                        step="1000"
                                    />
                                    <button
                                        on:click={saveEdit}
                                        class="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                        title="Save"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        on:click={cancelEdit}
                                        class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                        title="Cancel"
                                    >
                                        ✕
                                    </button>
                                    {#if inputError}
                                        <span class="text-red-500 text-sm">{inputError}</span>
                                    {/if}
                                </div>
                            {:else}
                                <div class="flex items-center justify-between w-full">
                                    <p>S&P 500: {formatCurrency(investments.sp500)}</p>
                                    <div class="flex gap-2">
                                        <button
                                            on:click={() => startEditing('sp500')}
                                            class="p-1 text-gray-400 hover:text-white transition-colors"
                                            title="Edit"
                                        >
                                            ✎
                                        </button>
                                        <button
                                            on:click={() => deleteInvestment('sp500')}
                                            class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            {/if}
                        </div>
                        <div class="flex items-center justify-between bg-gray-800 p-2 rounded">
                            {#if editingIndex === 'dow'}
                                <div class="flex items-center gap-2 flex-1">
                                    <input
                                        type="number"
                                        bind:value={tempInvestmentAmount}
                                        class="w-32 px-2 py-1 bg-gray-700 rounded text-white {inputError ? 'border-red-500' : ''}"
                                        min="0"
                                        step="1000"
                                    />
                                    <button
                                        on:click={saveEdit}
                                        class="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                        title="Save"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        on:click={cancelEdit}
                                        class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                        title="Cancel"
                                    >
                                        ✕
                                    </button>
                                    {#if inputError}
                                        <span class="text-red-500 text-sm">{inputError}</span>
                                    {/if}
                                </div>
                            {:else}
                                <div class="flex items-center justify-between w-full">
                                    <p>Dow Jones: {formatCurrency(investments.dow)}</p>
                                    <div class="flex gap-2">
                                        <button
                                            on:click={() => startEditing('dow')}
                                            class="p-1 text-gray-400 hover:text-white transition-colors"
                                            title="Edit"
                                        >
                                            ✎
                                        </button>
                                        <button
                                            on:click={() => deleteInvestment('dow')}
                                            class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            {/if}
                        </div>
                        <div class="flex items-center justify-between bg-gray-800 p-2 rounded">
                            {#if editingIndex === 'nasdaq'}
                                <div class="flex items-center gap-2 flex-1">
                                    <input
                                        type="number"
                                        bind:value={tempInvestmentAmount}
                                        class="w-32 px-2 py-1 bg-gray-700 rounded text-white {inputError ? 'border-red-500' : ''}"
                                        min="0"
                                        step="1000"
                                    />
                                    <button
                                        on:click={saveEdit}
                                        class="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                        title="Save"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        on:click={cancelEdit}
                                        class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                        title="Cancel"
                                    >
                                        ✕
                                    </button>
                                    {#if inputError}
                                        <span class="text-red-500 text-sm">{inputError}</span>
                                    {/if}
                                </div>
                            {:else}
                                <div class="flex items-center justify-between w-full">
                                    <p>NASDAQ: {formatCurrency(investments.nasdaq)}</p>
                                    <div class="flex gap-2">
                                        <button
                                            on:click={() => startEditing('nasdaq')}
                                            class="p-1 text-gray-400 hover:text-white transition-colors"
                                            title="Edit"
                                        >
                                            ✎
                                        </button>
                                        <button
                                            on:click={() => deleteInvestment('nasdaq')}
                                            class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>

                <div class="mt-4">
                    <h3 class="font-semibold text-lg">Valor Final: {formatCurrency(totalFinalValue)}</h3>
                    <div class="pl-4 mt-2 space-y-1">
                        <p>S&P 500: {formatCurrency(sp500FinalValue)}</p>
                        <p>Dow Jones: {formatCurrency(dowFinalValue)}</p>
                        <p>NASDAQ: {formatCurrency(nasdaqFinalValue)}</p>
                    </div>
                </div>

                <div class="mt-4">
                    <h3 class="font-semibold text-lg">Lucro Bruto: {formatCurrency(totalGrossProfit)}</h3>
                    <div class="pl-4 mt-2 space-y-1">
                        <p>S&P 500: {formatCurrency(sp500GrossProfit)}</p>
                        <p>Dow Jones: {formatCurrency(dowGrossProfit)}</p>
                        <p>NASDAQ: {formatCurrency(nasdaqGrossProfit)}</p>
                    </div>
                </div>

                <div class="mt-4">
                    <h3 class="font-semibold text-lg text-red-400">Custos e Impostos</h3>
                    
                    <div class="pl-4 mt-2">
                        <h4 class="font-medium">Custos de Compra</h4>
                        <div class="pl-4 space-y-1 text-sm">
                            <p>Imposto do Selo: {formatCurrency(sp500BuyTransactionTax + dowBuyTransactionTax + nasdaqBuyTransactionTax)}</p>
                            <p>Comissão do Broker: {formatCurrency(sp500BuyBrokerFee + dowBuyBrokerFee + nasdaqBuyBrokerFee)}</p>
                            <p>Taxa de Acesso ao Mercado: {formatCurrency(sp500BuyMarketFee + dowBuyMarketFee + nasdaqBuyMarketFee)}</p>
                            <p>Taxa de Bolsa: {formatCurrency(sp500BuyExchangeFee + dowBuyExchangeFee + nasdaqBuyExchangeFee)}</p>
                        </div>
                    </div>

                    <div class="pl-4 mt-2">
                        <h4 class="font-medium">Custos de Venda</h4>
                        <div class="pl-4 space-y-1 text-sm">
                            <p>Imposto do Selo: {formatCurrency(sp500SellTransactionTax + dowSellTransactionTax + nasdaqSellTransactionTax)}</p>
                            <p>Comissão do Broker: {formatCurrency(sp500SellBrokerFee + dowSellBrokerFee + nasdaqSellBrokerFee)}</p>
                            <p>Taxa de Acesso ao Mercado: {formatCurrency(sp500SellMarketFee + dowSellMarketFee + nasdaqSellMarketFee)}</p>
                            <p>Taxa de Bolsa: {formatCurrency(sp500SellExchangeFee + dowSellExchangeFee + nasdaqSellExchangeFee)}</p>
                        </div>
                    </div>

                    <div class="pl-4 mt-2">
                        <h4 class="font-medium">Custos de Manutenção</h4>
                        <div class="pl-4 space-y-1 text-sm">
                            <p>Taxa de Custódia ({monthsDiff} meses): {formatCurrency(sp500CustodyFees + dowCustodyFees + nasdaqCustodyFees)}</p>
                        </div>
                    </div>

                    <div class="pl-4 mt-2">
                        <h4 class="font-medium">Impostos sobre Mais-Valias</h4>
                        <div class="pl-4 space-y-1 text-sm">
                            <p>S&P 500 (28%): {formatCurrency(sp500CapitalGainsTax)}</p>
                            <p>Dow Jones (28%): {formatCurrency(dowCapitalGainsTax)}</p>
                            <p>NASDAQ (28%): {formatCurrency(nasdaqCapitalGainsTax)}</p>
                        </div>
                    </div>

                    <div class="mt-2 font-medium">
                        <p>Total de Custos: {formatCurrency(totalFees)}</p>
                        <p>Total de Impostos: {formatCurrency(totalTaxes)}</p>
                        <p>Total de Custos e Impostos: {formatCurrency(totalCosts)}</p>
                    </div>
                </div>

                <div class="mt-4 pt-4 border-t border-gray-700">
                    <h3 class="text-xl font-bold">Resultado Final</h3>
                    <div class="pl-4 space-y-2">
                        <p class="text-lg">Lucro Líquido: {formatCurrency(totalNetProfit)}</p>
                        <p>Retorno Total: {formatPercentage(totalReturnPercentage)}</p>
                        <p>Retorno Mensal Médio: {formatPercentage(totalReturnPercentage / monthsDiff)}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="bg-gray-800 p-4 rounded-lg">
        <div class="flex flex-wrap gap-4 mb-4 items-center">
            <h2 class="text-xl font-semibold">Gráficos</h2>
            <div class="flex flex-wrap gap-3">
                <button
                    class="px-4 py-2 rounded {graphType === 'performance' ? 'bg-red-600' : 'bg-gray-700'}"
                    on:click={() => { graphType = 'performance'; updateChart(); }}
                >
                    Desempenho
                </button>
                <button
                    class="px-4 py-2 rounded {graphType === 'monthly-returns' ? 'bg-red-600' : 'bg-gray-700'}"
                    on:click={() => { graphType = 'monthly-returns'; updateChart(); }}
                >
                    Retornos Mensais
                </button>
                <button
                    class="px-4 py-2 rounded {graphType === 'cumulative-returns' ? 'bg-red-600' : 'bg-gray-700'}"
                    on:click={() => { graphType = 'cumulative-returns'; updateChart(); }}
                >
                    Retorno Acumulado
                </button>
                <button
                    class="px-4 py-2 rounded {graphType === 'tax-breakdown' ? 'bg-red-600' : 'bg-gray-700'}"
                    on:click={() => { graphType = 'tax-breakdown'; updateChart(); }}
                >
                    Distribuição de Custos
                </button>
            </div>
        </div>
        <div class="h-[600px] relative">
            {#if graphType === 'tax-breakdown'}
                <canvas id="costDistributionChart" class="w-full h-full"></canvas>
            {:else}
                <canvas id="indexChart" class="w-full h-full"></canvas>
            {/if}
        </div>
    </div>

    <div class="bg-gray-800 p-4 rounded-lg mt-6">
        <h2 class="text-xl font-semibold mb-4">Custos e Impostos</h2>
        <div class="space-y-4">
            <div>
                <h3 class="font-medium text-lg">Custos de Transação</h3>
                <div class="pl-4 space-y-2">
                    <p>
                        <span class="font-medium">Imposto do Selo:</span> 
                        <span class="text-gray-300">0.2% sobre o valor da transação ({formatCurrency(sp500BuyTransactionTax + dowBuyTransactionTax + nasdaqBuyTransactionTax)} na compra, {formatCurrency(sp500SellTransactionTax + dowSellTransactionTax + nasdaqSellTransactionTax)} na venda)</span>
                        <span class="block text-sm text-gray-400">Aplicado na compra ({formatCurrency(totalInvestment)} × 0.2%) e venda ({formatCurrency(totalFinalValue)} × 0.2%)</span>
                    </p>
                    <p>
                        <span class="font-medium">Comissão do Broker:</span>
                        <span class="text-gray-300">0.25% sobre o valor da transação ({formatCurrency(sp500BuyBrokerFee + dowBuyBrokerFee + nasdaqBuyBrokerFee + sp500SellBrokerFee + dowSellBrokerFee + nasdaqSellBrokerFee)} total)</span>
                        <span class="block text-sm text-gray-400">Aplicado na compra ({formatCurrency(totalInvestment)} × 0.25%) e venda ({formatCurrency(totalFinalValue)} × 0.25%)</span>
                    </p>
                    <p>
                        <span class="font-medium">Taxa de Acesso ao Mercado:</span>
                        <span class="text-gray-300">0.05% sobre o valor da transação ({formatCurrency(sp500BuyMarketFee + dowBuyMarketFee + nasdaqBuyMarketFee + sp500SellMarketFee + dowSellMarketFee + nasdaqSellMarketFee)} total)</span>
                        <span class="block text-sm text-gray-400">Aplicado na compra ({formatCurrency(totalInvestment)} × 0.05%) e venda ({formatCurrency(totalFinalValue)} × 0.05%)</span>
                    </p>
                    <p>
                        <span class="font-medium">Taxa de Bolsa:</span>
                        <span class="text-gray-300">0.02% sobre o valor da transação ({formatCurrency(sp500BuyExchangeFee + dowBuyExchangeFee + nasdaqBuyExchangeFee + sp500SellExchangeFee + dowSellExchangeFee + nasdaqSellExchangeFee)} total)</span>
                        <span class="block text-sm text-gray-400">Aplicado na compra ({formatCurrency(totalInvestment)} × 0.02%) e venda ({formatCurrency(totalFinalValue)} × 0.02%)</span>
                    </p>
                </div>
            </div>

            <div>
                <h3 class="font-medium text-lg">Custos de Manutenção</h3>
                <div class="pl-4">
                    <p>
                        <span class="font-medium">Taxa de Custódia:</span>
                        <span class="text-gray-300">€2.00 por mês ({formatCurrency(sp500CustodyFees + dowCustodyFees + nasdaqCustodyFees)} total)</span>
                        <span class="block text-sm text-gray-400">Valor fixo de €2.00 × {monthsDiff} meses</span>
                    </p>
                </div>
            </div>

            <div>
                <h3 class="font-medium text-lg">Impostos sobre Mais-Valias</h3>
                <div class="pl-4">
                    <p>
                        <span class="font-medium">IRS sobre Mais-Valias:</span>
                        <span class="text-gray-300">28% sobre o lucro ({formatCurrency(sp500CapitalGainsTax + dowCapitalGainsTax + nasdaqCapitalGainsTax)} total)</span>
                        <span class="block text-sm text-gray-400">Aplicado sobre o lucro total ({formatCurrency(totalGrossProfit)} × 28%)</span>
                    </p>
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


