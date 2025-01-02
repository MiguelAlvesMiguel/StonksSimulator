<script lang="ts">
    import { historical2024Data, historical2025Data } from '$lib/stores/historicalData';
    import type { IndexData } from '$lib/types';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import Chart from 'chart.js/auto';

    let selectedYear = '2024';
    let investmentAmount = 10000;
    let selectedIndex = 'SP500';
    let chart: Chart | null = null;

    $: historicalData = selectedYear === '2024' ? historical2024Data : historical2025Data;
    $: indexData = [...historicalData[selectedIndex as keyof typeof historicalData]].reverse();
    $: startDate = indexData[0].date;
    $: endDate = indexData[indexData.length - 1].date;
    $: startPrice = indexData[0].value;
    $: endPrice = indexData[indexData.length - 1].value;
    $: shares = investmentAmount / startPrice;
    $: finalValue = shares * endPrice;
    $: grossProfit = finalValue - investmentAmount;
    $: buyTax = investmentAmount * 0.002; // 0.2% transaction tax
    $: sellTax = finalValue * 0.002; // 0.2% transaction tax
    $: profitTax = grossProfit > 0 ? grossProfit * 0.28 : 0; // 28% capital gains tax
    $: totalTaxes = buyTax + sellTax + profitTax;
    $: netProfit = grossProfit - totalTaxes;
    $: profitPercentage = (netProfit / investmentAmount) * 100;

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

    function updateChart() {
        if (!browser) return;
        
        if (chart) {
            chart.destroy();
        }

        const ctx = document.getElementById('indexChart') as HTMLCanvasElement;
        if (!ctx) return;

        const labels = indexData.map(d => formatDate(d.date));
        const values = indexData.map(d => d.value);
        const investmentValues = indexData.map(d => (shares * d.value));

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: `Valor do ${selectedIndex} (EUR)`,
                        data: values,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    },
                    {
                        label: 'Valor do Investimento (EUR)',
                        data: investmentValues,
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value as number);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    onMount(() => {
        updateChart();
        return () => {
            if (chart) {
                chart.destroy();
            }
        };
    });

    $: {
        if (browser && (selectedIndex || selectedYear)) {
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
                    <label for="index-select" class="block mb-2">Selecionar Índice:</label>
                    <select
                        id="index-select"
                        bind:value={selectedIndex}
                        class="w-full p-2 bg-gray-700 rounded"
                    >
                        <option value="SP500">S&P 500</option>
                        <option value="DOW">Dow Jones</option>
                    </select>
                </div>
                <div>
                    <label for="investment-amount" class="block mb-2">Montante do Investimento (EUR):</label>
                    <input
                        id="investment-amount"
                        type="number"
                        bind:value={investmentAmount}
                        class="w-full p-2 bg-gray-700 rounded text-white"
                        min="1"
                    />
                </div>
            </div>
        </div>

        <div class="bg-gray-800 p-4 rounded-lg">
            <h2 class="text-xl font-semibold mb-4">Resultados do Investimento</h2>
            <div class="space-y-2">
                <p>Período: {formatDate(startDate)} a {formatDate(endDate)}</p>
                <p>Investimento Inicial: {formatCurrency(investmentAmount)}</p>
                <p>Valor Final: {formatCurrency(finalValue)}</p>
                <p>Lucro Bruto: {formatCurrency(grossProfit)}</p>
                <p class="text-red-400">Imposto de Transação (Compra): {formatCurrency(buyTax)}</p>
                <p class="text-red-400">Imposto de Transação (Venda): {formatCurrency(sellTax)}</p>
                <p class="text-red-400">Imposto sobre Mais-Valias: {formatCurrency(profitTax)}</p>
                <p class="text-red-400">Total de Impostos: {formatCurrency(totalTaxes)}</p>
                <p class="text-xl font-bold mt-4">Lucro Líquido: {formatCurrency(netProfit)}</p>
                <p>Retorno: {formatPercentage(profitPercentage)}</p>
            </div>
        </div>
    </div>

    <div class="bg-gray-800 p-4 rounded-lg">
        <h2 class="text-xl font-semibold mb-4">Gráfico de Desempenho</h2>
        <canvas id="indexChart"></canvas>
    </div>
</div>

<style>
    :global(body) {
        background-color: rgb(17, 24, 39);
        margin: 0;
        padding: 0;
    }
</style>

