<script lang="ts">
	import type { BudgetItem } from '$lib/services/budgetService';

	// Props
	export let budgetItems: BudgetItem[] = [];

	// Format currency helper
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	// Calculate totals - reactive statements
	$: totalIncome = budgetItems
		.filter(item => item.type === 'income')
		.reduce((sum, item) => sum + item.amount, 0);
	
	$: totalExpenses = budgetItems
		.filter(item => item.type === 'expense')
		.reduce((sum, item) => sum + item.amount, 0);
	
	$: totalSavings = budgetItems
		.filter(item => item.type === 'savings')
		.reduce((sum, item) => sum + item.amount, 0);
	
	$: netAmount = totalIncome - totalExpenses - totalSavings;
</script>

<!-- Summary Cards -->
<div class="summary-grid">
	<div class="summary-card income">
		<h3>💰 Total Income</h3>
		<p class="amount">{formatCurrency(totalIncome)}</p>
	</div>
	<div class="summary-card expense">
		<h3>💸 Total Expenses</h3>
		<p class="amount">{formatCurrency(totalExpenses)}</p>
	</div>
	<div class="summary-card savings">
		<h3>🏦 Total Savings</h3>
		<p class="amount">{formatCurrency(totalSavings)}</p>
	</div>
	<div class="summary-card net {netAmount >= 0 ? 'positive' : 'negative'}">
		<h3>📊 Net Amount</h3>
		<p class="amount">{formatCurrency(netAmount)}</p>
	</div>
</div>

<style>
	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.summary-card {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		border: 1px solid #e9ecef;
		text-align: center;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.summary-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.summary-card h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		color: #666;
		font-weight: 500;
	}

	.summary-card .amount {
		font-size: 1.5rem;
		font-weight: bold;
		margin: 0;
	}

	.summary-card.income .amount { 
		color: #28a745; 
	}
	
	.summary-card.expense .amount { 
		color: #dc3545; 
	}
	
	.summary-card.savings .amount { 
		color: #007bff; 
	}
	
	.summary-card.net.positive .amount { 
		color: #28a745; 
	}
	
	.summary-card.net.negative .amount { 
		color: #dc3545; 
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.summary-grid {
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 1rem;
			margin-bottom: 1.5rem;
		}
		
		.summary-card {
			padding: 1rem;
		}
		
		.summary-card h3 {
			font-size: 0.9rem;
		}
		
		.summary-card .amount {
			font-size: 1.25rem;
		}
	}
</style>
