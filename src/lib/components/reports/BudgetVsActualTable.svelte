<script lang="ts">
	export let categoryComparisons: Array<{
		categoryId: string;
		categoryName: string;
		categoryColor: string;
		budgetAmount: number;
		actualAmount: number;
		difference: number;
		percentageUsed: number;
	}> = [];

	function getStatusClass(percentage: number): string {
		if (percentage <= 50) return 'under-budget';
		if (percentage <= 90) return 'on-track';
		if (percentage <= 100) return 'near-limit';
		return 'over-budget';
	}

	function getStatusText(percentage: number): string {
		if (percentage <= 50) return 'Under Budget';
		if (percentage <= 90) return 'On Track';
		if (percentage <= 100) return 'Near Limit';
		return 'Over Budget';
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	}

	function formatPercentage(percentage: number): string {
		return `${percentage.toFixed(1)}%`;
	}
</script>

<div class="table-container">
	{#if categoryComparisons.length === 0}
		<div class="empty-state">
			<p>📋 No category data available</p>
			<p class="empty-subtitle">
				Add budget items and transactions with categories to see the comparison.
			</p>
			<div class="empty-actions">
				<a href="/budget" class="action-link">📝 Manage Budget</a>
				<a href="/transactions" class="action-link">💳 Manage Transactions</a>
			</div>
		</div>
	{:else}
		<div class="table-wrapper">
			<table class="comparison-table">
				<thead>
					<tr>
						<th class="category-col">Category</th>
						<th class="amount-col">Budget</th>
						<th class="amount-col">Actual</th>
						<th class="amount-col">Difference</th>
						<th class="percentage-col">% Used</th>
						<th class="status-col">Status</th>
					</tr>
				</thead>
				<tbody>
					<!-- Summary Row -->
					<tr class="summary-table-row">
						<td class="category-cell">
							<div class="category-info">
								<div class="category-color summary-color"></div>
								<span class="category-name summary-name">Total Budget</span>
							</div>
						</td>
						<td class="amount-cell budget-amount summary-amount">
							{formatCurrency(categoryComparisons.reduce((sum, comp) => sum + comp.budgetAmount, 0))}
						</td>
						<td class="amount-cell actual-amount summary-amount">
							{formatCurrency(categoryComparisons.reduce((sum, comp) => sum + comp.actualAmount, 0))}
						</td>
						<td class="amount-cell difference-amount summary-amount {categoryComparisons.reduce((sum, comp) => sum + comp.difference, 0) > 0 ? 'over' : 'under'}">
							<span class="difference-sign">
								{categoryComparisons.reduce((sum, comp) => sum + comp.difference, 0) > 0 ? '+' : ''}
							</span>
							{formatCurrency(Math.abs(categoryComparisons.reduce((sum, comp) => sum + comp.difference, 0)))}
						</td>
						<td class="percentage-cell">
							<div class="percentage-container">
								<span class="percentage-text summary-percentage">
									{formatPercentage(
										(categoryComparisons.reduce((sum, comp) => sum + comp.actualAmount, 0) /
										categoryComparisons.reduce((sum, comp) => sum + comp.budgetAmount, 0)) * 100
									)}
								</span>
								<div class="progress-bar">
									<div 
										class="progress-fill summary-progress"
										style="width: {Math.min(
											(categoryComparisons.reduce((sum, comp) => sum + comp.actualAmount, 0) /
											categoryComparisons.reduce((sum, comp) => sum + comp.budgetAmount, 0)) * 100, 100
										)}%"
									></div>
								</div>
							</div>
						</td>
						<td class="status-cell">
							<span class="status-badge summary-status">
								Overall
							</span>
						</td>
					</tr>
					{#each categoryComparisons as comparison}
						<tr class="comparison-row">
							<td class="category-cell">
								<div class="category-info">
									<div 
										class="category-color" 
										style="background-color: {comparison.categoryColor}"
									></div>
									<span class="category-name">{comparison.categoryName}</span>
								</div>
							</td>
							<td class="amount-cell budget-amount">
								{formatCurrency(comparison.budgetAmount)}
							</td>
							<td class="amount-cell actual-amount">
								{formatCurrency(comparison.actualAmount)}
							</td>
							<td class="amount-cell difference-amount {comparison.difference > 0 ? 'over' : 'under'}">
								<span class="difference-sign">
									{comparison.difference > 0 ? '+' : ''}
								</span>
								{formatCurrency(Math.abs(comparison.difference))}
							</td>
							<td class="percentage-cell">
								<div class="percentage-container">
									<span class="percentage-text {getStatusClass(comparison.percentageUsed)}">
										{formatPercentage(comparison.percentageUsed)}
									</span>
									<div class="progress-bar">
										<div 
											class="progress-fill {getStatusClass(comparison.percentageUsed)}"
											style="width: {Math.min(comparison.percentageUsed, 100)}%"
										></div>
									</div>
								</div>
							</td>
							<td class="status-cell">
								<span class="status-badge {getStatusClass(comparison.percentageUsed)}">
									{getStatusText(comparison.percentageUsed)}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.table-container {
		width: 100%;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
		color: #7f8c8d;
	}

	.empty-state p {
		margin: 0.5rem 0;
		font-size: 1.1rem;
	}

	.empty-subtitle {
		font-size: 0.9rem !important;
		opacity: 0.8;
	}

	.empty-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.action-link {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background-color: #3498db;
		color: white;
		text-decoration: none;
		border-radius: 0.5rem;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.action-link:hover {
		background-color: #2980b9;
	}

	.table-wrapper {
		overflow-x: auto;
		border-radius: 0.75rem;
		border: 1px solid #e1e8ed;
	}

	.comparison-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.comparison-table th {
		background-color: #f8f9fa;
		color: #2c3e50;
		font-weight: 600;
		padding: 1rem 0.75rem;
		text-align: left;
		border-bottom: 2px solid #e1e8ed;
		white-space: nowrap;
	}

	.comparison-table td {
		padding: 1rem 0.75rem;
		border-bottom: 1px solid #f1f3f4;
		vertical-align: middle;
	}

	.comparison-row:hover {
		background-color: #f8f9fa;
	}

	.summary-table-row {
		background-color: #f8f9fa;
		border-top: 2px solid #3498db;
		border-bottom: 2px solid #3498db;
		font-weight: 600;
	}

	.summary-table-row:hover {
		background-color: #e9ecef;
	}

	.summary-color {
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
	}

	.summary-name {
		font-weight: 700;
		color: #2c3e50;
		font-size: 1rem;
	}

	.summary-amount {
		font-weight: 700;
		font-size: 1rem;
	}

	.summary-percentage {
		font-weight: 700;
		color: #2c3e50;
	}

	.summary-progress {
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
	}

	.summary-status {
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		color: white;
		font-weight: 700;
	}

	.category-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.category-color {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.category-name {
		font-weight: 500;
		color: #2c3e50;
	}

	.amount-cell {
		font-weight: 500;
		text-align: right;
	}

	.budget-amount {
		color: #3498db;
	}

	.actual-amount {
		color: #e74c3c;
	}

	.difference-amount.over {
		color: #e74c3c;
	}

	.difference-amount.under {
		color: #27ae60;
	}

	.percentage-container {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 80px;
	}

	.percentage-text {
		font-weight: 600;
		font-size: 0.85rem;
		text-align: center;
	}

	.progress-bar {
		height: 6px;
		background-color: #ecf0f1;
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		transition: width 0.3s ease;
		border-radius: 3px;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	/* Status colors */
	.under-budget {
		color: #27ae60;
	}

	.progress-fill.under-budget {
		background-color: #27ae60;
	}

	.status-badge.under-budget {
		background-color: #d5f4e6;
		color: #27ae60;
	}

	.on-track {
		color: #f39c12;
	}

	.progress-fill.on-track {
		background-color: #f39c12;
	}

	.status-badge.on-track {
		background-color: #fef9e7;
		color: #f39c12;
	}

	.near-limit {
		color: #e67e22;
	}

	.progress-fill.near-limit {
		background-color: #e67e22;
	}

	.status-badge.near-limit {
		background-color: #fdf2e9;
		color: #e67e22;
	}

	.over-budget {
		color: #e74c3c;
	}

	.progress-fill.over-budget {
		background-color: #e74c3c;
	}

	.status-badge.over-budget {
		background-color: #fdedec;
		color: #e74c3c;
	}

	.summary-row {
		display: flex;
		justify-content: space-around;
		align-items: center;
		margin-top: 1.5rem;
		padding: 1rem;
		background-color: #f8f9fa;
		border-radius: 0.75rem;
		border: 1px solid #e1e8ed;
	}

	.summary-item {
		text-align: center;
	}

	.summary-label {
		display: block;
		font-size: 0.85rem;
		color: #7f8c8d;
		margin-bottom: 0.25rem;
	}

	.summary-value {
		display: block;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.summary-value.budget {
		color: #3498db;
	}

	.summary-value.actual {
		color: #e74c3c;
	}

	.summary-value.percentage {
		color: #2c3e50;
	}

	@media (max-width: 768px) {
		.comparison-table {
			font-size: 0.8rem;
		}

		.comparison-table th,
		.comparison-table td {
			padding: 0.75rem 0.5rem;
		}

		.category-info {
			gap: 0.5rem;
		}

		.category-color {
			width: 0.75rem;
			height: 0.75rem;
		}

		.percentage-container {
			min-width: 60px;
		}

		.summary-row {
			flex-direction: column;
			gap: 1rem;
		}

		.summary-item {
			width: 100%;
		}

		.empty-actions {
			flex-direction: column;
			align-items: center;
		}

		.action-link {
			width: 200px;
			text-align: center;
		}
	}

	@media (max-width: 480px) {
		.table-wrapper {
			border-radius: 0.5rem;
		}

		.comparison-table th,
		.comparison-table td {
			padding: 0.5rem 0.25rem;
		}

		.status-badge {
			font-size: 0.65rem;
			padding: 0.2rem 0.5rem;
		}
	}
</style>
