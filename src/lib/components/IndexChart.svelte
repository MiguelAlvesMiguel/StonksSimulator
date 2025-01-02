<script lang="ts">
    import { onMount, afterUpdate } from 'svelte';
    import Chart from 'chart.js/auto';
    import type { IndexData } from '$lib/types';

    export let data: IndexData[] = [];
    export let investmentAmount: number = 0;
    export let isCombined: boolean = false;

    let canvas: HTMLCanvasElement;
    let chart: Chart;

    onMount(() => {
        createChart();
    });

    afterUpdate(() => {
        if (chart) {
            chart.destroy();
        }
        createChart();
    });

    function createChart() {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const initialValue = data[0]?.value || 0;
        const chartData = {
            labels: data.map(d => new Date(d.date).toLocaleDateString('pt-PT', { 
                month: 'short',
                year: 'numeric'
            })),
            datasets: [{
                label: isCombined ? 'Carteira Total' : 'Valor do Investimento',
                data: data.map(d => (d.value / initialValue) * investmentAmount),
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };

        chart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return new Intl.NumberFormat('pt-PT', {
                                    style: 'currency',
                                    currency: 'EUR'
                                }).format(context.parsed.y);
                            }
                        },
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#374151',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            color: '#374151'
                        },
                        ticks: {
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 6,
                            color: '#9CA3AF'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(55, 65, 81, 0.3)'
                        },
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('pt-PT', {
                                    style: 'currency',
                                    currency: 'EUR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(value as number);
                            },
                            color: '#9CA3AF'
                        }
                    }
                }
            }
        });
    }
</script>

<div class="w-full h-full">
    <canvas bind:this={canvas}></canvas>
</div> 