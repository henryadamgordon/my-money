<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { BudgetItem } from '$lib/services/budgetService';
	import type { Category } from '$lib/services/categoryService';
	import * as XLSX from 'xlsx';
	import { Modal } from '$lib/components/ui';

	// Props
	export let budgetItems: BudgetItem[] = [];
	export let categories: Category[] = [];

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		exportComplete: { success: boolean; message: string };
	}>();

	// Component state
	let showExportInfo = false;
	let isExporting = false;

	// Format payment method for display
	function formatPaymentMethod(method: string): string {
		return method;
	}

	// Format type for display
	function formatType(type: string): string {
		return type;
	}

	// Get category name by ID
	function getCategoryName(categoryId?: string): string {
		if (!categoryId) return '';
		const category = categories.find(cat => cat.id === categoryId);
		return category ? category.name : '';
	}

	// Excel export function
	async function handleExcelExport() {
		if (budgetItems.length === 0) {
			dispatch('exportComplete', {
				success: false,
				message: 'No budget items to export'
			});
			return;
		}

		try {
			isExporting = true;

			// Prepare data for export
			const exportData = budgetItems.map(item => ({
				name: item.name,
				type: formatType(item.type),
				amount: item.amount,
				owner: item.owner,
				paymentMethod: formatPaymentMethod(item.paymentMethod),
				isRecurrent: item.isRecurrent,
				dueDay: item.dueDay || '',
				dueDate: item.dueDate || '',
				category: getCategoryName(item.category),
				createdAt: item.createdAt
			}));

			// Create worksheet
			const worksheet = XLSX.utils.json_to_sheet(exportData);

			// Set column widths
			const columnWidths = [
				{ wch: 25 }, // name
				{ wch: 10 }, // type
				{ wch: 12 }, // amount
				{ wch: 15 }, // owner
				{ wch: 18 }, // paymentMethod
				{ wch: 12 }, // isRecurrent
				{ wch: 10 }, // dueDay
				{ wch: 12 }, // dueDate
				{ wch: 15 }, // category
				{ wch: 20 }  // createdAt
			];
			worksheet['!cols'] = columnWidths;

			// Create workbook
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget Items');

			// Generate file name with timestamp
			const timestamp = new Date().toISOString().split('T')[0];
			const fileName = `budget_export_${timestamp}.xlsx`;

			// Download file
			XLSX.writeFile(workbook, fileName);

			dispatch('exportComplete', {
				success: true,
				message: `Successfully exported ${budgetItems.length} budget items!`
			});

		} catch (err) {
			console.error('Excel export error:', err);
			dispatch('exportComplete', {
				success: false,
				message: 'Failed to export to Excel. Please try again.'
			});
		} finally {
			isExporting = false;
		}
	}

	function openExportInfo() {
		showExportInfo = true;
	}

	function closeExportInfo() {
		showExportInfo = false;
	}
</script>

<!-- Excel Export Section -->
<div class="excel-export">
	<button
		on:click={handleExcelExport}
		disabled={isExporting || budgetItems.length === 0}
		class="export-btn"
		title="Export budget items to Excel file"
	>
		{#if isExporting}
			⏳ Exporting...
		{:else}
			📥 Export Excel
		{/if}
	</button>

	<button
		on:click={openExportInfo}
		class="info-btn"
		title="Show export information"
	>
		ℹ️
	</button>
</div>

<!-- Excel Export Info Modal -->
<Modal
	show={showExportInfo}
	title="📥 Excel Export Information"
	titleId="excel-export-modal-title"
	size="large"
	on:close={closeExportInfo}
>
	<p>The Excel export will include all currently displayed budget items with the following columns:</p>

	<div class="format-table">
		<div class="format-header">
			<span>Column</span>
			<span>Description</span>
		</div>
		<div class="format-row">
			<span><strong>name</strong></span>
			<span>Budget item name</span>
		</div>
		<div class="format-row">
			<span><strong>type</strong></span>
			<span>Type: income, expense, or savings</span>
		</div>
		<div class="format-row">
			<span><strong>amount</strong></span>
			<span>Amount in currency</span>
		</div>
		<div class="format-row">
			<span><strong>owner</strong></span>
			<span>Owner/responsible person</span>
		</div>
		<div class="format-row">
			<span><strong>paymentMethod</strong></span>
			<span>Payment method used</span>
		</div>
		<div class="format-row">
			<span><strong>isRecurrent</strong></span>
			<span>Whether the item is recurring</span>
		</div>
		<div class="format-row">
			<span><strong>dueDay</strong></span>
			<span>Day of month for recurring items (1-31)</span>
		</div>
		<div class="format-row">
			<span><strong>dueDate</strong></span>
			<span>Specific date for one-time items</span>
		</div>
		<div class="format-row">
			<span><strong>category</strong></span>
			<span>Category name (if assigned)</span>
		</div>
		<div class="format-row">
			<span><strong>createdAt</strong></span>
			<span>Date/time when item was created</span>
		</div>
	</div>

	<div class="export-notes">
		<h4>Notes:</h4>
		<ul>
			<li>The exported file will include all items currently visible in your table (respecting filters and search)</li>
			<li>File name format: budget_export_YYYY-MM-DD.xlsx</li>
			<li>The exported file can be re-imported using the Import Excel feature</li>
			<li>Category names are exported (not internal IDs) for better readability</li>
		</ul>
	</div>
</Modal>

<style>
	.excel-export {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.export-btn {
		background: #28a745;
		color: white;
		border: none;
		padding: 0.75rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
		white-space: nowrap;
	}

	.export-btn:hover:not(:disabled) {
		background: #218838;
	}

	.export-btn:disabled {
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
		grid-template-columns: 1fr 2fr;
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

	.export-notes {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 4px;
	}

	.export-notes h4 {
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.export-notes ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.export-notes li {
		margin: 0.25rem 0;
		color: #555;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.excel-export {
			flex-direction: column;
			align-items: stretch;
		}

		.export-btn {
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
	}
</style>
