<script lang="ts">
    import type { IndexType } from '$lib/types';
    import { mockIndexData } from '$lib/stores/mockData';
    import IndexChart from '$lib/components/IndexChart.svelte';

    let investmentAmount = 10000;

    $: sp500Return = calculateReturn('SP500', investmentAmount);
    $: dowReturn = calculateReturn('DOW', investmentAmount);
    $: combinedReturn = {
        value: sp500Return.value + dowReturn.value,
        percentage: (sp500Return.percentage + dowReturn.percentage) / 2,
        taxes: {
            buy: sp500Return.taxes.buy + dowReturn.taxes.buy,
            sell: sp500Return.taxes.sell + dowReturn.taxes.sell,
            capitalGains: sp500Return.taxes.capitalGains + dowReturn.taxes.capitalGains,
            total: sp500Return.taxes.total + dowReturn.taxes.total
        },
        netValue: sp500Return.netValue + dowReturn.netValue
    };
    $: monthlyAverage = combinedReturn.value / 12;

    interface ReturnCalculation {
        percentage: number;
        value: number;
        taxes: {
            buy: number;
            sell: number;
            capitalGains: number;
            total: number;
        };
        netValue: number;
    }
    
    function calculateReturn(index: IndexType, amount: number): ReturnCalculation {
        const data = mockIndexData[index];
        if (data.length < 2) return {
            percentage: 0,
            value: 0,
            taxes: { buy: 0, sell: 0, capitalGains: 0, total: 0 },
            netValue: 0
        };
        
        const initialValue = data[0].value;
        const finalValue = data[data.length - 1].value;
        const shares = amount / initialValue;
        const finalInvestmentValue = shares * finalValue;
        const profitLoss = finalInvestmentValue - amount;
        
        const buyTax = amount * 0.002;
        const sellTax = profitLoss > 0 ? profitLoss * 0.002 : 0;
        const capitalGainsTax = profitLoss > 0 ? profitLoss * 0.28 : 0;
        const totalTax = buyTax + sellTax + capitalGainsTax;
        
        return {
            percentage: ((finalValue - initialValue) / initialValue) * 100,
            value: profitLoss,
            taxes: {
                buy: buyTax,
                sell: sellTax,
                capitalGains: capitalGainsTax,
                total: totalTax
            },
            netValue: profitLoss - totalTax
        };
    }

    function formatCurrency(value: number): string {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    }

    function formatPercentage(value: number): string {
        return new Intl.NumberFormat('pt-PT', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(value / 100);
    }
</script>

<div class="min-h-screen bg-gray-900 text-gray-100">
    <main class="container mx-auto px-4 py-8">
        <div class="text-center mb-8">
            <h1 class="text-4xl font-bold mb-6 bg-gradient-to-r from-red-500 to-red-800 bg-clip-text text-transparent">
                Simulador de Investimento em Índices
            </h1>
            
            <div class="max-w-md mx-auto bg-gray-800 rounded-lg p-6 shadow-lg">
                <label class="block text-sm font-medium mb-2">Investimento Inicial</label>
                <div class="flex gap-4 items-center">
                    <input
                        type="range"
                        bind:value={investmentAmount}
                        min="1000"
                        max="100000"
                        step="1000"
                        class="flex-1 accent-red-500"
                    />
                    <input
                        type="number"
                        bind:value={investmentAmount}
                        min="1000"
                        step="1000"
                        class="w-32 px-3 py-2 bg-gray-700 rounded-md text-right"
                    />
                </div>
                <p class="mt-2 text-sm text-gray-400">
                    ({formatCurrency(investmentAmount)} em cada índice)
                </p>
            </div>
        </div>

        <div class="space-y-8">
            <!-- Combined Performance -->
            <div class="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                <div class="p-6 bg-gradient-to-r from-red-900 to-red-800">
                    <h2 class="text-2xl font-bold mb-4">Desempenho Total da Carteira</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <div class="text-sm opacity-80">Retorno Total</div>
                            <div class="text-2xl font-bold text-red-400">{formatPercentage(combinedReturn.percentage)}</div>
                        </div>
                        <div>
                            <div class="text-sm opacity-80">Lucro Bruto</div>
                            <div class="text-2xl font-bold text-red-400">{formatCurrency(combinedReturn.value)}</div>
                        </div>
                        <div>
                            <div class="text-sm opacity-80">Total de Impostos</div>
                            <div class="text-2xl font-bold text-red-400">{formatCurrency(combinedReturn.taxes.total)}</div>
                        </div>
                        <div>
                            <div class="text-sm opacity-80">Lucro Líquido</div>
                            <div class="text-2xl font-bold text-red-400">{formatCurrency(combinedReturn.netValue)}</div>
                        </div>
                    </div>
                    <div class="mt-4 text-sm opacity-80">
                        Retorno Médio Mensal: {formatCurrency(monthlyAverage)}
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="h-[400px] mb-6">
                        <IndexChart 
                            data={[...mockIndexData.SP500, ...mockIndexData.DOW]}
                            investmentAmount={investmentAmount * 2}
                            isCombined={true}
                        />
                    </div>
                </div>
            </div>

            <!-- Individual Indices -->
            <div class="grid md:grid-cols-2 gap-8">
                <!-- S&P 500 -->
                <div class="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                    <div class="p-6 bg-gradient-to-r from-red-900 to-red-800">
                        <h2 class="text-2xl font-bold mb-2">S&P 500</h2>
                        <div class="flex gap-6">
                            <div>
                                <div class="text-sm opacity-80">Retorno</div>
                                <div class="text-2xl font-bold text-red-400">{formatPercentage(sp500Return.percentage)}</div>
                            </div>
                            <div>
                                <div class="text-sm opacity-80">Lucro Líquido</div>
                                <div class="text-2xl font-bold text-red-400">{formatCurrency(sp500Return.netValue)}</div>
                            </div>
                        </div>
                        <div class="mt-2 text-sm opacity-80">
                            Impostos: {formatCurrency(sp500Return.taxes.total)}
                        </div>
                    </div>
                    <div class="p-4 h-[300px]">
                        <IndexChart 
                            data={mockIndexData.SP500}
                            investmentAmount={investmentAmount}
                        />
                    </div>
                </div>

                <!-- Dow Jones -->
                <div class="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                    <div class="p-6 bg-gradient-to-r from-red-900 to-red-800">
                        <h2 class="text-2xl font-bold mb-2">Dow Jones</h2>
                        <div class="flex gap-6">
                            <div>
                                <div class="text-sm opacity-80">Retorno</div>
                                <div class="text-2xl font-bold text-red-400">{formatPercentage(dowReturn.percentage)}</div>
                            </div>
                            <div>
                                <div class="text-sm opacity-80">Lucro Líquido</div>
                                <div class="text-2xl font-bold text-red-400">{formatCurrency(dowReturn.netValue)}</div>
                            </div>
                        </div>
                        <div class="mt-2 text-sm opacity-80">
                            Impostos: {formatCurrency(dowReturn.taxes.total)}
                        </div>
                    </div>
                    <div class="p-4 h-[300px]">
                        <IndexChart 
                            data={mockIndexData.DOW}
                            investmentAmount={investmentAmount}
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-8 text-center text-sm text-gray-500">
            <p>* Simulação baseada em retorno anual alvo de 20%.</p>
            <p>* Impostos portugueses: 0,2% na compra, 0,2% sobre lucros na venda e 28% sobre mais-valias.</p>
        </div>
    </main>
</div>

<style lang="postcss">
    :global(body) {
        @apply bg-gray-50;
    }
</style>
