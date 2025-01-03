<script lang="ts">
    import { onMount } from 'svelte';
    import type { IndexData } from '$lib/types';

    export let sp500Data: IndexData[];
    export let dowData: IndexData[];
    export let nasdaqData: IndexData[];
    export let nancData: IndexData[];
    export let nvdaData: IndexData[];

    let sp500Change = 0;
    let dowChange = 0;
    let nasdaqChange = 0;
    let nancChange = 0;
    let nvdaChange = 0;

    function calculatePercentageChange(data: IndexData[]): number {
        if (!data || data.length < 2) return 0;
        const firstValue = data[0].value;
        const lastValue = data[data.length - 1].value;
        return ((lastValue - firstValue) / firstValue) * 100;
    }

    function formatPercentage(value: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value / 100);
    }

    $: {
        sp500Change = calculatePercentageChange(sp500Data);
        dowChange = calculatePercentageChange(dowData);
        nasdaqChange = calculatePercentageChange(nasdaqData);
        nancChange = calculatePercentageChange(nancData);
        nvdaChange = calculatePercentageChange(nvdaData);
    }
</script>

<div class="grid grid-cols-1 md:grid-cols-5 gap-4">
    <div class="bg-white rounded-lg shadow-md p-4">
        <h3 class="text-lg font-semibold mb-2">S&P 500</h3>
        <p class="text-2xl font-bold {sp500Change >= 0 ? 'text-green-600' : 'text-red-600'}">
            {sp500Change >= 0 ? '+' : ''}{formatPercentage(sp500Change)}
        </p>
    </div>
    
    <div class="bg-white rounded-lg shadow-md p-4">
        <h3 class="text-lg font-semibold mb-2">Dow Jones</h3>
        <p class="text-2xl font-bold {dowChange >= 0 ? 'text-green-600' : 'text-red-600'}">
            {dowChange >= 0 ? '+' : ''}{formatPercentage(dowChange)}
        </p>
    </div>
    
    <div class="bg-white rounded-lg shadow-md p-4">
        <h3 class="text-lg font-semibold mb-2">NASDAQ</h3>
        <p class="text-2xl font-bold {nasdaqChange >= 0 ? 'text-green-600' : 'text-red-600'}">
            {nasdaqChange >= 0 ? '+' : ''}{formatPercentage(nasdaqChange)}
        </p>
    </div>

    <div class="bg-white rounded-lg shadow-md p-4">
        <h3 class="text-lg font-semibold mb-2">NANC</h3>
        <p class="text-2xl font-bold {nancChange >= 0 ? 'text-green-600' : 'text-red-600'}">
            {nancChange >= 0 ? '+' : ''}{formatPercentage(nancChange)}
        </p>
    </div>

    <div class="bg-white rounded-lg shadow-md p-4">
        <h3 class="text-lg font-semibold mb-2">NVIDIA</h3>
        <p class="text-2xl font-bold {nvdaChange >= 0 ? 'text-green-600' : 'text-red-600'}">
            {nvdaChange >= 0 ? '+' : ''}{formatPercentage(nvdaChange)}
        </p>
    </div>
</div> 