<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
    import type { IndexData } from '$lib/types';

    export let data: IndexData[];
    export let investmentAmount: number;
    export let isCombined = false;

    let canvas: HTMLCanvasElement;
    let chart: Chart;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-PT', {
            day: 'numeric',
            month: 'short'
        });
    };

    $: if (canvas && data) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            if (chart) {
                chart.destroy();
            }

            const initialValue = data[0]?.value || 0;
            const shares = investmentAmount / initialValue;

            const chartData = {
                labels: data.map(d => formatDate(d.date)),
                datasets: [
                    {
                        label: isCombined ? 'Valor Total do Investimento' : 'Valor do Investimento',
                        data: data.map(d => d.value * shares),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#ef4444',
                        pointHoverBackgroundColor: '#ef4444',
                        pointBorderColor: '#fff',
                        pointHoverBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverBorderWidth: 2,
                        borderWidth: 2
                    }
                ]
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
                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                label: (context) => {
                                    return formatCurrency(context.parsed.y);
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false,
                                drawBorder: false
                            },
                            ticks: {
                                color: '#9ca3af',
                                font: {
                                    size: 10
                                },
                                maxRotation: 45,
                                minRotation: 45
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(75, 85, 99, 0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#9ca3af',
                                font: {
                                    size: 10
                                },
                                callback: function(value) {
                                    return formatCurrency(value as number);
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    onMount(() => {
        return () => {
            if (chart) {
                chart.destroy();
            }
        };
    });
</script>

<canvas bind:this={canvas}></canvas> 