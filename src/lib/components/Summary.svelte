<script lang="ts">
    import type { Investment } from '$lib/types';

    export let investments: Investment[] = [];

    $: summary = investments.reduce(
        (acc, inv) => {
            const currentValue = inv.currentValue || 0;
            const profitLoss = inv.profitLoss || 0;
            const estimatedTax = inv.estimatedTax || 0;

            return {
                totalInvestment: acc.totalInvestment + inv.investmentAmount,
                totalCurrentValue: acc.totalCurrentValue + currentValue,
                totalProfitLoss: acc.totalProfitLoss + profitLoss,
                totalProfitLossPercentage: 0, // Will be calculated below
                totalEstimatedTax: acc.totalEstimatedTax + estimatedTax
            };
        },
        {
            totalInvestment: 0,
            totalCurrentValue: 0,
            totalProfitLoss: 0,
            totalProfitLossPercentage: 0,
            totalEstimatedTax: 0
        }
    );

    $: if (summary.totalInvestment > 0) {
        summary.totalProfitLossPercentage = (summary.totalProfitLoss / summary.totalInvestment) * 100;
    }

    function formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    }

    function formatPercentage(value: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value / 100);
    }
</script>

{#if investments.length > 0}
    <div class="bg-white rounded-lg shadow-md p-4 mt-8">
        <h2 class="text-xl font-semibold mb-4">Portfolio Summary</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div class="stat-card">
                <span class="label">Total Investment</span>
                <span class="value">{formatCurrency(summary.totalInvestment)}</span>
            </div>
            <div class="stat-card">
                <span class="label">Current Value</span>
                <span class="value">{formatCurrency(summary.totalCurrentValue)}</span>
            </div>
            <div class="stat-card">
                <span class="label">Total Profit/Loss</span>
                <span class="value" class:text-green-600={summary.totalProfitLoss > 0} class:text-red-600={summary.totalProfitLoss < 0}>
                    {formatCurrency(summary.totalProfitLoss)}
                </span>
            </div>
            <div class="stat-card">
                <span class="label">Total P/L %</span>
                <span class="value" class:text-green-600={summary.totalProfitLossPercentage > 0} class:text-red-600={summary.totalProfitLossPercentage < 0}>
                    {formatPercentage(summary.totalProfitLossPercentage)}
                </span>
            </div>
            <div class="stat-card">
                <span class="label">Est. Total Tax</span>
                <span class="value">{formatCurrency(summary.totalEstimatedTax)}</span>
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
</style> 