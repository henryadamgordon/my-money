<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { TransactionService } from '$lib/services/transactionService';
	import { CategoryService } from '$lib/services/categoryService';
	import { BudgetService } from '$lib/services/budgetService';
	import { TransactionForm, TransactionTable, TransactionSummary, DateRangePicker } from '$lib/components/transactions';
	import { Modal } from '$lib/components/common';
	import type { Transaction } from '$lib/types/transaction';
	import type { Category } from '$lib/services/categoryService';
	import type { BudgetItem } from '$lib/services/budgetService';

	let transactions: Transaction[] = [];
	let categories: Category[] = [];
	let budgetItems: BudgetItem[] = [];
	let isLoading = false;
	let showForm = false;
	let editingTransaction: Transaction | null = null;
	let errorMessage = '';

	function getCurrentMonthRange() {
		const now = new Date();
		const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
		const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
		return { startDate, endDate };
	}

	let { startDate, endDate } = getCurrentMonthRange();
	let dateRange = { startDate, endDate };

	onMount(() => {
		loadData();
	});

	async function loadData() {
		if (!$authStore.user?.id) return;

		isLoading = true;
		try {
			// First, try to initialize default categories if none exist
			await CategoryService.initializeDefaultCategories($authStore.user.id);
			
			const [transactionsData, categoriesData, budgetItemsData] = await Promise.all([
				TransactionService.getTransactions($authStore.user.id, dateRange.startDate, dateRange.endDate),
				CategoryService.getCategories($authStore.user.id),
				BudgetService.getBudgetItems($authStore.user.id)
			]);
			
			transactions = transactionsData;
			categories = categoriesData;
			budgetItems = budgetItemsData;
		} catch (error) {
			console.error('Error loading data:', error);
			errorMessage = 'Failed to load transactions. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	async function handleAddTransaction(event: CustomEvent) {
		if (!$authStore.user?.id) return;

		isLoading = true;
		errorMessage = '';

		try {
			const transactionData = {
				...event.detail,
				userId: $authStore.user.id
			};

			await TransactionService.addTransaction(transactionData);
			await loadData(); // Reload to get updated list
			showForm = false;
		} catch (error) {
			console.error('Error adding transaction:', error);
			errorMessage = 'Failed to add transaction. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	async function handleUpdateTransaction(event: CustomEvent) {
		if (!$authStore.user?.id || !editingTransaction) return;

		isLoading = true;
		errorMessage = '';

		try {
			const { id, ...updateData } = event.detail;
			await TransactionService.updateTransaction(editingTransaction.id!, updateData);
			await loadData(); // Reload to get updated list
			editingTransaction = null;
			showForm = false;
		} catch (error) {
			console.error('Error updating transaction:', error);
			errorMessage = 'Failed to update transaction. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	async function handleDeleteTransaction(event: CustomEvent) {
		const transactionId = event.detail;
		if (!transactionId) return;

		isLoading = true;
		errorMessage = '';

		try {
			await TransactionService.deleteTransaction(transactionId);
			await loadData(); // Reload to get updated list
		} catch (error) {
			console.error('Error deleting transaction:', error);
			errorMessage = 'Failed to delete transaction. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function handleEditTransaction(event: CustomEvent) {
		editingTransaction = event.detail;
		showForm = true;
	}

	function handleCancelEdit() {
		editingTransaction = null;
		showForm = false;
	}

	function toggleForm() {
		showForm = !showForm;
		if (!showForm) {
			editingTransaction = null;
		}
	}

	function dismissError() {
		errorMessage = '';
	}

	function handleDateRangeChange(event: CustomEvent) {
		dateRange = event.detail;
		loadData();
	}
</script>

<div class="transaction-management">
	<div class="action-bar">
		<button 
			class="add-new-btn"
			on:click={toggleForm}
			disabled={isLoading}
		>
			{#if showForm}
				❌ Cancel
			{:else}
				➕ Add New Transaction
			{/if}
		</button>
	</div>

	{#if errorMessage}
		<div class="error-message">
			<span>{errorMessage}</span>
			<button on:click={dismissError} class="dismiss-btn">✕</button>
		</div>
	{/if}

	<DateRangePicker 
		startDate={dateRange.startDate}
		endDate={dateRange.endDate}
		disabled={isLoading}
		on:dateRangeChange={handleDateRangeChange}
	/>

	<TransactionSummary 
		{transactions} 
		{isLoading} 
		startDate={dateRange.startDate}
		endDate={dateRange.endDate}
	/>

	{#if showForm}
		<Modal
			title={editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
			on:close={handleCancelEdit}
		>
			<TransactionForm
				{categories}
				{budgetItems}
				{editingTransaction}
				{isLoading}
				on:add={handleAddTransaction}
				on:update={handleUpdateTransaction}
				on:cancel={handleCancelEdit}
			/>
		</Modal>
	{/if}

	<TransactionTable
		{transactions}
		{categories}
		{isLoading}
		on:edit={handleEditTransaction}
		on:delete={handleDeleteTransaction}
	/>
</div>

<style>
	.transaction-management {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}

	.action-bar {
		display: flex;
		justify-content: flex-end;
		gap: 15px;
		flex-wrap: wrap;
		margin-bottom: 20px;
	}

	.add-new-btn {
		background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.add-new-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
	}

	.add-new-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.error-message {
		background: #f8d7da;
		color: #721c24;
		padding: 12px 20px;
		border-radius: 8px;
		margin-bottom: 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border: 1px solid #f5c6cb;
	}

	.dismiss-btn {
		background: none;
		border: none;
		color: #721c24;
		cursor: pointer;
		font-size: 1.2rem;
		padding: 0;
		margin-left: 10px;
	}

	.dismiss-btn:hover {
		opacity: 0.7;
	}

	@media (max-width: 768px) {
		.transaction-management {
			padding: 15px;
		}

		.section-header h2 {
			font-size: 1.6rem;
		}

		.action-bar {
			flex-direction: column;
			align-items: center;
		}

		.add-new-btn {
			width: 100%;
			max-width: 300px;
			justify-content: center;
		}
	}
</style>
