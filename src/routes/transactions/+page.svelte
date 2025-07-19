<script lang="ts">
	import { TransactionManagement } from '$lib/components/transactions';
	import { goto } from '$app/navigation';

	function goToDashboard() {
		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Transactions - My Money App</title>
</svelte:head>

<div class="transactions-page">
	<div class="page-header">
		<div class="container">
			<button class="back-btn" on:click={goToDashboard}>
				← Back to Dashboard
			</button>
			<h1>💳 Transaction Management</h1>
		</div>
	</div>
	
	<div class="container">
		<TransactionManagement />
	</div>
</div>

<style>
	.transactions-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.page-header {
		padding: 20px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		margin-bottom: 20px;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		margin-bottom: 16px;
	}

	.back-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
	}

	.page-header h1 {
		color: white;
		margin: 0;
		font-size: 2rem;
		font-weight: 600;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 768px) {
		.page-header {
			padding: 15px 0;
			margin-bottom: 15px;
		}

		.container {
			padding: 0 15px;
		}

		.page-header h1 {
			font-size: 1.5rem;
		}

		.back-btn {
			padding: 8px 12px;
			font-size: 0.85rem;
		}
	}
</style>
