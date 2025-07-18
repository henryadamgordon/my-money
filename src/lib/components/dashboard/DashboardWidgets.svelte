<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { BudgetService, type BudgetItem } from '$lib/services/budgetService';
	import { CategoryService, type Category } from '$lib/services/categoryService';
	import PieChart from './PieChart.svelte';

	let budgetItems: BudgetItem[] = [];
	let categories: Category[] = [];
	let loading = true;
	let error = '';

	// Reactive data for charts - only process after data is loaded
	$: incomeData = !loading && budgetItems.length > 0 ? getChartData('income') : [];
	$: expenseData = !loading && budgetItems.length > 0 ? getChartData('expense') : [];
	$: incomeTotal = incomeData.reduce((sum, item) => sum + item.value, 0);
	$: expenseTotal = expenseData.reduce((sum, item) => sum + item.value, 0);

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		try {
			loading = true;
			error = '';

			if (!$authStore.user?.id) {
				throw new Error('User not authenticated');
			}

			// Load budget items and categories in parallel
			const [budgetItemsResult, categoriesResult] = await Promise.all([
				BudgetService.getBudgetItems($authStore.user.id),
				CategoryService.getCategories($authStore.user.id)
			]);

			budgetItems = budgetItemsResult;
			categories = categoriesResult;

		} catch (err) {
			console.error('Error loading dashboard data:', err);
			error = err instanceof Error ? err.message : 'Failed to load dashboard data';
		} finally {
			loading = false;
		}
	}

	function getChartData(type: 'income' | 'expense') {
		// Filter budget items by type
		const filteredItems = budgetItems.filter(item => item.type === type);
		
		// Group by category
		const categoryGroups = new Map<string, { name: string; color: string; total: number; icon: string }>();
		
		filteredItems.forEach(item => {
			const category = categories.find(cat => cat.id === item.category);
			const categoryName = category?.name || 'Uncategorized';
			const categoryColor = category?.color || '#9CA3AF';
			const categoryIcon = category?.icon || '📊';
			
			if (categoryGroups.has(categoryName)) {
				categoryGroups.get(categoryName)!.total += item.amount;
			} else {
				categoryGroups.set(categoryName, {
					name: categoryName,
					color: categoryColor,
					total: item.amount,
					icon: categoryIcon
				});
			}
		});

		// Convert to array and sort by value descending
		const sortedData = Array.from(categoryGroups.values())
			.map(group => ({
				label: group.name,
				value: group.total,
				color: group.color,
				icon: group.icon
			}))
			.sort((a, b) => b.value - a.value);

		// Group small categories for better readability
		const totalAmount = sortedData.reduce((sum, item) => sum + item.value, 0);
		const threshold = totalAmount * 0.05; // 5% threshold
		const maxCategories = type === 'expense' ? 8 : 10; // Show fewer categories for expenses

		if (sortedData.length <= maxCategories) {
			// If we have few categories, show all
			return sortedData;
		}

		// Separate main categories from small ones
		const mainCategories = sortedData.slice(0, maxCategories - 1);
		const smallCategories = sortedData.slice(maxCategories - 1);

		// Group small categories into "Others"
		if (smallCategories.length > 0) {
			const othersTotal = smallCategories.reduce((sum, item) => sum + item.value, 0);
			const othersItem = {
				label: `Others (${smallCategories.length})`,
				value: othersTotal,
				color: '#9CA3AF',
				icon: '📊',
				details: smallCategories // Store details for potential expansion
			};
			return [...mainCategories, othersItem];
		}

		return mainCategories;
	}

	function getCategoryIcon(categoryName: string): string {
		const category = categories.find(cat => cat.name === categoryName);
		return category?.icon || '📊';
	}
</script>

<div class="dashboard-widgets">
	{#if loading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<p>Loading dashboard data...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<div class="error-icon">⚠️</div>
			<h3>Error Loading Dashboard</h3>
			<p>{error}</p>
			<button on:click={loadData} class="retry-btn">Try Again</button>
		</div>
	{:else}
		<!-- Summary Stats Section -->
		{#if incomeData.length > 0 || expenseData.length > 0}
			<div class="summary-overview">
				<div class="summary-card income-card">
					<div class="summary-icon">💰</div>
					<div class="summary-content">
						<h3>Total Income</h3>
						<p class="summary-amount income">${incomeTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
						<span class="summary-count">{incomeData.length} categories</span>
					</div>
				</div>
				
				<div class="summary-card expense-card">
					<div class="summary-icon">💸</div>
					<div class="summary-content">
						<h3>Total Expenses</h3>
						<p class="summary-amount expense">${expenseTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
						<span class="summary-count">{expenseData.length} categories</span>
					</div>
				</div>
				
				<div class="summary-card balance-card">
					<div class="summary-icon">{incomeTotal - expenseTotal >= 0 ? '📈' : '📉'}</div>
					<div class="summary-content">
						<h3>Net Balance</h3>
						<p class="summary-amount {incomeTotal - expenseTotal >= 0 ? 'positive' : 'negative'}">
							{incomeTotal - expenseTotal >= 0 ? '+' : ''}${(incomeTotal - expenseTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
						</p>
						<span class="summary-count">
							{incomeTotal - expenseTotal >= 0 ? 'Surplus' : 'Deficit'}
						</span>
					</div>
				</div>
			</div>
		{/if}

		<div class="widgets-grid">
			<!-- Income Widget -->
			<div class="widget-container">
				{#if incomeData.length > 0}
					<PieChart 
						data={incomeData} 
						title="💰 Income by Category" 
						total={incomeTotal} 
					/>
				{:else}
					<div class="empty-widget">
						<div class="empty-icon">💰</div>
						<h3>No Income Data</h3>
						<p>Add some income items to see the breakdown by category.</p>
						<a href="/budget" class="add-data-btn">Add Income Items</a>
					</div>
				{/if}
			</div>

			<!-- Expenses Widget -->
			<div class="widget-container">
				{#if expenseData.length > 0}
					<PieChart 
						data={expenseData} 
						title="💸 Expenses by Category" 
						total={expenseTotal} 
					/>
				{:else}
					<div class="empty-widget">
						<div class="empty-icon">💸</div>
						<h3>No Expense Data</h3>
						<p>Add some expense items to see the breakdown by category.</p>
						<a href="/budget" class="add-data-btn">Add Expense Items</a>
					</div>
				{/if}
			</div>
		</div>


	{/if}
</div>

<style>
	.dashboard-widgets {
		width: 100%;
	}

	.summary-overview {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 20px;
		margin-bottom: 30px;
	}

	.summary-card {
		background: white;
		padding: 24px;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		gap: 16px;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.summary-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
	}

	.summary-icon {
		font-size: 2.5rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.summary-content {
		flex: 1;
	}

	.summary-content h3 {
		margin: 0 0 8px 0;
		color: #666;
		font-size: 0.875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.summary-amount {
		margin: 0 0 4px 0;
		font-size: 1.75rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.summary-amount.income {
		color: #10b981;
	}

	.summary-amount.expense {
		color: #ef4444;
	}

	.summary-amount.positive {
		color: #10b981;
	}

	.summary-amount.negative {
		color: #ef4444;
	}

	.summary-count {
		font-size: 0.75rem;
		color: #999;
		font-weight: 500;
	}

	.loading-state, .error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		text-align: center;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f4f6;
		border-top: 4px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 20px;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-state {
		color: #dc2626;
	}

	.error-icon {
		font-size: 3rem;
		margin-bottom: 15px;
	}

	.error-state h3 {
		margin: 0 0 10px 0;
		color: #dc2626;
	}

	.error-state p {
		margin: 0 0 20px 0;
		color: #666;
	}

	.retry-btn {
		background: #667eea;
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.retry-btn:hover {
		background: #5a67d8;
	}

	.widgets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 20px;
		margin-bottom: 30px;
	}

	.widget-container {
		min-height: 300px;
	}

	.empty-widget {
		background: white;
		border-radius: 12px;
		padding: 40px 20px;
		text-align: center;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 15px;
		opacity: 0.5;
	}

	.empty-widget h3 {
		margin: 0 0 10px 0;
		color: #666;
	}

	.empty-widget p {
		margin: 0 0 20px 0;
		color: #999;
	}

	.add-data-btn {
		background: #667eea;
		color: white;
		text-decoration: none;
		padding: 10px 20px;
		border-radius: 6px;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.add-data-btn:hover {
		background: #5a67d8;
	}

	@media (max-width: 768px) {
		.widgets-grid {
			grid-template-columns: 1fr;
		}

		.summary-overview {
			grid-template-columns: 1fr;
		}
	}
</style>
