<script lang="ts">
    import type { Investment } from '$lib/types';

    export let investments: Investment[] = [];

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

    function formatShares(value: number): string {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        }).format(value);
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
</script>

{#if investments.length === 0}
    <div class="text-center py-8 text-gray-500">
        No investments added yet. Use the form above to add your first investment.
    </div>
{:else}
    <div class="overflow-x-auto">
        <table class="min-w-full bg-white rounded-lg overflow-hidden">
            <thead class="bg-gray-100">
                <tr>
                    <th class="th">Date</th>
                    <th class="th">Stock</th>
                    <th class="th">Ticker</th>
                    <th class="th">Initial Price</th>
                    <th class="th">Shares</th>
                    <th class="th">Investment</th>
                    <th class="th">Current Price</th>
                    <th class="th">Current Value</th>
                    <th class="th">Profit/Loss</th>
                    <th class="th">P/L %</th>
                    <th class="th">Est. Tax</th>
                </tr>
            </thead>
            <tbody>
                {#each investments as investment}
                    <tr class="border-b hover:bg-gray-50">
                        <td class="td">{formatDate(investment.purchaseDate)}</td>
                        <td class="td">{investment.stockName}</td>
                        <td class="td">{investment.ticker}</td>
                        <td class="td">{formatCurrency(investment.initialPrice)}</td>
                        <td class="td">{formatShares(investment.shares || 0)}</td>
                        <td class="td">{formatCurrency(investment.investmentAmount)}</td>
                        <td class="td">{formatCurrency(investment.currentPrice)}</td>
                        <td class="td">{formatCurrency(investment.currentValue || 0)}</td>
                        <td class="td" class:text-green-600={investment.profitLoss > 0} class:text-red-600={investment.profitLoss < 0}>
                            {formatCurrency(investment.profitLoss || 0)}
                        </td>
                        <td class="td" class:text-green-600={investment.profitLossPercentage > 0} class:text-red-600={investment.profitLossPercentage < 0}>
                            {formatPercentage(investment.profitLossPercentage || 0)}
                        </td>
                        <td class="td">{formatCurrency(investment.estimatedTax || 0)}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/if}

<style lang="postcss">
    .th {
        @apply px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
    }

    .td {
        @apply px-4 py-3 text-sm text-gray-900 whitespace-nowrap;
    }
</style> 