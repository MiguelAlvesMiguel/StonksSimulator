<script lang="ts">
    import InvestmentForm from '$lib/components/InvestmentForm.svelte';
    import InvestmentTable from '$lib/components/InvestmentTable.svelte';
    import Summary from '$lib/components/Summary.svelte';
    import type { Investment } from '$lib/types';

    let investments: Investment[] = [];

    function handleAddInvestment(event: CustomEvent<Investment>) {
        investments = [...investments, event.detail];
    }
</script>

<main class="container mx-auto px-4 py-8 min-h-screen bg-gray-50">
    <h1 class="text-3xl font-bold text-center mb-8">Investment Tracker</h1>
    
    <div class="max-w-4xl mx-auto mb-8">
        <InvestmentForm on:add={handleAddInvestment} />
    </div>

    <Summary {investments} />
    
    <div class="mt-8">
        <InvestmentTable {investments} />
    </div>
</main>

<style lang="postcss">
    :global(body) {
        @apply bg-gray-50;
    }
</style>
