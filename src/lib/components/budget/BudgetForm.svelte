<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { BudgetItem } from '$lib/services/budgetService';
	import type { Category } from '$lib/services/categoryService';

	// Props
	export let categories: Category[] = [];
	export let editingItem: BudgetItem | null = null;
	export let isVisible: boolean = false;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		submit: { formData: Partial<BudgetItem> };
		cancel: void;
	}>();

	// Form data
	let formData: Partial<BudgetItem> = {
		name: '',
		type: 'expense',
		amount: 0,
		owner: '',
		paymentMethod: 'cash',
		isRecurrent: false,
		dueDay: undefined,
		dueDate: '',
		category: ''
	};

	// Form errors
	let errors: Record<string, string> = {};

	// Reset form data when editing item changes
	$: {
		if (editingItem) {
			formData = {
				name: editingItem.name,
				type: editingItem.type,
				amount: editingItem.amount,
				owner: editingItem.owner,
				paymentMethod: editingItem.paymentMethod,
				isRecurrent: editingItem.isRecurrent,
				dueDay: editingItem.dueDay,
				dueDate: editingItem.dueDate || '',
				category: editingItem.category || ''
			};
			errors = {};
		} else {
			// Reset to defaults for new item
			formData = {
				name: '',
				type: 'expense',
				amount: 0,
				owner: '',
				paymentMethod: 'cash',
				isRecurrent: false,
				dueDay: undefined,
				dueDate: '',
				category: ''
			};
			errors = {};
		}
	}

	function validateForm(): boolean {
		errors = {};

		if (!formData.name?.trim()) {
			errors.name = 'Name is required';
		}

		if (!formData.amount || formData.amount <= 0) {
			errors.amount = 'Amount must be greater than 0';
		}

		if (!formData.owner?.trim()) {
			errors.owner = 'Owner is required';
		}

		if (formData.isRecurrent) {
			if (!formData.dueDay || formData.dueDay < 1 || formData.dueDay > 31) {
				errors.dueDay = 'Due day must be between 1-31';
			}
		} else {
			if (!formData.dueDate) {
				errors.dueDate = 'Due date is required';
			}
		}

		return Object.keys(errors).length === 0;
	}

	function handleSubmit() {
		if (validateForm()) {
			dispatch('submit', { formData });
			// Reset form immediately after submission for new items
			if (!editingItem) {
				resetFormData();
			}
		}
	}

	function resetFormData() {
		formData = {
			name: '',
			type: 'expense',
			amount: 0,
			owner: '',
			paymentMethod: 'cash',
			isRecurrent: false,
			dueDay: undefined,
			dueDate: '',
			category: ''
		};
		errors = {};
	}

	function handleCancel() {
		dispatch('cancel');
	}
</script>

{#if isVisible}
	<div id="budget-form-section" class="add-form-container">
		<h2>{editingItem ? 'Edit Budget Item' : 'Add New Budget Item'}</h2>
		<form on:submit|preventDefault={handleSubmit} class="budget-form">
			<div class="form-row">
				<div class="form-group">
					<label for="name">Name *</label>
					<input
						id="name"
						type="text"
						bind:value={formData.name}
						placeholder="e.g., Monthly Rent"
						class:error={errors.name}
					/>
					{#if errors.name}
						<span class="error-text">{errors.name}</span>
					{/if}
				</div>

				<div class="form-group">
					<label for="type">Type *</label>
					<select id="type" bind:value={formData.type}>
						<option value="income">💰 Income</option>
						<option value="expense">💸 Expense</option>
						<option value="savings">🏦 Savings</option>
					</select>
				</div>
			</div>

			<div class="form-row">
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
					/>
					{#if errors.amount}
						<span class="error-text">{errors.amount}</span>
					{/if}
				</div>

				<div class="form-group">
					<fieldset>
						<legend>Schedule Type *</legend>
						<div class="radio-group">
							<label class="radio-option">
								<input
									type="radio"
									bind:group={formData.isRecurrent}
									value={true}
								/>
								🔄 Recurrent (Monthly)
							</label>
							<label class="radio-option">
								<input
									type="radio"
									bind:group={formData.isRecurrent}
									value={false}
								/>
								📅 One-time
							</label>
						</div>
					</fieldset>
				</div>
			</div>

			<div class="form-row">
				{#if formData.isRecurrent}
					<div class="form-group">
						<label for="dueDay">Due Day (1-31) *</label>
						<input
							id="dueDay"
							type="number"
							min="1"
							max="31"
							bind:value={formData.dueDay}
							placeholder="e.g., 15"
							class:error={errors.dueDay}
						/>
						{#if errors.dueDay}
							<span class="error-text">Please enter a day between 1-31</span>
						{/if}
					</div>
				{:else}
					<div class="form-group">
						<label for="dueDate">Due Date *</label>
						<input
							id="dueDate"
							type="date"
							bind:value={formData.dueDate}
							class:error={errors.dueDate}
						/>
						{#if errors.dueDate}
							<span class="error-text">Please select a date</span>
						{/if}
					</div>
				{/if}
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="owner">Owner *</label>
					<input
						id="owner"
						type="text"
						bind:value={formData.owner}
						placeholder="e.g., John Doe"
						class:error={errors.owner}
					/>
					{#if errors.owner}
						<span class="error-text">{errors.owner}</span>
					{/if}
				</div>

				<div class="form-group">
					<label for="paymentMethod">Payment Method *</label>
					<select id="paymentMethod" bind:value={formData.paymentMethod}>
						<option value="cash">💵 Cash</option>
						<option value="credit_card">💳 Credit Card</option>
						<option value="debit_card">💳 Debit Card</option>
						<option value="bank_transfer">🏦 Bank Transfer</option>
						<option value="check">📝 Check</option>
						<option value="other">🔧 Other</option>
					</select>
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="category">Category</label>
					<select id="category" bind:value={formData.category}>
						<option value="">Select a category (optional)</option>
						{#each categories as category}
							<option value={category.id}>{category.icon} {category.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="form-actions">
				<button type="submit" class="submit-btn">{editingItem ? 'Update Budget Item' : 'Add Budget Item'}</button>
				<button type="button" on:click={handleCancel} class="cancel-btn">Cancel</button>
			</div>
		</form>
	</div>
{/if}

<style>
	.add-form-container {
		background: white;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.add-form-container h2 {
		margin: 0 0 1.5rem 0;
		color: #333;
		font-size: 1.5rem;
	}

	.budget-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
		color: #333;
		font-size: 0.875rem;
	}

	.form-group input,
	.form-group select {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	.form-group input.error,
	.form-group select.error {
		border-color: #dc3545;
	}

	.error-text {
		color: #dc3545;
		font-size: 0.75rem;
		margin-top: 0.25rem;
	}

	fieldset {
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 0.75rem;
		margin: 0;
	}

	legend {
		font-size: 0.875rem;
		font-weight: 500;
		color: #333;
		padding: 0 0.5rem;
	}

	.radio-group {
		display: flex;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.radio-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.radio-option input[type="radio"] {
		margin: 0;
		width: auto;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
		justify-content: flex-start;
	}

	.submit-btn {
		background-color: #007bff;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: background-color 0.2s;
	}

	.submit-btn:hover {
		background-color: #0056b3;
	}

	.cancel-btn {
		background-color: #6c757d;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: background-color 0.2s;
	}

	.cancel-btn:hover {
		background-color: #545b62;
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.form-row {
			grid-template-columns: 1fr;
		}

		.radio-group {
			flex-direction: column;
			gap: 0.5rem;
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>
