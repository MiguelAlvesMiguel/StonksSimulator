<script lang="ts">
    import { onMount, afterUpdate } from 'svelte';
    import Chart from 'chart.js/auto';
    import type { IndexData } from '$lib/types';

    export let data: IndexData[] = [];
    export let investmentAmount: number = 0;

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
        const initialShares = investmentAmount / initialValue;

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { 
                    month: 'short',
                    year: 'numeric'
                })),
                datasets: [
                    {
                        label: 'Your Investment',
                        data: data.map(d => (d.value / initialValue) * investmentAmount),
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
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
                                return new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'EUR'
                                }).format(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 6
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'EUR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(value as number);
                            }
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