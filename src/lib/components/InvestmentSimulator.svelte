<script lang="ts">
    import type { IndexType, InvestmentSimulation } from '$lib/types';
    import { mockIndexData } from '$lib/stores/mockData';
    import IndexChart from './IndexChart.svelte';
    import { onMount } from 'svelte';

    export let index: IndexType;

    const INVESTMENT_AMOUNT = 10000;
    let simulation: InvestmentSimulation | null = null;

    // Calculate dates for last 2 months
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 2);
    const startDateStr = startDate.toISOString().split('T')[0];

    onMount(() => {
        calculateInvestment();
    });

    function calculateInvestment() {
        const indexData = mockIndexData[index];
        const startPrice = indexData.find(d => d.date === startDateStr)?.value || 0;
        const endPrice = indexData.find(d => d.date === endDate)?.value || 0;

        if (startPrice && endPrice) {
            const shares = INVESTMENT_AMOUNT / startPrice;
            const finalValue = shares * endPrice;
            const profitLoss = finalValue - INVESTMENT_AMOUNT;
            const profitLossPercentage = (profitLoss / INVESTMENT_AMOUNT) * 100;

            // Portuguese taxes:
            // 0.2% transaction tax on buy
            const buyTax = INVESTMENT_AMOUNT * 0.002;
            // 0.2% transaction tax on sell
            const sellTax = finalValue * 0.002;
            // 28% capital gains tax on profits
            const capitalGainsTax = profitLoss > 0 ? profitLoss * 0.28 : 0;
            
            // Net profit after all taxes
            const netProfit = profitLoss - buyTax - sellTax - capitalGainsTax;

            simulation = {
                indexType: index,
                investmentAmount: INVESTMENT_AMOUNT,
                startDate: startDateStr,
                endDate,
                initialPrice: startPrice,
                finalPrice: endPrice,
                shares,
                finalValue,
                profitLoss,
                profitLossPercentage,
                buyTax,
                sellTax,
                capitalGainsTax,
                netProfit
            };
        }
    }

    function formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }

    function formatPercentage(value: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value / 100);
    }

    function formatShares(value: number): string {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
        }).format(value);
    }
</script>

{#if simulation}
<div class="space-y-6">
    <!-- Chart Section -->
    <IndexChart 
        data={mockIndexData[index]} 
        startDate={startDateStr}
        endDate={endDate}
        investmentAmount={INVESTMENT_AMOUNT}
    />

    <!-- Results Section -->
    <div class="bg-white rounded-lg shadow-md p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="stat-card">
                <span class="label">Investment Details</span>
                <div class="value-group">
                    <div>Amount: {formatCurrency(simulation.investmentAmount)}</div>
                    <div>Shares: {formatShares(simulation.shares)}</div>
                </div>
            </div>

            <div class="stat-card">
                <span class="label">Price Information</span>
                <div class="value-group">
                    <div>Initial: {formatCurrency(simulation.initialPrice)}</div>
                    <div>Final: {formatCurrency(simulation.finalPrice)}</div>
                </div>
            </div>

            <div class="stat-card">
                <span class="label">Gross Profit/Loss</span>
                <span class="value" class:text-green-600={simulation.profitLoss > 0} class:text-red-600={simulation.profitLoss < 0}>
                    {formatCurrency(simulation.profitLoss)}
                    ({formatPercentage(simulation.profitLossPercentage)})
                </span>
            </div>

            <div class="stat-card">
                <span class="label">After Tax Profit</span>
                <div class="space-y-2">
                    <span class="value" class:text-green-600={simulation.netProfit > 0} class:text-red-600={simulation.netProfit < 0}>
                        {formatCurrency(simulation.netProfit)}
                    </span>
                    <div class="text-sm text-gray-500">
                        Total Tax: {formatCurrency(simulation.buyTax + simulation.sellTax + simulation.capitalGainsTax)}
                        <div class="text-xs mt-1">
                            (Buy: {formatCurrency(simulation.buyTax)}, 
                            Sell: {formatCurrency(simulation.sellTax)}, 
                            Capital Gains: {formatCurrency(simulation.capitalGainsTax)})
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
{/if}

<style lang="postcss">
    .stat-card {
        @apply p-4 bg-gray-50 rounded-lg;
    }

    .label {
        @apply block text-sm font-medium text-gray-500 mb-1;
    }

    .value {
        @apply block text-lg font-semibold;
    }

    .value-group {
        @apply space-y-1 font-medium;
    }
</style> 