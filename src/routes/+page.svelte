<script lang="ts">
    import { historical2024Data, historical2025Data } from '$lib/stores/historicalData';
    import type { IndexData } from '$lib/types';
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { Chart, type ChartConfiguration } from 'chart.js/auto';
    import type { ChartEvent } from 'chart.js';

    let selectedYear = '2024';
    let investmentAmount = 10000;
    let chart: Chart | null = null;
    let viewMode: 'SP500' | 'DOW' | 'COMBINED' = 'COMBINED';

    $: historicalData = selectedYear === '2024' ? historical2024Data : historical2025Data;
    $: sp500Data = [...historicalData.SP500].reverse();
    $: dowData = [...historicalData.DOW].reverse();
    
    // Portuguese tax rates and fees
    const TRANSACTION_TAX = 0.002; // 0.2% Imposto do Selo
    const CAPITAL_GAINS_TAX = 0.28; // 28% sobre mais-valias
    const BROKER_FEE = 0.0025; // 0.25% comissão do broker
    const CUSTODY_FEE_MONTHLY = 2; // €2/mês taxa de custódia
    const MARKET_ACCESS_FEE = 0.0005; // 0.05% taxa de acesso ao mercado
    const EXCHANGE_FEE = 0.0002; // 0.02% taxa de bolsa

    // Calculate metrics for S&P 500
    $: sp500Shares = investmentAmount / sp500Data[0].value;
    $: sp500FinalValue = sp500Shares * sp500Data[sp500Data.length - 1].value;
    $: sp500GrossProfit = sp500FinalValue - investmentAmount;
    
    // S&P 500 Buy fees
    $: sp500BuyTransactionTax = investmentAmount * TRANSACTION_TAX;
    $: sp500BuyBrokerFee = investmentAmount * BROKER_FEE;
    $: sp500BuyMarketFee = investmentAmount * MARKET_ACCESS_FEE;
    $: sp500BuyExchangeFee = investmentAmount * EXCHANGE_FEE;
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
    $: dowShares = investmentAmount / dowData[0].value;
    $: dowFinalValue = dowShares * dowData[dowData.length - 1].value;
    $: dowGrossProfit = dowFinalValue - investmentAmount;
    
    // Dow Jones Buy fees
    $: dowBuyTransactionTax = investmentAmount * TRANSACTION_TAX;
    $: dowBuyBrokerFee = investmentAmount * BROKER_FEE;
    $: dowBuyMarketFee = investmentAmount * MARKET_ACCESS_FEE;
    $: dowBuyExchangeFee = investmentAmount * EXCHANGE_FEE;
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

    // Calculate combined portfolio metrics
    $: totalInvestment = investmentAmount * 2;
    $: totalFinalValue = sp500FinalValue + dowFinalValue;
    $: totalGrossProfit = sp500GrossProfit + dowGrossProfit;
    $: totalFees = sp500TotalFees + dowTotalFees;
    $: totalTaxes = sp500TotalTaxes + dowTotalTaxes;
    $: totalCosts = sp500TotalCosts + dowTotalCosts;
    $: totalNetProfit = sp500NetProfit + dowNetProfit;
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
        sp500Index: true,
        dowIndex: true,
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
        let lastMonthValue = totalInvestment;
        let currentMonth = '';

        sp500Data.forEach((data, i) => {
            const date = new Date(data.date);
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (month !== currentMonth) {
                if (currentMonth) {
                    const totalValue = (sp500Shares * data.value) + (dowShares * dowData[i].value);
                    const monthReturn = ((totalValue - lastMonthValue) / lastMonthValue) * 100;
                    monthlyData.push({ date: currentMonth, return: monthReturn });
                    lastMonthValue = totalValue;
                }
                currentMonth = month;
            }
        });

        return monthlyData;
    }

    interface CumulativeDataPoint {
        date: string;
        return: number;
    }

    let chartRef: Chart | null = null;
    let taxData: { label: string; value: number; }[] = [];

    function updateChart() {
        if (!browser) return;
        
        if (chart) {
            chart.destroy();
        }

        const ctx = document.getElementById(graphType === 'tax-breakdown' ? 'costDistributionChart' : 'indexChart');
        if (!(ctx instanceof HTMLCanvasElement)) return;

        if (graphType === 'tax-breakdown') {
            const totalTransactionTax = sp500BuyTransactionTax + sp500SellTransactionTax + dowBuyTransactionTax + dowSellTransactionTax;
            const totalCapitalGainsTax = sp500CapitalGainsTax + dowCapitalGainsTax;
            const totalBrokerageFees = sp500BuyBrokerFee + sp500SellBrokerFee + dowBuyBrokerFee + dowSellBrokerFee;

            const chartData = {
                labels: ['Impostos de Transação', 'Impostos sobre Lucros', 'Custos de Corretagem'],
                datasets: [{
                    data: [totalTransactionTax, totalCapitalGainsTax, totalBrokerageFees],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 1
                }]
            };

            chart = new Chart(ctx, {
                type: 'pie',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: 'white'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Distribuição de Custos',
                            color: 'white',
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            });
        } else if (graphType === 'performance') {
            const labels = sp500Data.map(d => formatDate(d.date));
            let datasets = [];

            // Color scheme
            const colors = {
                sp500: 'rgb(59, 130, 246)', // blue-500
                dow: 'rgb(16, 185, 129)',   // emerald-500
                portfolio: 'rgb(168, 85, 247)' // purple-600
            };

            if (visibleStocks.sp500Index) {
                datasets.push({
                    label: 'S&P 500',
                    data: sp500Data.map(d => d.value),
                    borderColor: colors.sp500,
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                });
            }

            if (visibleStocks.dowIndex) {
                datasets.push({
                    label: 'Dow Jones',
                    data: dowData.map(d => d.value),
                    borderColor: colors.dow,
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                });
            }

            if (visibleStocks.totalPortfolio) {
                datasets.push({
                    label: 'Carteira Total',
                    data: sp500Data.map((d, i) => (sp500Shares * d.value) + (dowShares * dowData[i].value)),
                    borderColor: colors.portfolio,
                    borderWidth: 3,
                    tension: 0.1,
                    fill: false
                });
            }

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
                                callback: function(this: any, tickValue: string | number) {
                                    if (typeof tickValue === 'number') {
                                        return formatCurrency(tickValue);
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
</script>

<div class="container mx-auto p-4 bg-gray-900 text-white min-h-screen">
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
                    </select>
                </div>
                <div>
                    <label for="investment-amount" class="block mb-2">Montante por Índice (EUR):</label>
                    <input
                        id="investment-amount"
                        type="number"
                        bind:value={investmentAmount}
                        class="w-full p-2 bg-gray-700 rounded text-white"
                        min="1"
                    />
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
                                bind:checked={visibleStocks.totalPortfolio}
                                on:change={updateChart}
                                class="form-checkbox text-purple-600"
                            />
                            <span class="text-sm whitespace-nowrap text-purple-400 font-medium">Carteira Total</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-gray-800 p-4 rounded-lg">
            <h2 class="text-xl font-semibold mb-4">Resultados da Carteira</h2>
            <div class="space-y-2">
                <p>Período: {formatDate(sp500Data[0].date)} a {formatDate(sp500Data[sp500Data.length - 1].date)}</p>
                <p>Duração: {calculateDuration(sp500Data[0].date, sp500Data[sp500Data.length - 1].date)}</p>
                
                <div class="mt-4">
                    <h3 class="font-semibold text-lg">Investimento Total: {formatCurrency(totalInvestment)}</h3>
                    <div class="pl-4 mt-2 space-y-1">
                        <p>S&P 500: {formatCurrency(investmentAmount)}</p>
                        <p>Dow Jones: {formatCurrency(investmentAmount)}</p>
                    </div>
                </div>

                <div class="mt-4">
                    <h3 class="font-semibold text-lg">Valor Final: {formatCurrency(totalFinalValue)}</h3>
                    <div class="pl-4 mt-2 space-y-1">
                        <p>S&P 500: {formatCurrency(sp500FinalValue)}</p>
                        <p>Dow Jones: {formatCurrency(dowFinalValue)}</p>
                    </div>
                </div>

                <div class="mt-4">
                    <h3 class="font-semibold text-lg">Lucro Bruto: {formatCurrency(totalGrossProfit)}</h3>
                    <div class="pl-4 mt-2 space-y-1">
                        <p>S&P 500: {formatCurrency(sp500GrossProfit)}</p>
                        <p>Dow Jones: {formatCurrency(dowGrossProfit)}</p>
                    </div>
                </div>

                <div class="mt-4">
                    <h3 class="font-semibold text-lg text-red-400">Custos e Impostos</h3>
                    
                    <div class="pl-4 mt-2">
                        <h4 class="font-medium">Custos de Compra</h4>
                        <div class="pl-4 space-y-1 text-sm">
                            <p>Imposto do Selo: {formatCurrency(sp500BuyTransactionTax + dowBuyTransactionTax)}</p>
                            <p>Comissão do Broker: {formatCurrency(sp500BuyBrokerFee + dowBuyBrokerFee)}</p>
                            <p>Taxa de Acesso ao Mercado: {formatCurrency(sp500BuyMarketFee + dowBuyMarketFee)}</p>
                            <p>Taxa de Bolsa: {formatCurrency(sp500BuyExchangeFee + dowBuyExchangeFee)}</p>
                        </div>
                    </div>

                    <div class="pl-4 mt-2">
                        <h4 class="font-medium">Custos de Venda</h4>
                        <div class="pl-4 space-y-1 text-sm">
                            <p>Imposto do Selo: {formatCurrency(sp500SellTransactionTax + dowSellTransactionTax)}</p>
                            <p>Comissão do Broker: {formatCurrency(sp500SellBrokerFee + dowSellBrokerFee)}</p>
                            <p>Taxa de Acesso ao Mercado: {formatCurrency(sp500SellMarketFee + dowSellMarketFee)}</p>
                            <p>Taxa de Bolsa: {formatCurrency(sp500SellExchangeFee + dowSellExchangeFee)}</p>
                        </div>
                    </div>

                    <div class="pl-4 mt-2">
                        <h4 class="font-medium">Custos de Manutenção</h4>
                        <div class="pl-4 space-y-1 text-sm">
                            <p>Taxa de Custódia ({monthsDiff} meses): {formatCurrency(sp500CustodyFees + dowCustodyFees)}</p>
                        </div>
                    </div>

                    <div class="pl-4 mt-2">
                        <h4 class="font-medium">Impostos sobre Mais-Valias</h4>
                        <div class="pl-4 space-y-1 text-sm">
                            <p>S&P 500 (28%): {formatCurrency(sp500CapitalGainsTax)}</p>
                            <p>Dow Jones (28%): {formatCurrency(dowCapitalGainsTax)}</p>
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
        <div class="h-[600px]">
            {#if graphType === 'tax-breakdown'}
                <canvas id="costDistributionChart"></canvas>
            {:else}
                <canvas id="indexChart"></canvas>
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
                        <span class="text-gray-300">0.2% sobre o valor da transação ({formatCurrency(sp500BuyTransactionTax + dowBuyTransactionTax)} na compra, {formatCurrency(sp500SellTransactionTax + dowSellTransactionTax)} na venda)</span>
                        <span class="block text-sm text-gray-400">Aplicado na compra ({formatCurrency(totalInvestment)} × 0.2%) e venda ({formatCurrency(totalFinalValue)} × 0.2%)</span>
                    </p>
                    <p>
                        <span class="font-medium">Comissão do Broker:</span>
                        <span class="text-gray-300">0.25% sobre o valor da transação ({formatCurrency(sp500BuyBrokerFee + dowBuyBrokerFee + sp500SellBrokerFee + dowSellBrokerFee)} total)</span>
                        <span class="block text-sm text-gray-400">Aplicado na compra ({formatCurrency(totalInvestment)} × 0.25%) e venda ({formatCurrency(totalFinalValue)} × 0.25%)</span>
                    </p>
                    <p>
                        <span class="font-medium">Taxa de Acesso ao Mercado:</span>
                        <span class="text-gray-300">0.05% sobre o valor da transação ({formatCurrency(sp500BuyMarketFee + dowBuyMarketFee + sp500SellMarketFee + dowSellMarketFee)} total)</span>
                        <span class="block text-sm text-gray-400">Aplicado na compra ({formatCurrency(totalInvestment)} × 0.05%) e venda ({formatCurrency(totalFinalValue)} × 0.05%)</span>
                    </p>
                    <p>
                        <span class="font-medium">Taxa de Bolsa:</span>
                        <span class="text-gray-300">0.02% sobre o valor da transação ({formatCurrency(sp500BuyExchangeFee + dowBuyExchangeFee + sp500SellExchangeFee + dowSellExchangeFee)} total)</span>
                        <span class="block text-sm text-gray-400">Aplicado na compra ({formatCurrency(totalInvestment)} × 0.02%) e venda ({formatCurrency(totalFinalValue)} × 0.02%)</span>
                    </p>
                </div>
            </div>

            <div>
                <h3 class="font-medium text-lg">Custos de Manutenção</h3>
                <div class="pl-4">
                    <p>
                        <span class="font-medium">Taxa de Custódia:</span>
                        <span class="text-gray-300">€2.00 por mês ({formatCurrency(sp500CustodyFees + dowCustodyFees)} total)</span>
                        <span class="block text-sm text-gray-400">Valor fixo de €2.00 × {monthsDiff} meses</span>
                    </p>
                </div>
            </div>

            <div>
                <h3 class="font-medium text-lg">Impostos sobre Mais-Valias</h3>
                <div class="pl-4">
                    <p>
                        <span class="font-medium">IRS sobre Mais-Valias:</span>
                        <span class="text-gray-300">28% sobre o lucro ({formatCurrency(sp500CapitalGainsTax + dowCapitalGainsTax)} total)</span>
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


