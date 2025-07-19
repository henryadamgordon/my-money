<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { authStore } from '$lib/stores/auth';
	import { BudgetService } from '$lib/services/budgetService';
	import { TransactionService } from '$lib/services/transactionService';
	import { CategoryService } from '$lib/services/categoryService';
	import type { BudgetItem } from '$lib/types/budget';
	import type { Transaction } from '$lib/types/transaction';
	import type { Category } from '$lib/types/category';
	import BudgetVsActualChart from './BudgetVsActualChart.svelte';
	import BudgetVsActualTable from './BudgetVsActualTable.svelte';

	let budgetItems: BudgetItem[] = [];
	let transactions: Transaction[] = [];
	let categories: Category[] = [];
	let isLoading = true;
	let errorMessage = '';

	interface CategoryComparison {
		categoryId: string;
		categoryName: string;
		categoryColor: string;
		budgetAmount: number;
		actualAmount: number;
		difference: number;
		percentageUsed: number;
	}

	let categoryComparisons: CategoryComparison[] = [];

	onMount(async () => {
		if (browser && $authStore.user) {
			await loadData();
		}
	});

	async function loadData() {
		try {
			isLoading = true;
			errorMessage = '';

			// Load all data in parallel
			const [budgetData, transactionData, categoryData] = await Promise.all([
				BudgetService.getBudgetItems($authStore.user!.id),
				TransactionService.getTransactions($authStore.user!.id),
				CategoryService.getCategories($authStore.user!.id)
			]);

			budgetItems = budgetData;
			transactions = transactionData;
			categories = categoryData;

			// Calculate category comparisons
			calculateCategoryComparisons();

		} catch (error) {
			console.error('Error loading report data:', error);
			errorMessage = 'Failed to load report data. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function calculateCategoryComparisons() {
		const categoryMap = new Map<string, CategoryComparison>();

		// Initialize with categories
		categories.forEach(category => {
			categoryMap.set(category.id, {
				categoryId: category.id,
				categoryName: category.name,
				categoryColor: category.color,
				budgetAmount: 0,
				actualAmount: 0,
				difference: 0,
				percentageUsed: 0
			});
		});

		// Add uncategorized placeholder
		categoryMap.set('uncategorized', {
			categoryId: 'uncategorized',
			categoryName: 'Uncategorized',
			categoryColor: '#95a5a6',
			budgetAmount: 0,
			actualAmount: 0,
			difference: 0,
			percentageUsed: 0
		});

		// Calculate budget amounts by category (only expenses)
		budgetItems
			.filter(item => item.type === 'expense')
			.forEach(item => {
				const categoryId = item.category || 'uncategorized';
				const comparison = categoryMap.get(categoryId);
				if (comparison) {
					comparison.budgetAmount += item.amount;
				}
			});

		// Calculate actual amounts by category (only expenses)
		transactions
			.filter(transaction => transaction.type === 'expense')
			.forEach(transaction => {
				const categoryId = transaction.categoryId || 'uncategorized';
				const comparison = categoryMap.get(categoryId);
				if (comparison) {
					comparison.actualAmount += transaction.amount;
				}
			});

		// Calculate differences and percentages
		categoryMap.forEach(comparison => {
			comparison.difference = comparison.actualAmount - comparison.budgetAmount;
			comparison.percentageUsed = comparison.budgetAmount > 0 
				? (comparison.actualAmount / comparison.budgetAmount) * 100 
				: 0;
		});

		// Filter out categories with no budget or actual amounts and sort by budget amount
		categoryComparisons = Array.from(categoryMap.values())
			.filter(comparison => comparison.budgetAmount > 0 || comparison.actualAmount > 0)
			.sort((a, b) => b.budgetAmount - a.budgetAmount);
	}

	function handleRetry() {
		loadData();
	}
</script>

<div class="report-management">
	{#if isLoading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading report data...</p>
		</div>
	{:else if errorMessage}
		<div class="error-state">
			<p class="error-message">{errorMessage}</p>
			<button class="retry-btn" on:click={handleRetry}>
				🔄 Retry
			</button>
		</div>
	{:else}
		<!-- Summary Stats -->
		<div class="summary-section">
			<div class="summary-cards">
				<div class="summary-card">
					<h3>Total Budgeted</h3>
					<p class="amount budget">
						${categoryComparisons.reduce((sum, comp) => sum + comp.budgetAmount, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
					</p>
				</div>
				<div class="summary-card">
					<h3>Total Spent</h3>
					<p class="amount actual">
						${categoryComparisons.reduce((sum, comp) => sum + comp.actualAmount, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
					</p>
				</div>
				<div class="summary-card">
					<h3>Difference</h3>
					<p class="amount {categoryComparisons.reduce((sum, comp) => sum + comp.difference, 0) > 0 ? 'over' : 'under'}">
						${Math.abs(categoryComparisons.reduce((sum, comp) => sum + comp.difference, 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
						{categoryComparisons.reduce((sum, comp) => sum + comp.difference, 0) > 0 ? 'over' : 'under'}
					</p>
				</div>
			</div>
		</div>

		<!-- Bar Chart Section -->
		<div class="chart-section">
			<h2>📊 Budget vs Actual Spending</h2>
			<BudgetVsActualChart {categoryComparisons} />
		</div>

		<!-- Comparison Table Section -->
		<div class="table-section">
			<h2>📋 Category Comparison</h2>
			<BudgetVsActualTable {categoryComparisons} />
		</div>
	{/if}
</div>

<style>
	.report-management {
		width: 100%;
	}

	.loading {
		text-align: center;
		padding: 3rem;
	}

	.spinner {
		border: 4px solid #f3f3f3;
		border-top: 4px solid #3498db;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-state {
		text-align: center;
		padding: 3rem;
	}

	.error-message {
		color: #e74c3c;
		margin-bottom: 1rem;
		font-size: 1.1rem;
	}

	.retry-btn {
		background-color: #3498db;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 1rem;
		transition: background-color 0.2s;
	}

	.retry-btn:hover {
		background-color: #2980b9;
	}

	.chart-section,
	.table-section,
	.summary-section {
		margin-bottom: 3rem;
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.chart-section h2,
	.table-section h2 {
		color: #2c3e50;
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.summary-section {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.summary-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.summary-card {
		text-align: center;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		padding: 1.5rem;
		backdrop-filter: blur(10px);
	}

	.summary-card h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		opacity: 0.9;
	}

	.amount {
		font-size: 1.8rem;
		font-weight: bold;
		margin: 0;
	}

	.amount.budget {
		color: #3498db;
	}

	.amount.actual {
		color: #e74c3c;
	}

	.amount.over {
		color: #e74c3c;
	}

	.amount.under {
		color: #27ae60;
	}

	.summary-card .amount {
		color: white;
	}

	@media (max-width: 768px) {
		.chart-section,
		.table-section,
		.summary-section {
			padding: 1rem;
			margin-bottom: 2rem;
		}

		.summary-cards {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.summary-card {
			padding: 1rem;
		}

		.amount {
			font-size: 1.5rem;
		}
	}
</style>
