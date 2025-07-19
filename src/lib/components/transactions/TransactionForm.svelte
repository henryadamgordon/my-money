<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { TransactionFormData } from '$lib/types/transaction';
	import type { Category } from '$lib/services/categoryService';

	export let categories: Category[] = [];
	export let budgetItems: any[] = [];
	export let editingTransaction: any = null;
	export let isLoading = false;

	const dispatch = createEventDispatcher();

	let formData: TransactionFormData = {
		description: '',
		amount: '',
		transactionDate: new Date().toISOString().split('T')[0],
		type: 'expense',
		categoryId: '',
		budgetItemId: '',
		owner: ''
	};

	let errors: Partial<TransactionFormData> = {};

	// Populate form when editing
	$: if (editingTransaction) {
		formData = {
			description: editingTransaction.description || '',
			amount: editingTransaction.amount?.toString() || '',
			transactionDate: editingTransaction.transactionDate 
				? new Date(editingTransaction.transactionDate).toISOString().split('T')[0]
				: new Date().toISOString().split('T')[0],
			type: editingTransaction.type || 'expense',
			categoryId: editingTransaction.categoryId || '',
			budgetItemId: editingTransaction.budgetItemId || '',
			owner: editingTransaction.owner || ''
		};
	}

	function validateForm(): boolean {
		errors = {};
		let isValid = true;

		if (!formData.description.trim()) {
			errors.description = 'Description is required';
			isValid = false;
		}

		if (!formData.amount || parseFloat(formData.amount) <= 0) {
			errors.amount = 'Amount must be greater than 0';
			isValid = false;
		}

		if (!formData.transactionDate) {
			errors.transactionDate = 'Transaction date is required';
			isValid = false;
		}

		if (!formData.owner.trim()) {
			errors.owner = 'Owner is required';
			isValid = false;
		}

		return isValid;
	}

	function handleSubmit() {
		if (!validateForm()) return;

		const transactionData = {
			...formData,
			amount: parseFloat(formData.amount),
			transactionDate: new Date(formData.transactionDate),
			registrationDate: new Date()
		};

		if (editingTransaction) {
			dispatch('update', { id: editingTransaction.id, ...transactionData });
		} else {
			dispatch('add', transactionData);
		}

		resetForm();
	}

	function resetForm() {
		formData = {
			description: '',
			amount: '',
			transactionDate: new Date().toISOString().split('T')[0],
			type: 'expense',
			categoryId: '',
			budgetItemId: '',
			owner: ''
		};
		errors = {};
		dispatch('cancel');
	}

	function handleCancel() {
		resetForm();
	}

	// Auto-fill form when budget item is selected
	function handleBudgetItemChange() {
		if (formData.budgetItemId) {
			const selectedBudgetItem = budgetItems.find(item => item.id === formData.budgetItemId);
			if (selectedBudgetItem) {
				// Auto-fill type and category from budget item
				formData.type = selectedBudgetItem.type;
				formData.categoryId = selectedBudgetItem.category || '';
				// Optionally pre-fill description if empty
				if (!formData.description.trim()) {
					formData.description = selectedBudgetItem.name;
				}
			}
		}
	}
</script>

<div class="transaction-form">
	<h3>{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</h3>
	
	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-grid">
			<div class="form-group">
				<label for="description">Description *</label>
				<input
					id="description"
					type="text"
					bind:value={formData.description}
					placeholder="Enter transaction description"
					class:error={errors.description}
					disabled={isLoading}
				/>
				{#if errors.description}
					<span class="error-message">{errors.description}</span>
				{/if}
			</div>

			<div class="form-group">
				<label for="amount">Amount *</label>
				<input
					id="amount"
					type="number"
					step="0.01"
					min="0"
					bind:value={formData.amount}
					placeholder="0.00"
					class:error={errors.amount}
					disabled={isLoading}
				/>
				{#if errors.amount}
					<span class="error-message">{errors.amount}</span>
				{/if}
			</div>

			<div class="form-group">
				<label for="transactionDate">Transaction Date *</label>
				<input
					id="transactionDate"
					type="date"
					bind:value={formData.transactionDate}
					class:error={errors.transactionDate}
					disabled={isLoading}
				/>
				{#if errors.transactionDate}
					<span class="error-message">{errors.transactionDate}</span>
				{/if}
			</div>

			<div class="form-group">
				<label for="type">Type *</label>
				<select
					id="type"
					bind:value={formData.type}
					disabled={isLoading}
				>
					<option value="expense">💸 Expense</option>
					<option value="income">💰 Income</option>
				</select>
			</div>

			<div class="form-group">
				<label for="budgetItemId">Budget Item (Optional)</label>
				<select
					id="budgetItemId"
					bind:value={formData.budgetItemId}
					on:change={handleBudgetItemChange}
					disabled={isLoading}
				>
					<option value="">Select a budget item (optional)</option>
					{#each budgetItems as budgetItem}
						<option value={budgetItem.id}>
							{budgetItem.type === 'income' ? '💰' : budgetItem.type === 'expense' ? '💸' : '💳'} 
							{budgetItem.name}
						</option>
					{/each}
				</select>
				<small class="field-hint">Selecting a budget item will auto-fill type and category</small>
			</div>

			<div class="form-group">
				<label for="categoryId">Category</label>
				<select
					id="categoryId"
					bind:value={formData.categoryId}
					disabled={isLoading}
				>
					<option value="">Select a category</option>
					{#each categories as category}
						<option value={category.id}>{category.icon} {category.name}</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label for="owner">Owner *</label>
				<input
					id="owner"
					type="text"
					bind:value={formData.owner}
					placeholder="Enter owner name"
					class:error={errors.owner}
					disabled={isLoading}
				/>
				{#if errors.owner}
					<span class="error-message">{errors.owner}</span>
				{/if}
			</div>
		</div>

		<div class="form-actions">
			<button type="submit" class="btn-primary" disabled={isLoading}>
				{#if isLoading}
					⏳ {editingTransaction ? 'Updating...' : 'Adding...'}
				{:else}
					{editingTransaction ? '✏️ Update Transaction' : '➕ Add Transaction'}
				{/if}
			</button>
			
			{#if editingTransaction}
				<button type="button" class="btn-secondary" on:click={handleCancel} disabled={isLoading}>
					❌ Cancel
				</button>
			{/if}
		</div>
	</form>
</div>

<style>
	.transaction-form {
		background: white;
		padding: 25px;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		margin-bottom: 30px;
	}

	.transaction-form h3 {
		margin: 0 0 20px 0;
		color: #333;
		font-size: 1.4rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 20px;
		margin-bottom: 25px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group label {
		margin-bottom: 8px;
		font-weight: 600;
		color: #555;
		font-size: 0.9rem;
	}

	.form-group input,
	.form-group select {
		padding: 12px;
		border: 2px solid #e1e5e9;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.3s ease;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.form-group input.error {
		border-color: #e74c3c;
	}

	.error-message {
		color: #e74c3c;
		font-size: 0.8rem;
		margin-top: 5px;
	}

	.field-hint {
		color: #666;
		font-size: 0.75rem;
		margin-top: 4px;
		font-style: italic;
	}

	.form-actions {
		display: flex;
		gap: 15px;
		flex-wrap: wrap;
	}

	.btn-primary,
	.btn-secondary {
		padding: 12px 24px;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	.btn-secondary {
		background: #6c757d;
		color: white;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #5a6268;
		transform: translateY(-2px);
	}

	.btn-primary:disabled,
	.btn-secondary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
		
		.form-actions {
			flex-direction: column;
		}
		
		.btn-primary,
		.btn-secondary {
			width: 100%;
			justify-content: center;
		}
	}
</style>
