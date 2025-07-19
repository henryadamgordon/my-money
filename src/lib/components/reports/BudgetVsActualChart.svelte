<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { browser } from '$app/environment';

	export let categoryComparisons: Array<{
		categoryId: string;
		categoryName: string;
		categoryColor: string;
		budgetAmount: number;
		actualAmount: number;
		difference: number;
		percentageUsed: number;
	}> = [];

	let chartCanvas: HTMLCanvasElement;
	let chartInstance: any = null;

	onMount(async () => {
		if (browser) {
			// Dynamically import Chart.js to avoid SSR issues
			const { Chart, registerables } = await import('chart.js');
			Chart.register(...registerables);
			
			if (chartCanvas && categoryComparisons.length > 0) {
				createChart(Chart);
			}
		}
	});

	afterUpdate(async () => {
		if (browser && chartCanvas && categoryComparisons.length > 0) {
			if (chartInstance) {
				chartInstance.destroy();
			}
			const { Chart } = await import('chart.js');
			createChart(Chart);
		}
	});

	function createChart(Chart: any) {
		if (!chartCanvas) return;

		const ctx = chartCanvas.getContext('2d');
		if (!ctx) return;

		// Prepare data for the chart
		const labels = categoryComparisons.map(comp => comp.categoryName);
		const budgetData = categoryComparisons.map(comp => comp.budgetAmount);
		const actualData = categoryComparisons.map(comp => comp.actualAmount);

		chartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labels,
				datasets: [
					{
						label: 'Budget',
						data: budgetData,
						backgroundColor: 'rgba(52, 152, 219, 0.7)',
						borderColor: 'rgba(52, 152, 219, 1)',
						borderWidth: 2,
						borderRadius: 4,
						borderSkipped: false,
					},
					{
						label: 'Actual',
						data: actualData,
						backgroundColor: 'rgba(231, 76, 60, 0.7)',
						borderColor: 'rgba(231, 76, 60, 1)',
						borderWidth: 2,
						borderRadius: 4,
						borderSkipped: false,
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					intersect: false,
					mode: 'index'
				},
				plugins: {
					title: {
						display: true,
						text: 'Budget vs Actual Spending by Category',
						font: {
							size: 16,
							weight: 'bold'
						},
						color: '#2c3e50'
					},
					legend: {
						display: true,
						position: 'top',
						labels: {
							usePointStyle: true,
							padding: 20,
							font: {
								size: 12
							}
						}
					},
					tooltip: {
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						titleColor: 'white',
						bodyColor: 'white',
						borderColor: 'rgba(255, 255, 255, 0.2)',
						borderWidth: 1,
						cornerRadius: 8,
						displayColors: true,
						callbacks: {
							label: function(context: any) {
								const label = context.dataset.label || '';
								const value = context.parsed.y;
								const categoryIndex = context.dataIndex;
								const comparison = categoryComparisons[categoryIndex];
								
								if (label === 'Budget') {
									return `${label}: $${value.toFixed(2)}`;
								} else {
									const percentage = comparison.percentageUsed.toFixed(1);
									return `${label}: $${value.toFixed(2)} (${percentage}% of budget)`;
								}
							},
							afterBody: function(tooltipItems: any[]) {
								if (tooltipItems.length > 0) {
									const categoryIndex = tooltipItems[0].dataIndex;
									const comparison = categoryComparisons[categoryIndex];
									const difference = comparison.difference;
									const status = difference > 0 ? 'Over' : 'Under';
									return `${status} budget by: $${Math.abs(difference).toFixed(2)}`;
								}
								return '';
							}
						}
					}
				},
				scales: {
					x: {
						grid: {
							display: false
						},
						ticks: {
							font: {
								size: 11
							},
							maxRotation: 45,
							minRotation: 0
						}
					},
					y: {
						beginAtZero: true,
						grid: {
							color: 'rgba(0, 0, 0, 0.1)'
						},
						ticks: {
							font: {
								size: 11
							},
							callback: function(value: any) {
								return '$' + value.toFixed(0);
							}
						}
					}
				},
				elements: {
					bar: {
						borderWidth: 2
					}
				}
			}
		});
	}

	// Cleanup on destroy
	function destroyChart() {
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}
	}

	// Cleanup on component destroy
	$: if (browser) {
		// Cleanup will be handled by Svelte's component lifecycle
	}
</script>

<div class="chart-container">
	{#if categoryComparisons.length === 0}
		<div class="empty-state">
			<p>📊 No data available for comparison</p>
			<p class="empty-subtitle">
				Add some budget items and transactions to see the comparison chart.
			</p>
			<div class="empty-actions">
				<a href="/budget" class="action-link">📝 Add Budget Items</a>
				<a href="/transactions" class="action-link">💳 Add Transactions</a>
			</div>
		</div>
	{:else}
		<canvas bind:this={chartCanvas} width="400" height="300"></canvas>
	{/if}
</div>

<style>
	.chart-container {
		position: relative;
		height: 400px;
		width: 100%;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
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

	@media (max-width: 768px) {
		.chart-container {
			height: 300px;
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
</style>
