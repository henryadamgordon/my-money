<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { authStore } from '$lib/stores/auth';
	import ReportManagement from '$lib/components/reports/ReportManagement.svelte';

	let isLoading = true;
	let errorMessage = '';

	onMount(() => {
		isLoading = false;
	});

	function dismissError() {
		errorMessage = '';
	}
</script>

<svelte:head>
	<title>Reports - My Money</title>
</svelte:head>

<div class="reports-page">
	<div class="header">
		<h1>📊 Reports</h1>
		<p class="subtitle">Compare your budget vs actual spending</p>
	</div>

	{#if errorMessage}
		<div class="error-message">
			<span>{errorMessage}</span>
			<button type="button" class="dismiss-btn" on:click={dismissError}>×</button>
		</div>
	{/if}

	{#if isLoading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading reports...</p>
		</div>
	{:else}
		<ReportManagement />
	{/if}
</div>

<style>
	.reports-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.header h1 {
		color: #2c3e50;
		margin-bottom: 0.5rem;
		font-size: 2.5rem;
	}

	.subtitle {
		color: #7f8c8d;
		font-size: 1.1rem;
		margin: 0;
	}

	.error-message {
		background-color: #fee;
		border: 1px solid #fcc;
		color: #c33;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.dismiss-btn {
		background: none;
		border: none;
		color: #c33;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.dismiss-btn:hover {
		background-color: rgba(204, 51, 51, 0.1);
		border-radius: 50%;
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

	@media (max-width: 768px) {
		.reports-page {
			padding: 0.5rem;
		}

		.header h1 {
			font-size: 2rem;
		}

		.subtitle {
			font-size: 1rem;
		}
	}
</style>
