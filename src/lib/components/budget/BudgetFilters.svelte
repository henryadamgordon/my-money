<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { BudgetItem } from '$lib/services/budgetService';
	import type { Category } from '$lib/services/categoryService';

	// Props
	export let budgetItems: BudgetItem[] = [];
	export let categories: Category[] = [];
	export let filters = {
		search: '',
		type: '',
		owner: '',
		paymentMethod: '',
		category: '',
		recurrent: ''
	};

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		filterChange: typeof filters;
		clearFilters: void;
	}>();

	// Computed unique values for dropdowns
	$: uniqueOwners = [...new Set(budgetItems.map(item => item.owner))].sort();
	$: uniquePaymentMethods = [...new Set(budgetItems.map(item => item.paymentMethod))].sort();

	// Helper function to format payment method display
	function formatPaymentMethod(method: string): string {
		return method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
	}

	// Handle filter changes
	function handleFilterChange() {
		dispatch('filterChange', filters);
	}

	// Clear all filters
	function clearFilters() {
		filters = {
			search: '',
			type: '',
			owner: '',
			paymentMethod: '',
			category: '',
			recurrent: ''
		};
		dispatch('clearFilters');
	}

	// Reactive statements to dispatch changes
	$: if (filters) {
		handleFilterChange();
	}
</script>

<!-- Filters -->
<div class="filters-container">
	<div class="filters-row">
		<div class="filter-group">
			<label for="searchFilter">Search:</label>
			<input
				id="searchFilter"
				type="text"
				bind:value={filters.search}
				placeholder="Search by name..."
				class="filter-input"
			/>
		</div>

		<div class="filter-group">
			<label for="typeFilter">Type:</label>
			<select id="typeFilter" bind:value={filters.type} class="filter-select">
				<option value="">All Types</option>
				<option value="income">💰 Income</option>
				<option value="expense">💸 Expense</option>
				<option value="savings">🏦 Savings</option>
			</select>
		</div>

		<div class="filter-group">
			<label for="ownerFilter">Owner:</label>
			<select id="ownerFilter" bind:value={filters.owner} class="filter-select">
				<option value="">All Owners</option>
				{#each uniqueOwners as owner}
					<option value={owner}>{owner}</option>
				{/each}
			</select>
		</div>

		<div class="filter-group">
			<label for="paymentFilter">Payment:</label>
			<select id="paymentFilter" bind:value={filters.paymentMethod} class="filter-select">
				<option value="">All Methods</option>
				{#each uniquePaymentMethods as method}
					<option value={method}>{formatPaymentMethod(method)}</option>
				{/each}
			</select>
		</div>

		<div class="filter-group">
			<label for="categoryFilter">Category:</label>
			<select id="categoryFilter" bind:value={filters.category} class="filter-select">
				<option value="">All Categories</option>
				<option value="uncategorized">Uncategorized</option>
				{#each categories as category}
					<option value={category.id}>{category.icon} {category.name}</option>
				{/each}
			</select>
		</div>

		<div class="filter-group">
			<label for="recurrentFilter">Recurrent:</label>
			<select id="recurrentFilter" bind:value={filters.recurrent} class="filter-select">
				<option value="">All Items</option>
				<option value="true">Recurrent Only</option>
				<option value="false">One-time Only</option>
			</select>
		</div>

		<button on:click={clearFilters} class="clear-filters-btn" title="Clear all filters">
			🗑️ Clear
		</button>
	</div>
</div>

<style>
	.filters-container {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		border: 1px solid #e9ecef;
	}

	.filters-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		align-items: end;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group label {
		font-weight: 500;
		color: #333;
		font-size: 0.9rem;
	}

	.filter-input,
	.filter-select {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.9rem;
		background: white;
		transition: border-color 0.2s ease;
	}

	.filter-input:focus,
	.filter-select:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	.filter-input::placeholder {
		color: #999;
	}

	.clear-filters-btn {
		background-color: #6c757d;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		transition: background-color 0.2s ease;
		white-space: nowrap;
		height: fit-content;
	}

	.clear-filters-btn:hover {
		background-color: #5a6268;
	}

	.clear-filters-btn:active {
		transform: translateY(1px);
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.filters-container {
			padding: 1rem;
			margin-bottom: 1rem;
		}
		
		.filters-row {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}
		
		.filter-group {
			gap: 0.25rem;
		}
		
		.filter-input,
		.filter-select {
			padding: 0.75rem;
			font-size: 1rem;
		}
		
		.clear-filters-btn {
			padding: 0.75rem 1rem;
			font-size: 1rem;
		}
	}

	@media (max-width: 480px) {
		.filters-row {
			grid-template-columns: 1fr;
		}
	}
</style>
