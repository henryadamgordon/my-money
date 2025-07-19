<script lang="ts">
	import { TransactionManagement } from '$lib/components/transactions';
</script>

<svelte:head>
	<title>Transactions - My Money App</title>
</svelte:head>

<div class="transactions-page">
	<TransactionManagement />
</div>

<style>
	.transactions-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 20px 0;
	}

	@media (max-width: 768px) {
		.transactions-page {
			padding: 10px 0;
		}
	}
</style>
