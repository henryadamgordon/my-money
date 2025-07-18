<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { BudgetItem } from '$lib/services/budgetService';
	import type { Category } from '$lib/services/categoryService';

	// Props
	export let budgetItems: BudgetItem[] = [];
	export let categories: Category[] = [];
	export let filters: {
		search: string;
		type: string;
		owner: string;
		paymentMethod: string;
		category: string;
		recurrent: string;
	} = {
		search: '',
		type: '',
		owner: '',
		paymentMethod: '',
		category: '',
		recurrent: ''
	};

	// Table state
	export let currentPage = 1;
	export let itemsPerPage = 10;
	export let sortField: string = 'createdAt';
	export let sortDirection: 'asc' | 'desc' = 'desc';

	const dispatch = createEventDispatcher<{
		edit: { item: BudgetItem };
		delete: { id: string };
		sort: { field: string; direction: 'asc' | 'desc' };
		pageChange: { page: number };
		itemsPerPageChange: { itemsPerPage: number };
	}>();

	// Computed values
	$: filteredItems = budgetItems.filter(item => {
		const matchesSearch = !filters.search || 
			item.name.toLowerCase().includes(filters.search.toLowerCase());
		const matchesType = !filters.type || item.type === filters.type;
		const matchesOwner = !filters.owner || item.owner === filters.owner;
		const matchesPaymentMethod = !filters.paymentMethod || item.paymentMethod === filters.paymentMethod;
		const matchesCategory = !filters.category || item.category === filters.category;
		const matchesRecurrent = !filters.recurrent || 
			(filters.recurrent === 'recurrent' && item.isRecurrent) ||
			(filters.recurrent === 'one-time' && !item.isRecurrent);

		return matchesSearch && matchesType && matchesOwner && 
			   matchesPaymentMethod && matchesCategory && matchesRecurrent;
	}).sort((a, b) => {
		let aValue: any;
		let bValue: any;

		if (sortField === 'dueDate') {
			// Special handling for due date sorting
			if (a.isRecurrent && b.isRecurrent) {
				aValue = a.dueDay || 0;
				bValue = b.dueDay || 0;
			} else if (!a.isRecurrent && !b.isRecurrent) {
				aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
				bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
			} else {
				// Mixed: put recurrent items first, then non-recurrent
				if (a.isRecurrent && !b.isRecurrent) return sortDirection === 'asc' ? -1 : 1;
				if (!a.isRecurrent && b.isRecurrent) return sortDirection === 'asc' ? 1 : -1;
			}
		} else {
			aValue = a[sortField as keyof BudgetItem];
			bValue = b[sortField as keyof BudgetItem];
		}

		// Handle null/undefined values
		if (aValue == null && bValue == null) return 0;
		if (aValue == null) return 1;
		if (bValue == null) return -1;

		// Convert to string for comparison if needed
		if (typeof aValue === 'string' && typeof bValue === 'string') {
			aValue = aValue.toLowerCase();
			bValue = bValue.toLowerCase();
		}

		if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
		if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
		return 0;
	});

	$: totalPages = Math.ceil(filteredItems.length / itemsPerPage);
	$: paginatedItems = filteredItems.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Functions
	function handleSort(field: string) {
		if (sortField === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'asc';
		}
		dispatch('sort', { field: sortField, direction: sortDirection });
	}

	function goToPage(page: number) {
		currentPage = page;
		dispatch('pageChange', { page });
	}

	function handleItemsPerPageChange() {
		currentPage = 1; // Reset to first page when changing items per page
		dispatch('itemsPerPageChange', { itemsPerPage });
		dispatch('pageChange', { page: 1 });
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString();
	}

	function getCategoryDisplay(categoryId: string | null): { name: string; color: string; icon: string } {
		if (!categoryId) {
			return { name: 'Uncategorized', color: '#6c757d', icon: '📂' };
		}
		
		const category = categories.find(c => c.id === categoryId);
		if (!category) {
			return { name: 'Uncategorized', color: '#6c757d', icon: '📂' };
		}
		
		return {
			name: category.name,
			color: category.color,
			icon: category.icon
		};
	}

	function handleEdit(item: BudgetItem) {
		dispatch('edit', { item });
	}

	function handleDelete(id: string) {
		dispatch('delete', { id });
	}
</script>

<div class="budget-table-container">
	<div class="table-header">
		<h2>Budget Items ({filteredItems.length} of {budgetItems.length})</h2>
		<div class="table-controls">
			<div class="items-per-page">
				<label for="itemsPerPage">Items per page:</label>
				<select id="itemsPerPage" bind:value={itemsPerPage} on:change={handleItemsPerPageChange}>
					<option value={5}>5</option>
					<option value={10}>10</option>
					<option value={25}>25</option>
					<option value={50}>50</option>
				</select>
			</div>
		</div>
	</div>
	
	{#if budgetItems.length === 0}
		<div class="empty-state">
			<p>No budget items yet. Add your first budget item to get started!</p>
		</div>
	{:else if filteredItems.length === 0}
		<div class="empty-state">
			<p>No items match your current filters. Try adjusting your search criteria.</p>
		</div>
	{:else}
		<div class="table-wrapper">
			<table class="budget-table">
				<thead>
					<tr>
						<th>
							<button class="sort-btn" on:click={() => handleSort('name')}>
								Name
								{#if sortField === 'name'}
									<span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</th>
						<th>
							<button class="sort-btn" on:click={() => handleSort('type')}>
								Type
								{#if sortField === 'type'}
									<span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</th>
						<th>
							<button class="sort-btn" on:click={() => handleSort('amount')}>
								Amount
								{#if sortField === 'amount'}
									<span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</th>
						<th>
							<button class="sort-btn" on:click={() => handleSort('dueDate')}>
								Due Date
								{#if sortField === 'dueDate'}
									<span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</th>
						<th>
							<button class="sort-btn" on:click={() => handleSort('owner')}>
								Owner
								{#if sortField === 'owner'}
									<span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</th>
						<th>
							<button class="sort-btn" on:click={() => handleSort('paymentMethod')}>
								Payment Method
								{#if sortField === 'paymentMethod'}
									<span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</th>
						<th>Category</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each paginatedItems as item (item.id)}
						<tr class="budget-row {item.type}">
							<td class="name-cell">{item.name}</td>
							<td class="type-cell">
								<span class="type-badge {item.type}">
									{item.type === 'income' ? '💰' : item.type === 'expense' ? '💸' : '🏦'}
									{item.type.charAt(0).toUpperCase() + item.type.slice(1)}
								</span>
							</td>
							<td class="amount-cell">{formatCurrency(item.amount)}</td>
							<td class="date-cell">
								{#if item.isRecurrent}
									<span class="recurrent-badge">Day {item.dueDay}</span>
								{:else}
									{item.dueDate ? formatDate(item.dueDate) : 'N/A'}
								{/if}
							</td>
							<td class="owner-cell">{item.owner}</td>
							<td class="payment-cell">{item.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
							<td class="category-cell">
								{#if true}
									{@const categoryDisplay = getCategoryDisplay(item.category || null)}
									<span class="category-badge" style="background-color: {categoryDisplay.color}20; color: {categoryDisplay.color}; border: 1px solid {categoryDisplay.color}40;">
										{categoryDisplay.icon} {categoryDisplay.name}
									</span>
								{/if}
							</td>
							<td class="actions-cell">
								<div class="action-buttons">
									<button 
										on:click={() => handleEdit(item)} 
										class="edit-btn"
										title="Edit item"
									>
										✏️
									</button>
									<button 
										on:click={() => handleDelete(item.id)} 
										class="delete-btn"
										title="Delete item"
									>
										🗑️
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination Controls -->
		{#if totalPages > 1}
			<div class="pagination-container">
				<div class="pagination-info">
					Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
				</div>
				<div class="pagination-controls">
					<button 
						on:click={() => goToPage(1)} 
						class="pagination-btn" 
						disabled={currentPage === 1}
						title="First page"
					>
						«
					</button>
					<button 
						on:click={() => goToPage(currentPage - 1)} 
						class="pagination-btn" 
						disabled={currentPage === 1}
						title="Previous page"
					>
						‹
					</button>

					{#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
						const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
						return startPage + i;
					}) as pageNum}
						{#if pageNum <= totalPages}
							<button 
								on:click={() => goToPage(pageNum)} 
								class="pagination-btn {pageNum === currentPage ? 'active' : ''}"
								title="Page {pageNum}"
							>
								{pageNum}
							</button>
						{/if}
					{/each}

					<button 
						on:click={() => goToPage(currentPage + 1)} 
						class="pagination-btn" 
						disabled={currentPage === totalPages}
						title="Next page"
					>
						›
					</button>
					<button 
						on:click={() => goToPage(totalPages)} 
						class="pagination-btn" 
						disabled={currentPage === totalPages}
						title="Last page"
					>
						»
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.budget-table-container {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.table-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #eee;
		background: #f8f9fa;
	}

	.table-header h2 {
		margin: 0;
		color: #333;
		font-size: 1.25rem;
	}

	.table-controls {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.items-per-page {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.items-per-page label {
		font-size: 0.875rem;
		color: #666;
	}

	.items-per-page select {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #666;
	}

	.table-wrapper {
		overflow-x: auto;
	}

	.budget-table {
		width: 100%;
		border-collapse: collapse;
	}

	.budget-table th {
		background: #f8f9fa;
		padding: 1rem;
		text-align: left;
		border-bottom: 2px solid #dee2e6;
		font-weight: 600;
		color: #495057;
	}

	.sort-btn {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: inherit;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
	}

	.sort-btn:hover {
		color: #007bff;
	}

	.sort-icon {
		font-size: 0.75rem;
		color: #007bff;
	}

	.budget-table td {
		padding: 1rem;
		border-bottom: 1px solid #dee2e6;
		vertical-align: middle;
	}

	.budget-row:hover {
		background-color: #f8f9fa;
	}

	.budget-row.income {
		border-left: 4px solid #28a745;
	}

	.budget-row.expense {
		border-left: 4px solid #dc3545;
	}

	.budget-row.savings {
		border-left: 4px solid #17a2b8;
	}

	.type-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.type-badge.income {
		background-color: rgba(40, 167, 69, 0.1);
		color: #28a745;
	}

	.type-badge.expense {
		background-color: rgba(220, 53, 69, 0.1);
		color: #dc3545;
	}

	.type-badge.savings {
		background-color: rgba(23, 162, 184, 0.1);
		color: #17a2b8;
	}

	.amount-cell {
		font-weight: 600;
		text-align: right;
	}

	.recurrent-badge {
		background-color: rgba(108, 117, 125, 0.1);
		color: #6c757d;
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.category-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.edit-btn, .delete-btn {
		background: none;
		border: none;
		padding: 0.25rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: background-color 0.2s;
	}

	.edit-btn:hover {
		background: rgba(0, 123, 255, 0.1);
	}

	.delete-btn:hover {
		background: rgba(220, 53, 69, 0.1);
	}

	.pagination-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-top: 1px solid #dee2e6;
		background: #f8f9fa;
	}

	.pagination-info {
		font-size: 0.875rem;
		color: #6c757d;
	}

	.pagination-controls {
		display: flex;
		gap: 0.25rem;
	}

	.pagination-btn {
		padding: 0.5rem 0.75rem;
		border: 1px solid #dee2e6;
		background: white;
		color: #495057;
		cursor: pointer;
		border-radius: 4px;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.pagination-btn:hover:not(:disabled) {
		background: #e9ecef;
		border-color: #adb5bd;
	}

	.pagination-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pagination-btn.active {
		background: #007bff;
		border-color: #007bff;
		color: white;
	}

	@media (max-width: 768px) {
		.table-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.pagination-container {
			flex-direction: column;
			gap: 1rem;
			align-items: center;
		}

		.pagination-controls {
			flex-wrap: wrap;
			justify-content: center;
		}
	}
</style>
