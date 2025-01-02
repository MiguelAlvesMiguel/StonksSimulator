<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Investment } from '$lib/types';
    import { v4 as uuidv4 } from 'uuid';

    const dispatch = createEventDispatcher<{add: Investment}>();

    let investment: Omit<Investment, 'id' | 'shares' | 'currentValue' | 'profitLoss' | 'profitLossPercentage' | 'estimatedTax'> = {
        stockName: '',
        ticker: '',
        purchaseDate: '',
        initialPrice: 0,
        investmentAmount: 0,
        currentPrice: 0
    };

    function handleSubmit() {
        if (investment.initialPrice <= 0 || investment.investmentAmount <= 0 || investment.currentPrice <= 0) {
            alert('Please enter valid positive numbers');
            return;
        }

        const newInvestment: Investment = {
            ...investment,
            id: uuidv4(),
            shares: investment.investmentAmount / investment.initialPrice,
            currentValue: (investment.investmentAmount / investment.initialPrice) * investment.currentPrice,
            profitLoss: ((investment.investmentAmount / investment.initialPrice) * investment.currentPrice) - investment.investmentAmount,
            profitLossPercentage: ((((investment.investmentAmount / investment.initialPrice) * investment.currentPrice) - investment.investmentAmount) / investment.investmentAmount) * 100,
            estimatedTax: Math.max(0, ((((investment.investmentAmount / investment.initialPrice) * investment.currentPrice) - investment.investmentAmount) * 0.28))
        };

        dispatch('add', newInvestment);
        
        // Reset form
        investment = {
            stockName: '',
            ticker: '',
            purchaseDate: '',
            initialPrice: 0,
            investmentAmount: 0,
            currentPrice: 0
        };
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="p-4 bg-white rounded-lg shadow-md">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group">
            <label for="stockName">Stock Name</label>
            <input
                type="text"
                id="stockName"
                bind:value={investment.stockName}
                required
                class="input"
            />
        </div>

        <div class="form-group">
            <label for="ticker">Ticker Symbol</label>
            <input
                type="text"
                id="ticker"
                bind:value={investment.ticker}
                required
                class="input"
            />
        </div>

        <div class="form-group">
            <label for="purchaseDate">Purchase Date</label>
            <input
                type="date"
                id="purchaseDate"
                bind:value={investment.purchaseDate}
                required
                class="input"
            />
        </div>

        <div class="form-group">
            <label for="initialPrice">Initial Price (EUR)</label>
            <input
                type="number"
                id="initialPrice"
                bind:value={investment.initialPrice}
                min="0.01"
                step="0.01"
                required
                class="input"
            />
        </div>

        <div class="form-group">
            <label for="investmentAmount">Investment Amount (EUR)</label>
            <input
                type="number"
                id="investmentAmount"
                bind:value={investment.investmentAmount}
                min="0.01"
                step="0.01"
                required
                class="input"
            />
        </div>

        <div class="form-group">
            <label for="currentPrice">Current Price (EUR)</label>
            <input
                type="number"
                id="currentPrice"
                bind:value={investment.currentPrice}
                min="0.01"
                step="0.01"
                required
                class="input"
            />
        </div>
    </div>

    <button type="submit" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Add Investment
    </button>
</form>

<style>
    .form-group {
        @apply flex flex-col gap-1;
    }

    .input {
        @apply px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
    }
</style> 