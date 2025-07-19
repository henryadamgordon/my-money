<script lang="ts">
	import type { Transaction } from '$lib/types/transaction';

	export let transactions: Transaction[] = [];
	export let isLoading = false;

	// Calculate summary metrics
	$: totalIncome = transactions
		.filter(t => t.type === 'income')
		.reduce((sum, t) => sum + t.amount, 0);

	$: totalExpenses = transactions
		.filter(t => t.type === 'expense')
		.reduce((sum, t) => sum + t.amount, 0);

	$: netBalance = totalIncome - totalExpenses;

	$: transactionCount = transactions.length;

	$: incomeCount = transactions.filter(t => t.type === 'income').length;
	$: expenseCount = transactions.filter(t => t.type === 'expense').length;

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	// Get current month name
	function getCurrentMonth(): string {
		return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}
</script>

<div class="transaction-summary">
	<div class="summary-header">
		<h3>📊 Transaction Summary</h3>
		<span class="period">{getCurrentMonth()}</span>
	</div>

	{#if isLoading}
		<div class="loading-summary">
			<div class="skeleton-card"></div>
			<div class="skeleton-card"></div>
			<div class="skeleton-card"></div>
			<div class="skeleton-card"></div>
		</div>
	{:else}
		<div class="summary-grid">
			<div class="summary-card income">
				<div class="card-icon">💰</div>
				<div class="card-content">
					<h4>Total Income</h4>
					<div class="amount">{formatCurrency(totalIncome)}</div>
					<div class="count">{incomeCount} transaction{incomeCount !== 1 ? 's' : ''}</div>
				</div>
			</div>

			<div class="summary-card expense">
				<div class="card-icon">💸</div>
				<div class="card-content">
					<h4>Total Expenses</h4>
					<div class="amount">{formatCurrency(totalExpenses)}</div>
					<div class="count">{expenseCount} transaction{expenseCount !== 1 ? 's' : ''}</div>
				</div>
			</div>

			<div class="summary-card balance {netBalance >= 0 ? 'positive' : 'negative'}">
				<div class="card-icon">{netBalance >= 0 ? '📈' : '📉'}</div>
				<div class="card-content">
					<h4>Net Balance</h4>
					<div class="amount">{formatCurrency(netBalance)}</div>
					<div class="count">{netBalance >= 0 ? 'Surplus' : 'Deficit'}</div>
				</div>
			</div>

			<div class="summary-card total">
				<div class="card-icon">📋</div>
				<div class="card-content">
					<h4>Total Transactions</h4>
					<div class="amount">{transactionCount}</div>
					<div class="count">All time</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.transaction-summary {
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		padding: 25px;
		margin-bottom: 30px;
	}

	.summary-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.summary-header h3 {
		margin: 0;
		color: #333;
		font-size: 1.4rem;
	}

	.period {
		color: #666;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.loading-summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 20px;
	}

	.skeleton-card {
		height: 100px;
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: loading 1.5s infinite;
		border-radius: 8px;
	}

	@keyframes loading {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 20px;
	}

	.summary-card {
		display: flex;
		align-items: center;
		padding: 20px;
		border-radius: 8px;
		border-left: 4px solid;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.summary-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.summary-card.income {
		background: #f8fff8;
		border-left-color: #28a745;
	}

	.summary-card.expense {
		background: #fff8f8;
		border-left-color: #dc3545;
	}

	.summary-card.balance.positive {
		background: #f0f8ff;
		border-left-color: #007bff;
	}

	.summary-card.balance.negative {
		background: #fff5f5;
		border-left-color: #fd7e14;
	}

	.summary-card.total {
		background: #f8f9fa;
		border-left-color: #6c757d;
	}

	.card-icon {
		font-size: 2rem;
		margin-right: 15px;
	}

	.card-content {
		flex: 1;
	}

	.card-content h4 {
		margin: 0 0 8px 0;
		color: #333;
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.amount {
		font-size: 1.5rem;
		font-weight: 700;
		color: #333;
		margin-bottom: 4px;
	}

	.count {
		font-size: 0.8rem;
		color: #666;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.transaction-summary {
			padding: 20px;
		}

		.summary-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 10px;
		}

		.summary-grid {
			grid-template-columns: 1fr;
			gap: 15px;
		}

		.summary-card {
			padding: 15px;
		}

		.card-icon {
			font-size: 1.5rem;
			margin-right: 12px;
		}

		.amount {
			font-size: 1.3rem;
		}
	}
</style>
