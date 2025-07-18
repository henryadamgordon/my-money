<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { BudgetService, type BudgetItem } from '$lib/services/budgetService';
	import type { Category } from '$lib/services/categoryService';
	import * as XLSX from 'xlsx';
	import { Modal } from '$lib/components/ui';

	// Props
	export let categories: Category[] = [];

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		importComplete: { success: boolean; message: string };
		budgetItemsUpdated: void;
	}>();

	// Component state
	let showImportInfo = false;
	let importProgress = 0;
	let importTotal = 0;
	let isImporting = false;
	let fileInput: HTMLInputElement;

	// Excel import function
	async function handleExcelImport(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file || !$authStore.user) {
			return;
		}

		try {
			isImporting = true;
			importProgress = 0;
			importTotal = 0;

			// Read the Excel file
			const data = await file.arrayBuffer();
			const workbook = XLSX.read(data, { type: 'array' });
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];
			const jsonData = XLSX.utils.sheet_to_json(worksheet);

			if (jsonData.length === 0) {
				dispatch('importComplete', { success: false, message: 'Excel file is empty or has no data' });
				return;
			}

			importTotal = jsonData.length;
			let successCount = 0;
			let errorCount = 0;
			const errors: string[] = [];

			// Process each row
			for (let i = 0; i < jsonData.length; i++) {
				const row = jsonData[i] as any;
				importProgress = i + 1;

				try {
					// Validate required fields
					if (!row.name || !row.type || !row.amount || !row.owner || !row.paymentMethod) {
						errorCount++;
						errors.push(`Row ${i + 2}: Missing required fields`);
						continue;
					}

					// Validate type
					if (!['income', 'expense', 'savings'].includes(row.type?.toLowerCase())) {
						errorCount++;
						errors.push(`Row ${i + 2}: Invalid type '${row.type}'. Must be income, expense, or savings`);
						continue;
					}

					// Validate payment method
					const validPaymentMethods = ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other'];
					if (!validPaymentMethods.includes(row.paymentMethod?.toLowerCase())) {
						errorCount++;
						errors.push(`Row ${i + 2}: Invalid payment method '${row.paymentMethod}'`);
						continue;
					}

					// Parse amount
					const amount = parseFloat(row.amount);
					if (isNaN(amount) || amount <= 0) {
						errorCount++;
						errors.push(`Row ${i + 2}: Invalid amount '${row.amount}'`);
						continue;
					}

					// Determine if recurrent and parse due date/day
					const isRecurrent = row.isRecurrent?.toString().toLowerCase() === 'true' || row.isRecurrent === 1;
					let dueDay: number | undefined;
					let dueDate: string | undefined;

					if (isRecurrent) {
						if (row.dueDay) {
							dueDay = parseInt(row.dueDay);
							if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
								errorCount++;
								errors.push(`Row ${i + 2}: Invalid due day '${row.dueDay}'. Must be 1-31`);
								continue;
							}
						}
					} else {
						if (row.dueDate) {
							dueDate = row.dueDate;
						}
					}

					// Handle category (optional)
					let categoryId: string | undefined;
					if (row.category) {
						const categoryName = row.category.toString().trim();
						// Find category by name (case-insensitive)
						const foundCategory = categories.find(cat => 
							cat.name.toLowerCase() === categoryName.toLowerCase()
						);
						if (foundCategory) {
							categoryId = foundCategory.id;
						} else {
							// Category not found - add warning but continue
							console.warn(`Row ${i + 2}: Category '${categoryName}' not found, item will be uncategorized`);
						}
					}

					// Create budget item data
					const budgetItemData: any = {
						name: row.name.toString().trim(),
						type: row.type.toLowerCase(),
						amount: amount,
						isRecurrent: isRecurrent,
						owner: row.owner.toString().trim(),
						paymentMethod: row.paymentMethod.toLowerCase(),
						createdAt: new Date().toISOString()
					};

					// Add due date fields only if they have values
					if (dueDay) {
						budgetItemData.dueDay = dueDay;
					}
					if (dueDate) {
						budgetItemData.dueDate = dueDate;
					}
					// Add category if found
					if (categoryId) {
						budgetItemData.category = categoryId;
					}

					// Save to Firestore
					await BudgetService.addBudgetItem(budgetItemData, $authStore.user.id);
					successCount++;

				} catch (itemError) {
					errorCount++;
					errors.push(`Row ${i + 2}: ${itemError}`);
				}
			}

			// Show results
			if (successCount > 0) {
				dispatch('budgetItemsUpdated');
			}

			if (errorCount > 0) {
				const message = `Import completed with ${successCount} successful and ${errorCount} failed items. Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`;
				dispatch('importComplete', { success: false, message });
			} else {
				const message = `Successfully imported ${successCount} budget items!`;
				dispatch('importComplete', { success: true, message });
			}

		} catch (err) {
			console.error('Excel import error:', err);
			dispatch('importComplete', { success: false, message: 'Failed to import Excel file. Please check the file format.' });
		} finally {
			isImporting = false;
			importProgress = 0;
			importTotal = 0;
			// Reset file input
			input.value = '';
		}
	}

	function openImportInfo() {
		showImportInfo = true;
	}

	function closeImportInfo() {
		showImportInfo = false;
	}
</script>

<!-- Excel Import Section -->
<div class="excel-import">
	<input
		type="file"
		accept=".xlsx,.xls"
		on:change={handleExcelImport}
		disabled={isImporting}
		style="display: none;"
		bind:this={fileInput}
	/>
	
	<button
		on:click={() => fileInput?.click()}
		disabled={isImporting}
		class="import-btn"
		title="Import budget items from Excel file"
	>
		{#if isImporting}
			⏳ Importing... ({importProgress}/{importTotal})
		{:else}
			📊 Import Excel
		{/if}
	</button>
	
	<button
		on:click={openImportInfo}
		class="info-btn"
		title="Show Excel format requirements"
	>
		ℹ️
	</button>
</div>

<!-- Excel Import Info Modal -->
<Modal 
	show={showImportInfo} 
	title="📊 Excel Import Format"
	titleId="excel-import-modal-title"
	size="large"
	on:close={closeImportInfo}
>
	<p>Your Excel file should have the following columns (case-sensitive):</p>
	
	<div class="format-table">
		<div class="format-header">
			<span>Column</span>
			<span>Required</span>
			<span>Valid Values</span>
		</div>
		<div class="format-row">
			<span><strong>name</strong></span>
			<span>✓ Yes</span>
			<span>Any text</span>
		</div>
		<div class="format-row">
			<span><strong>type</strong></span>
			<span>✓ Yes</span>
			<span>income, expense, savings</span>
		</div>
		<div class="format-row">
			<span><strong>amount</strong></span>
			<span>✓ Yes</span>
			<span>Positive number</span>
		</div>
		<div class="format-row">
			<span><strong>owner</strong></span>
			<span>✓ Yes</span>
			<span>Any text</span>
		</div>
		<div class="format-row">
			<span><strong>paymentMethod</strong></span>
			<span>✓ Yes</span>
			<span>cash, credit_card, debit_card, bank_transfer, check, other</span>
		</div>
		<div class="format-row">
			<span><strong>isRecurrent</strong></span>
			<span>Optional</span>
			<span>true, false, 1, 0</span>
		</div>
		<div class="format-row">
			<span><strong>dueDay</strong></span>
			<span>Optional</span>
			<span>1-31 (for recurrent items)</span>
		</div>
		<div class="format-row">
			<span><strong>dueDate</strong></span>
			<span>Optional</span>
			<span>Date format (for one-time items)</span>
		</div>
		<div class="format-row">
			<span><strong>category</strong></span>
			<span>Optional</span>
			<span>Category name (must match existing categories)</span>
		</div>
	</div>

	<div class="format-example">
		<h4>Example:</h4>
		<div class="example-table">
			<div class="example-header">
				<span>name</span>
				<span>type</span>
				<span>amount</span>
				<span>owner</span>
				<span>paymentMethod</span>
				<span>category</span>
			</div>
			<div class="example-row">
				<span>Salary</span>
				<span>income</span>
				<span>5000</span>
				<span>John</span>
				<span>bank_transfer</span>
				<span>Salary</span>
			</div>
		</div>
	</div>
</Modal>

<style>
	.excel-import {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.import-btn {
		background: #17a2b8;
		color: white;
		border: none;
		padding: 0.75rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
		white-space: nowrap;
	}

	.import-btn:hover:not(:disabled) {
		background: #138496;
	}

	.import-btn:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.info-btn {
		background: #6c757d;
		color: white;
		border: none;
		padding: 0.75rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.info-btn:hover {
		background: #545b62;
	}

	.format-table {
		display: grid;
		grid-template-columns: 1fr 1fr 2fr;
		gap: 0.5rem;
		margin: 1rem 0;
		border: 1px solid #ddd;
		border-radius: 4px;
		overflow: hidden;
	}

	.format-header {
		display: contents;
		font-weight: bold;
		background: #f8f9fa;
	}

	.format-header > span {
		padding: 0.75rem;
		background: #f8f9fa;
		border-bottom: 2px solid #dee2e6;
	}

	.format-row {
		display: contents;
	}

	.format-row > span {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid #dee2e6;
	}

	.format-row:last-child > span {
		border-bottom: none;
	}

	.format-example {
		margin-top: 1.5rem;
	}

	.format-example h4 {
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.example-table {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.25rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		overflow: hidden;
		font-size: 0.85rem;
	}

	.example-header {
		display: contents;
		font-weight: bold;
		background: #e9ecef;
	}

	.example-header > span {
		padding: 0.5rem;
		background: #e9ecef;
		border-bottom: 1px solid #dee2e6;
	}

	.example-row {
		display: contents;
	}

	.example-row > span {
		padding: 0.5rem;
		background: white;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.excel-import {
			flex-direction: column;
			align-items: stretch;
		}

		.import-btn {
			width: 100%;
			text-align: center;
		}

		.format-table {
			grid-template-columns: 1fr;
			gap: 0;
		}

		.format-header,
		.format-row {
			display: block;
		}

		.format-header > span,
		.format-row > span {
			display: block;
			border-bottom: 1px solid #dee2e6;
		}

		.format-header > span {
			background: #f8f9fa;
			font-weight: bold;
			border-bottom: 2px solid #dee2e6;
		}

		.format-row > span:first-child {
			font-weight: bold;
			background: #f8f9fa;
		}

		.example-table {
			grid-template-columns: 1fr;
		}

		.example-header,
		.example-row {
			display: block;
		}

		.example-header > span,
		.example-row > span {
			display: block;
			border-bottom: 1px solid #dee2e6;
		}

		.example-header > span {
			background: #e9ecef;
			font-weight: bold;
		}

		.example-row > span:first-child {
			font-weight: bold;
			background: #f8f9fa;
		}
	}
</style>
