<script lang="ts">
    import type { IndexType } from '$lib/types';
    import { mockIndexData } from '$lib/stores/mockData';
    import IndexChart from '$lib/components/IndexChart.svelte';

    const INVESTMENT_AMOUNT = 10000;
    
    // Calculate yearly returns
    function calculateReturn(index: IndexType) {
        const data = mockIndexData[index];
        if (data.length < 2) return { percentage: 0, value: 0 };
        
        const initialValue = data[0].value;
        const finalValue = data[data.length - 1].value;
        const shares = INVESTMENT_AMOUNT / initialValue;
        const finalInvestmentValue = shares * finalValue;
        
        return {
            percentage: ((finalValue - initialValue) / initialValue) * 100,
            value: finalInvestmentValue - INVESTMENT_AMOUNT
        };
    }

    const sp500Return = calculateReturn('SP500');
    const dowReturn = calculateReturn('DOW');

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
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(value / 100);
    }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
    <main class="container mx-auto px-4 py-12">
        <div class="text-center mb-12">
            <h1 class="text-5xl font-bold text-gray-900 mb-6">Investment Growth Over Time</h1>
            <div class="text-2xl font-medium text-blue-600 mb-8">
                Initial Investment: {formatCurrency(INVESTMENT_AMOUNT)}
            </div>
        </div>
        
        <div class="space-y-12 max-w-6xl mx-auto">
            <!-- S&P 500 Section -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="p-6 bg-gradient-to-r from-blue-500 to-blue-600">
                    <h2 class="text-2xl font-bold text-white mb-2">S&P 500</h2>
                    <div class="flex gap-6 text-white">
                        <div>
                            <div class="text-sm opacity-90">Return</div>
                            <div class="text-2xl font-bold">{formatPercentage(sp500Return.percentage)}</div>
                        </div>
                        <div>
                            <div class="text-sm opacity-90">Profit/Loss</div>
                            <div class="text-2xl font-bold">{formatCurrency(sp500Return.value)}</div>
                        </div>
                    </div>
                </div>
                <div class="p-4 h-[300px]">
                    <IndexChart 
                        data={mockIndexData.SP500}
                        investmentAmount={INVESTMENT_AMOUNT}
                    />
                </div>
            </div>

            <!-- Dow Jones Section -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="p-6 bg-gradient-to-r from-indigo-500 to-indigo-600">
                    <h2 class="text-2xl font-bold text-white mb-2">Dow Jones</h2>
                    <div class="flex gap-6 text-white">
                        <div>
                            <div class="text-sm opacity-90">Return</div>
                            <div class="text-2xl font-bold">{formatPercentage(dowReturn.percentage)}</div>
                        </div>
                        <div>
                            <div class="text-sm opacity-90">Profit/Loss</div>
                            <div class="text-2xl font-bold">{formatCurrency(dowReturn.value)}</div>
                        </div>
                    </div>
                </div>
                <div class="p-4 h-[300px]">
                    <IndexChart 
                        data={mockIndexData.DOW}
                        investmentAmount={INVESTMENT_AMOUNT}
                    />
                </div>
            </div>
        </div>

        <div class="mt-8 text-center text-sm text-gray-500">
            <p>* Simulated data for the last year. Past performance does not guarantee future results.</p>
            <p>* All calculations include Portuguese transaction taxes (0.2%) and capital gains tax (28%).</p>
        </div>
    </main>
</div>

<style lang="postcss">
    :global(body) {
        @apply bg-gray-50;
    }
</style>
