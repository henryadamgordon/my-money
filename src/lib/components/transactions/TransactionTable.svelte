<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Transaction } from '$lib/types/transaction';
	import type { Category } from '$lib/services/categoryService';
	import { browser } from '$app/environment';

	export let transactions: Transaction[] = [];
	export let categories: Category[] = [];
	export let isLoading = false;

	const dispatch = createEventDispatcher();

	// Pagination state
	let currentPage = 1;
	let itemsPerPage = 10;

	// Sorting state
	let sortField: string = 'transactionDate';
	let sortDirection: 'asc' | 'desc' = 'desc';

	// Filter state
	let filters = {
		search: '',
		type: '',
		owner: '',
		category: ''
	};

	// Storage keys for persistence
	const STORAGE_KEYS = {
		currentPage: 'transaction-table-current-page',
		itemsPerPage: 'transaction-table-items-per-page',
		sortField: 'transaction-table-sort-field',
		sortDirection: 'transaction-table-sort-direction',
		filters: 'transaction-table-filters'
	};

	// Load saved state
	function loadTableState() {
		if (!browser) return;
		
		try {
			const savedPage = localStorage.getItem(STORAGE_KEYS.currentPage);
			if (savedPage) currentPage = parseInt(savedPage);

			const savedItemsPerPage = localStorage.getItem(STORAGE_KEYS.itemsPerPage);
			if (savedItemsPerPage) itemsPerPage = parseInt(savedItemsPerPage);

			const savedSortField = localStorage.getItem(STORAGE_KEYS.sortField);
			const validSortFields = ['description', 'amount', 'transactionDate', 'type', 'owner', 'registrationDate'];
			if (savedSortField && validSortFields.includes(savedSortField)) {
				sortField = savedSortField;
			}

			const savedSortDirection = localStorage.getItem(STORAGE_KEYS.sortDirection);
			if (savedSortDirection && ['asc', 'desc'].includes(savedSortDirection)) {
				sortDirection = savedSortDirection as 'asc' | 'desc';
			}

			const savedFilters = localStorage.getItem(STORAGE_KEYS.filters);
			if (savedFilters) {
				filters = { ...filters, ...JSON.parse(savedFilters) };
			}
		} catch (error) {
			console.error('Error loading table state:', error);
		}
	}

	// Save state to localStorage
	$: if (browser && currentPage) {
		localStorage.setItem(STORAGE_KEYS.currentPage, currentPage.toString());
	}

	$: if (browser && itemsPerPage) {
		localStorage.setItem(STORAGE_KEYS.itemsPerPage, itemsPerPage.toString());
	}

	$: if (browser && sortField) {
		localStorage.setItem(STORAGE_KEYS.sortField, sortField);
	}

	$: if (browser && sortDirection) {
		localStorage.setItem(STORAGE_KEYS.sortDirection, sortDirection);
	}

	$: if (browser && filters) {
		localStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(filters));
	}

	// Initialize state on mount
	loadTableState();

	function getCategoryDisplay(categoryId: string | undefined): string {
		if (!categoryId) return 'Uncategorized';
		const category = categories.find(c => c.id === categoryId);
		return category ? `${category.icon} ${category.name}` : 'Uncategorized';
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString();
	}

	function formatAmount(amount: number, type: string): string {
		const formatted = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
		
		return type === 'income' ? `+${formatted}` : `-${formatted}`;
	}

	function handleEdit(transaction: Transaction) {
		dispatch('edit', transaction);
	}

	function handleDelete(transaction: Transaction) {
		if (confirm(`Are you sure you want to delete "${transaction.description}"?`)) {
			dispatch('delete', transaction.id);
		}
	}

	// Get unique values for filter dropdowns
	$: uniqueOwners = [...new Set(transactions.map(t => t.owner))].sort();
	$: uniqueCategories = categories.map(c => ({ id: c.id, name: c.name, icon: c.icon }));

	// Filtering logic
	$: filteredTransactions = transactions.filter(transaction => {
		// Search filter
		if (filters.search && !transaction.description.toLowerCase().includes(filters.search.toLowerCase())) {
			return false;
		}

		// Type filter
		if (filters.type && transaction.type !== filters.type) {
			return false;
		}

		// Owner filter
		if (filters.owner && transaction.owner !== filters.owner) {
			return false;
		}

		// Category filter
		if (filters.category) {
			if (filters.category === 'uncategorized' && transaction.categoryId) {
				return false;
			}
			if (filters.category !== 'uncategorized' && transaction.categoryId !== filters.category) {
				return false;
			}
		}

		return true;
	});

	// Sorting logic
	$: sortedTransactions = [...filteredTransactions].sort((a, b) => {
		let aValue: any;
		let bValue: any;

		switch (sortField) {
			case 'description':
				aValue = a.description.toLowerCase();
				bValue = b.description.toLowerCase();
				break;
			case 'amount':
				aValue = a.amount;
				bValue = b.amount;
				break;
			case 'transactionDate':
				aValue = new Date(a.transactionDate).getTime();
				bValue = new Date(b.transactionDate).getTime();
				break;
			case 'type':
				aValue = a.type;
				bValue = b.type;
				break;
			case 'owner':
				aValue = a.owner.toLowerCase();
				bValue = b.owner.toLowerCase();
				break;
			case 'registrationDate':
				aValue = new Date(a.registrationDate).getTime();
				bValue = new Date(b.registrationDate).getTime();
				break;
			default:
				return 0;
		}

		// Handle null/undefined values
		if (aValue == null && bValue == null) return 0;
		if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
		if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

		if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
		if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
		return 0;
	});

	// Pagination logic
	$: totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
	$: paginatedTransactions = sortedTransactions.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Reset to page 1 when filters change
	$: if (filters) {
		currentPage = 1;
	}

	// Sorting functions
	function handleSort(field: string) {
		if (sortField === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'asc';
		}
	}

	// Pagination functions
	function goToPage(page: number) {
		currentPage = Math.max(1, Math.min(page, totalPages));
	}

	// Clear filters
	function clearFilters() {
		filters = {
			search: '',
			type: '',
			owner: '',
			category: ''
		};
	}
</script>

<div class="transaction-table-container">
	<div class="table-header">
		<h3>Transactions</h3>
		<div class="table-info">
			{#if transactions.length > 0}
				<span class="item-count">
					Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedTransactions.length)} of {sortedTransactions.length} 
					{#if sortedTransactions.length !== transactions.length}(filtered from {transactions.length}){/if}
					transaction{sortedTransactions.length !== 1 ? 's' : ''}
				</span>
				<div class="items-per-page">
					<label for="itemsPerPage">Show:</label>
					<select id="itemsPerPage" bind:value={itemsPerPage}>
						<option value={5}>5</option>
						<option value={10}>10</option>
						<option value={25}>25</option>
						<option value={50}>50</option>
					</select>
				</div>
			{/if}
		</div>
	</div>

	<!-- Filters -->
	{#if transactions.length > 0}
		<div class="filters-section">
			<div class="filters-grid">
				<div class="filter-group">
					<label for="search">Search:</label>
					<input
						id="search"
						type="text"
						bind:value={filters.search}
						placeholder="Search descriptions..."
					/>
				</div>

				<div class="filter-group">
					<label for="typeFilter">Type:</label>
					<select id="typeFilter" bind:value={filters.type}>
						<option value="">All Types</option>
						<option value="income">Income</option>
						<option value="expense">Expense</option>
					</select>
				</div>

				<div class="filter-group">
					<label for="ownerFilter">Owner:</label>
					<select id="ownerFilter" bind:value={filters.owner}>
						<option value="">All Owners</option>
						{#each uniqueOwners as owner}
							<option value={owner}>{owner}</option>
						{/each}
					</select>
				</div>

				<div class="filter-group">
					<label for="categoryFilter">Category:</label>
					<select id="categoryFilter" bind:value={filters.category}>
						<option value="">All Categories</option>
						<option value="uncategorized">Uncategorized</option>
						{#each uniqueCategories as category}
							<option value={category.id}>{category.icon} {category.name}</option>
						{/each}
					</select>
				</div>

				<div class="filter-actions">
					<button type="button" class="clear-filters-btn" on:click={clearFilters}>
						Clear Filters
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading transactions...</p>
		</div>
	{:else if transactions.length === 0}
		<div class="empty-state">
			<div class="empty-icon">💳</div>
			<h4>No transactions yet</h4>
			<p>Start by adding your first transaction above!</p>
		</div>
	{:else if sortedTransactions.length === 0}
		<div class="empty-state">
			<div class="empty-icon">🔍</div>
			<h4>No transactions match your filters</h4>
			<p>Try adjusting your search criteria or clear the filters.</p>
		</div>
	{:else}
		<div class="table-wrapper">
			<table class="transaction-table">
				<thead>
					<tr>
						<th>
							<button class="sort-btn" on:click={() => handleSort('description')}>
								Description
								{#if sortField === 'description'}
									<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</th>
						<th>
							<button class="sort-btn" on:click={() => handleSort('amount')}>
								Amount
								{#if sortField === 'amount'}
									<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</th>
						<th>
							<button class="sort-btn" on:click={() => handleSort('type')}>
								Type
								{#if sortField === 'type'}
									<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</th>
						<th>Category</th>
						<th>
							<button class="sort-btn" on:click={() => handleSort('owner')}>
								Owner
								{#if sortField === 'owner'}
									<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</th>
						<th>
							<button class="sort-btn" on:click={() => handleSort('transactionDate')}>
								Transaction Date
								{#if sortField === 'transactionDate'}
									<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</th>
						<th>
							<button class="sort-btn" on:click={() => handleSort('registrationDate')}>
								Registration Date
								{#if sortField === 'registrationDate'}
									<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each paginatedTransactions as transaction}
						<tr>
							<td class="description-cell">
								<span class="description">{transaction.description}</span>
							</td>
							<td class="amount-cell">
								<span class="amount {transaction.type}">
									{formatAmount(transaction.amount, transaction.type)}
								</span>
							</td>
							<td class="type-cell">
								<span class="type-badge {transaction.type}">
									{transaction.type === 'income' ? '💰' : '💸'} {transaction.type}
								</span>
							</td>
							<td class="category-cell">
								{getCategoryDisplay(transaction.categoryId)}
							</td>
							<td class="owner-cell">
								{transaction.owner}
							</td>
							<td class="date-cell">
								{formatDate(transaction.transactionDate)}
							</td>
							<td class="date-cell">
								{formatDate(transaction.registrationDate)}
							</td>
							<td class="actions-cell">
								<button 
									class="action-btn edit-btn"
									on:click={() => handleEdit(transaction)}
									title="Edit transaction"
								>
									✏️
								</button>
								<button 
									class="action-btn delete-btn"
									on:click={() => handleDelete(transaction)}
									title="Delete transaction"
								>
									🗑️
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination Controls -->
		{#if totalPages > 1}
			<div class="pagination">
				<div class="pagination-info">
					Page {currentPage} of {totalPages}
				</div>
				<div class="pagination-controls">
					<button 
						class="pagination-btn" 
						disabled={currentPage === 1}
						on:click={() => goToPage(1)}
					>
						First
					</button>
					<button 
						class="pagination-btn" 
						disabled={currentPage === 1}
						on:click={() => goToPage(currentPage - 1)}
					>
						Previous
					</button>

					<!-- Page numbers -->
					{#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
						const startPage = Math.max(1, currentPage - 2);
						const endPage = Math.min(totalPages, startPage + 4);
						return startPage + i;
					}).filter(page => page <= totalPages) as page}
						<button 
							class="pagination-btn {currentPage === page ? 'active' : ''}"
							on:click={() => goToPage(page)}
						>
							{page}
						</button>
					{/each}

					<button 
						class="pagination-btn" 
						disabled={currentPage === totalPages}
						on:click={() => goToPage(currentPage + 1)}
					>
						Next
					</button>
					<button 
						class="pagination-btn" 
						disabled={currentPage === totalPages}
						on:click={() => goToPage(totalPages)}
					>
						Last
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.transaction-table-container {
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.table-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 24px;
		border-bottom: 1px solid #e1e5e9;
		background: #f8f9fa;
	}

	.table-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #2c3e50;
	}

	.table-info {
		display: flex;
		align-items: center;
		gap: 15px;
		font-size: 0.9rem;
		color: #6c757d;
	}

	.items-per-page {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.items-per-page select {
		padding: 4px 8px;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	/* Filters Section */
	.filters-section {
		padding: 16px 24px;
		background: #f8f9fa;
		border-bottom: 1px solid #e1e5e9;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
		align-items: end;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.filter-group label {
		font-size: 0.85rem;
		font-weight: 500;
		color: #555;
	}

	.filter-group input,
	.filter-group select {
		padding: 8px 12px;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.9rem;
		transition: border-color 0.2s ease;
	}

	.filter-group input:focus,
	.filter-group select:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	.filter-actions {
		display: flex;
		align-items: end;
	}

	.clear-filters-btn {
		padding: 8px 16px;
		background: #6c757d;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.clear-filters-btn:hover {
		background: #5a6268;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		color: #666;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 15px;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.empty-state {
		text-align: center;
		padding: 60px 20px;
		color: #666;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 15px;
	}

	.empty-state h4 {
		margin: 0 0 10px 0;
		color: #333;
	}

	.table-wrapper {
		overflow-x: auto;
	}

	.transaction-table {
		width: 100%;
		border-collapse: collapse;
	}

	.transaction-table th,
	.transaction-table td {
		padding: 12px 15px;
		text-align: left;
		border-bottom: 1px solid #e1e5e9;
		vertical-align: middle;
	}

	.transaction-table th {
		background: #f8f9fa;
		font-weight: 600;
		color: #555;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 0;
	}

	.sort-btn {
		width: 100%;
		padding: 12px 15px;
		background: none;
		border: none;
		text-align: left;
		font-size: 0.9rem;
		font-weight: 600;
		color: #555;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		cursor: pointer;
		transition: background-color 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.sort-btn:hover {
		background: #e9ecef;
	}

	.sort-indicator {
		margin-left: 8px;
		font-size: 0.8rem;
		color: #007bff;
	}

	.transaction-table tbody tr:hover {
		background: #f8f9fa;
	}

	.description-cell {
		min-width: 200px;
		max-width: 250px;
	}

	.description {
		font-weight: 500;
		color: #333;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.amount-cell {
		min-width: 120px;
	}

	.amount {
		font-weight: 600;
		font-size: 1rem;
	}

	.amount.income {
		color: #28a745;
	}

	.amount.expense {
		color: #dc3545;
	}

	.type-badge {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: capitalize;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: inline-block;
		max-width: 100%;
	}

	.type-badge.income {
		background: #d4edda;
		color: #155724;
	}

	.type-badge.expense {
		background: #f8d7da;
		color: #721c24;
	}

	.category-cell,
	.owner-cell {
		min-width: 120px;
		max-width: 150px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.date-cell {
		min-width: 120px;
		color: #666;
		font-size: 0.9rem;
	}

	.actions-cell {
		min-width: 100px;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.action-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 6px;
		margin: 0 2px;
		border-radius: 4px;
		font-size: 1rem;
		transition: background-color 0.2s ease;
	}

	.action-btn:hover {
		background: #e9ecef;
	}

	.edit-btn:hover {
		background: #fff3cd;
	}

	.delete-btn:hover {
		background: #f8d7da;
	}

	/* Pagination Styles */
	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 24px;
		background: #f8f9fa;
		border-top: 1px solid #e1e5e9;
	}

	.pagination-info {
		font-size: 0.9rem;
		color: #6c757d;
	}

	.pagination-controls {
		display: flex;
		gap: 4px;
	}

	.pagination-btn {
		padding: 8px 12px;
		border: 1px solid #ddd;
		background: white;
		color: #495057;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s ease;
	}

	.pagination-btn:hover:not(:disabled) {
		background: #e9ecef;
		border-color: #adb5bd;
	}

	.pagination-btn.active {
		background: #007bff;
		color: white;
		border-color: #007bff;
	}

	.pagination-btn:disabled {
		background: #f8f9fa;
		color: #6c757d;
		border-color: #e9ecef;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.table-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 10px;
		}

		.transaction-table {
			font-size: 0.9rem;
		}

		.transaction-table th,
		.transaction-table td {
			padding: 10px 8px;
		}

		.description-cell,
		.category-cell,
		.owner-cell {
			min-width: 120px;
		}

		.date-cell {
			min-width: 100px;
		}
	}
</style>
