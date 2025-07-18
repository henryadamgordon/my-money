<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';

	export let data: { label: string; value: number; color: string; icon?: string }[];
	export let title: string;
	export let total: number;

	let canvasElement: HTMLCanvasElement;
	let chart: Chart;

	Chart.register(...registerables);

	onMount(() => {
		if (canvasElement && data.length > 0) {
			createChart();
		}

		return () => {
			if (chart) {
				chart.destroy();
			}
		};
	});

	$: if (chart && data) {
		updateChart();
	}

	function createChart() {
		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;

		chart = new Chart(ctx, {
			type: 'pie',
			data: {
				labels: data.map(item => item.label),
				datasets: [{
					data: data.map(item => item.value),
					backgroundColor: data.map(item => item.color),
					borderWidth: 3,
					borderColor: '#fff',
					spacing: 2 // Add spacing between slices
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					intersect: false,
					mode: 'index'
				},
				animation: {
					animateRotate: true,
					animateScale: true,
					duration: 1000
				},
				plugins: {
					legend: {
						display: false // We'll create custom legend
					},
					tooltip: {
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						titleColor: '#fff',
						bodyColor: '#fff',
						borderColor: '#fff',
						borderWidth: 1,
						cornerRadius: 6,
						padding: 12,
						callbacks: {
							label: function(context) {
								const value = context.parsed;
								const percentage = ((value / total) * 100).toFixed(1);
								return `${context.label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentage}%)`;
							}
						}
					}
				}
			}
		});
	}

	function updateChart() {
		if (!chart) return;

		chart.data.labels = data.map(item => item.label);
		chart.data.datasets[0].data = data.map(item => item.value);
		chart.data.datasets[0].backgroundColor = data.map(item => item.color);
		chart.update();
	}
</script>

<div class="pie-chart-container">
	<div class="chart-header">
		<h3>{title}</h3>
		<div class="total-amount">
			<span class="total-label">Total</span>
			<span class="total-value">${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
		</div>
	</div>
	
	<div class="chart-content">
		<div class="chart-wrapper">
			<canvas bind:this={canvasElement}></canvas>
		</div>
		
		<div class="legend">
			{#each data as item}
				<div class="legend-item">
					<div class="legend-icon-wrapper">
						<div class="legend-color" style="background-color: {item.color}"></div>
						{#if item.icon}
							<span class="legend-icon">{item.icon}</span>
						{/if}
					</div>
					<div class="legend-details">
						<span class="legend-label">{item.label}</span>
						<div class="legend-values">
							<span class="legend-percentage">{((item.value / total) * 100).toFixed(1)}%</span>
							<span class="legend-amount">${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.pie-chart-container {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		height: 100%;
	}

	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 15px;
		border-bottom: 1px solid #e5e7eb;
	}

	.chart-header h3 {
		margin: 0;
		color: #333;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.total-amount {
		text-align: right;
	}

	.total-label {
		display: block;
		font-size: 0.875rem;
		color: #666;
		margin-bottom: 4px;
	}

	.total-value {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: #333;
	}

	.chart-content {
		display: flex;
		flex-direction: column;
		gap: 24px;
		align-items: center;
	}

	.chart-wrapper {
		width: 280px;
		height: 280px;
		position: relative;
		flex-shrink: 0;
	}

	.legend {
		width: 100%;
		max-width: 500px;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		border-radius: 8px;
		transition: all 0.2s;
		border: 1px solid transparent;
	}

	.legend-item:hover {
		background-color: #f8f9fa;
		border-color: #e5e7eb;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.legend-icon-wrapper {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.legend-color {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		flex-shrink: 0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.legend-icon {
		font-size: 14px;
		line-height: 1;
	}

	.legend-details {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.legend-label {
		font-weight: 500;
		color: #333;
		font-size: 0.875rem;
	}

	.legend-values {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
	}

	.legend-percentage {
		font-size: 0.75rem;
		color: #666;
	}

	.legend-amount {
		font-weight: 600;
		color: #333;
		font-size: 0.875rem;
	}

	@media (max-width: 768px) {
		.chart-wrapper {
			width: 240px;
			height: 240px;
		}

		.legend {
			grid-template-columns: 1fr;
			max-width: 100%;
		}

		.chart-header {
			flex-direction: column;
			gap: 10px;
			text-align: center;
		}

		.legend-item {
			padding: 8px 10px;
		}

		.legend-details {
			gap: 8px;
		}
	}
</style>
