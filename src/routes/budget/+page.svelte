<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { BudgetService, type BudgetItem } from '$lib/services/budgetService';
	import { CategoryService, type Category } from '$lib/services/categoryService';
	import { browser } from '$app/environment';
	import { APP_VERSION } from '$lib/version';
	import { BudgetSummaryCards, BudgetFilters, BudgetForm, BudgetTable, CategoryManagement, ExcelImport } from '$lib/components/budget';

	// Budget state
	let budgetItems: BudgetItem[] = [];
	let categories: Category[] = [];
	let loading = false;
	let error = '';



	// Categories visibility state
	let showCategories = false;

	// Table state - pagination, sorting, filtering
	let currentPage = 1;
	let itemsPerPage = 10;
	let sortField: keyof BudgetItem = 'createdAt';
	let sortDirection: 'asc' | 'desc' = 'desc';
	let isLoadingState = false; // Flag to prevent saving during initial load
	let filters = {
		search: '',
		type: '',
		owner: '',
		paymentMethod: '',
		category: '',
		recurrent: ''
	};

	// localStorage keys
	const STORAGE_KEYS = {
		currentPage: 'budget-table-current-page',
		itemsPerPage: 'budget-table-items-per-page',
		sortField: 'budget-table-sort-field',
		sortDirection: 'budget-table-sort-direction',
		filters: 'budget-table-filters'
	};

	// Load state from localStorage
	function loadTableState() {
		if (!browser) return;
		
		isLoadingState = true;
		try {
			const savedCurrentPage = localStorage.getItem(STORAGE_KEYS.currentPage);
			if (savedCurrentPage) currentPage = parseInt(savedCurrentPage, 10) || 1;

			const savedItemsPerPage = localStorage.getItem(STORAGE_KEYS.itemsPerPage);
			if (savedItemsPerPage) itemsPerPage = parseInt(savedItemsPerPage, 10) || 10;

			const savedSortField = localStorage.getItem(STORAGE_KEYS.sortField);
			const validSortFields = ['name', 'type', 'amount', 'dueDate', 'owner', 'paymentMethod', 'createdAt'];
			if (savedSortField && validSortFields.includes(savedSortField)) {
				sortField = savedSortField as keyof BudgetItem;
			}

			const savedSortDirection = localStorage.getItem(STORAGE_KEYS.sortDirection);
			if (savedSortDirection && (savedSortDirection === 'asc' || savedSortDirection === 'desc')) {
				sortDirection = savedSortDirection as 'asc' | 'desc';
			}

			const savedFilters = localStorage.getItem(STORAGE_KEYS.filters);
			if (savedFilters) {
				const parsedFilters = JSON.parse(savedFilters);
				filters = { ...filters, ...parsedFilters };
			}
		} catch (error) {
			console.warn('Failed to load table state from localStorage:', error);
		} finally {
			// Add a small delay to ensure reactive statements don't fire immediately
			setTimeout(() => {
				isLoadingState = false;
			}, 10);
		}
	}



	// Load budget items and categories on mount
	onMount(async () => {
		if (browser && $authStore.user) {
			await Promise.all([
				loadBudgetItems(),
				loadCategories()
			]);
			// Load saved table state after data is loaded
			loadTableState();
		}
	});

	// Reactive statements to save individual state changes to localStorage
	$: if (browser && !isLoadingState && currentPage) {
		localStorage.setItem(STORAGE_KEYS.currentPage, currentPage.toString());
	}
	$: if (browser && !isLoadingState && itemsPerPage) {
		localStorage.setItem(STORAGE_KEYS.itemsPerPage, itemsPerPage.toString());
	}
	$: if (browser && !isLoadingState && sortField) {
		localStorage.setItem(STORAGE_KEYS.sortField, sortField);
	}
	$: if (browser && !isLoadingState && sortDirection) {
		localStorage.setItem(STORAGE_KEYS.sortDirection, sortDirection);
	}
	$: if (browser && filters) {
		try {
			localStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(filters));
		} catch (error) {
			console.warn('Failed to save filters to localStorage:', error);
		}
	}



	// Form state
	let showAddForm = false;
	let editingItem: BudgetItem | null = null;

	// Load categories from Firestore
	async function loadCategories() {
		if (!$authStore.user) return;
		
		try {
			categories = await CategoryService.getCategories($authStore.user.id);

			// Initialize default categories if none exist
			if (categories.length === 0) {
				await CategoryService.initializeDefaultCategories($authStore.user.id);
				categories = await CategoryService.getCategories($authStore.user.id);
			}
		} catch (err) {
			console.error('Error loading categories:', err);
			error = 'Failed to load categories';
		}
	}

	// Helper function to get category display info
	function getCategoryDisplay(categoryId: string | null) {
		if (!categoryId) {
			return { name: 'Uncategorized', icon: '📁', color: '#999' };
		}
		const category = categories.find(c => c.id === categoryId);
		return category || { name: 'Unknown Category', icon: '❓', color: '#999' };
	}

	// Load budget items from Firestore
	async function loadBudgetItems() {
		if (!$authStore.user) return;
		
		try {
			loading = true;
			error = '';
			budgetItems = await BudgetService.getBudgetItems($authStore.user.id);
		} catch (err) {
			console.error('Error loading budget items:', err);
			error = 'Failed to load budget items';
		} finally {
			loading = false;
		}
	}







	async function handleSubmit(event: CustomEvent<{ formData: Partial<BudgetItem> }>) {
		if (!$authStore.user) return;
		
		const submittedFormData = event.detail.formData;

		try {
			loading = true;
			error = '';

			if (editingItem) {
				// Update existing item - filter out undefined values

				const updateData: any = {
					name: submittedFormData.name,
					type: submittedFormData.type,
					amount: submittedFormData.amount,
					isRecurrent: submittedFormData.isRecurrent,
					owner: submittedFormData.owner,
					paymentMethod: submittedFormData.paymentMethod,
					category: submittedFormData.category || null
				};

				// Add due date fields only if they have values
				if (submittedFormData.isRecurrent && submittedFormData.dueDay) {
					updateData.dueDay = submittedFormData.dueDay;
					// Remove dueDate field when switching to recurrent
					updateData.dueDate = null;
				}
				if (!submittedFormData.isRecurrent && submittedFormData.dueDate) {
					updateData.dueDate = submittedFormData.dueDate;
					// Remove dueDay field when switching to one-time
					updateData.dueDay = null;
				}

				await BudgetService.updateBudgetItem(editingItem.id, updateData);
			} else {
				// Add new item - filter out undefined values
				const newItemData: any = {
					name: submittedFormData.name,
					type: submittedFormData.type,
					amount: submittedFormData.amount,
					isRecurrent: submittedFormData.isRecurrent,
					owner: submittedFormData.owner,
					paymentMethod: submittedFormData.paymentMethod,
					category: submittedFormData.category || null,
					createdAt: new Date().toISOString()
				};

				// Add due date fields only if they have values
				if (submittedFormData.isRecurrent && submittedFormData.dueDay) {
					newItemData.dueDay = submittedFormData.dueDay;
				}
				if (!submittedFormData.isRecurrent && submittedFormData.dueDate) {
					newItemData.dueDate = submittedFormData.dueDate;
				}
				
				await BudgetService.addBudgetItem(newItemData, $authStore.user.id);
			}

			// Reload budget items
			await loadBudgetItems();
			resetForm();
		} catch (err) {
			console.error('Error saving budget item:', err);
			error = 'Failed to save budget item';
		} finally {
			loading = false;
		}
	}

	function resetForm() {
		editingItem = null;
		showAddForm = false;
	}

	async function deleteBudgetItem(id: string) {
		if (!confirm('Are you sure you want to delete this budget item?')) return;
		
		try {
			loading = true;
			error = '';
			await BudgetService.deleteBudgetItem(id);
			await loadBudgetItems();
		} catch (err) {
			console.error('Error deleting budget item:', err);
			error = 'Failed to delete budget item';
		} finally {
			loading = false;
		}
	}

	function editBudgetItem(item: BudgetItem) {
		editingItem = item;
		showAddForm = true;
		
		// Smooth scroll to the form section after a brief delay to ensure the form is rendered
		setTimeout(() => {
			const formElement = document.getElementById('budget-form-section');
			if (formElement) {
				formElement.scrollIntoView({ 
					behavior: 'smooth', 
					block: 'start' 
				});
				// Focus on the first input field for better UX
				const firstInput = formElement.querySelector('input[type="text"]') as HTMLInputElement;
				if (firstInput) {
					firstInput.focus();
				}
			}
		}, 100);
	}

	// Table event handlers
	function handleTableSort(event: CustomEvent<{ field: string; direction: 'asc' | 'desc' }>) {
		// Sort state is already bound to the component, so we just need to save to localStorage
		if (browser) {
			try {
				localStorage.setItem(STORAGE_KEYS.sortField, event.detail.field);
				localStorage.setItem(STORAGE_KEYS.sortDirection, event.detail.direction);
			} catch (e) {
				console.warn('Failed to save sort state to localStorage:', e);
			}
		}
	}

	function handlePageChange(event: CustomEvent<{ page: number }>) {
		// Page state is already bound to the component, so we just need to save to localStorage
		if (browser) {
			try {
				localStorage.setItem(STORAGE_KEYS.currentPage, event.detail.page.toString());
			} catch (e) {
				console.warn('Failed to save page state to localStorage:', e);
			}
		}
	}

	function handleItemsPerPageChange(event: CustomEvent<{ itemsPerPage: number }>) {
		// Items per page state is already bound to the component, so we just need to save to localStorage
		if (browser) {
			try {
				localStorage.setItem(STORAGE_KEYS.itemsPerPage, event.detail.itemsPerPage.toString());
			} catch (e) {
				console.warn('Failed to save items per page state to localStorage:', e);
			}
		}
	}



	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Note: Filtering, sorting, and pagination are now handled by the BudgetTable component

	async function handleLogout() {
		try {
			await authStore.logout();
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}
</script>

<svelte:head>
	<title>Budget - My Money App</title>
</svelte:head>

<div class="budget-container">
	<header class="budget-header">
		<div class="header-top">
			<h1>Budget Management</h1>
			<span class="version-badge">v{APP_VERSION}</span>
		</div>
		<div class="user-info">
			{#if $authStore.user}
				<span>Welcome, {$authStore.user.email}!</span>
				<button on:click={handleLogout} class="logout-btn">Logout</button>
			{/if}
		</div>
	</header>

	<!-- Error Display -->
	{#if error}
		<div class="error-message">
			{error}
			<button on:click={() => error = ''} class="error-close">×</button>
		</div>
	{/if}

	<!-- Loading State -->
	{#if loading}
		<div class="loading-overlay">
			<div class="loading-spinner">Loading...</div>
		</div>
	{/if}

	<main class="budget-content">
		<!-- Summary Cards -->
		<BudgetSummaryCards {budgetItems} />

		<!-- Action Bar -->
		<div class="action-bar">
			<div class="action-buttons">
				<button 
					on:click={() => showAddForm = !showAddForm} 
					class="add-btn"
				>
					{showAddForm ? '❌ Cancel' : '➕ Add Budget Item'}
				</button>
				
				<ExcelImport 
					{categories}
					on:importComplete={(e: CustomEvent<{ success: boolean; message: string }>) => {
						error = e.detail.message;
					}}
					on:budgetItemsUpdated={loadBudgetItems}
				/>
				
				<button 
					on:click={() => showCategories = !showCategories} 
					class="categories-toggle-btn"
					title="Toggle categories section"
				>
					{showCategories ? '📁 Hide Categories' : '📁 Show Categories'}
				</button>
			</div>
			<a href="/dashboard" class="nav-link">← Back to Dashboard</a>
		</div>





		<!-- Add Form -->
		<BudgetForm 
			{categories}
			{editingItem}
			isVisible={showAddForm}
			on:submit={handleSubmit}
			on:cancel={resetForm}
		/>

		<!-- Category Management Section -->
		<CategoryManagement 
			{categories}
			isVisible={showCategories}
			on:categoriesUpdated={loadCategories}
			on:error={(e) => {
				error = e.detail.message;
			}}
		/>

		<!-- Filters -->
		<BudgetFilters 
			{budgetItems} 
			{categories} 
			bind:filters
			on:filterChange={() => {/* filters are already bound */}}
			on:clearFilters={() => {/* filters are already bound */}}
		/>

		<!-- Budget Items Table -->
		<BudgetTable 
			{budgetItems}
			{categories}
			{filters}
			bind:currentPage
			bind:itemsPerPage
			bind:sortField
			bind:sortDirection
			on:edit={(e) => editBudgetItem(e.detail.item)}
			on:delete={(e) => deleteBudgetItem(e.detail.id)}
			on:sort={handleTableSort}
			on:pageChange={handlePageChange}
			on:itemsPerPageChange={handleItemsPerPageChange}
		/>
	</main>
</div>

<style>
	.budget-container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding: 2rem;
	}

	.budget-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: white;
		padding: 1.5rem 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.header-top {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.budget-header h1 {
		margin: 0;
		color: #333;
	}

	.version-badge {
		background-color: #f8f9fa;
		color: #6c757d;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
		border: 1px solid #dee2e6;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-info span {
		color: #666;
		font-size: 0.9rem;
	}

	.logout-btn {
		background-color: #dc3545;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.logout-btn:hover {
		background-color: #c82333;
	}

	.budget-content {
		max-width: 1200px;
		margin: 0 auto;
	}



	.action-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 1rem 0;
		border-bottom: 1px solid #e9ecef;
	}

	.action-buttons {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.add-btn {
		background-color: #28a745;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
	}

	.add-btn:hover {
		background-color: #218838;
	}

	.categories-toggle-btn {
		background-color: #6f42c1;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.categories-toggle-btn:hover {
		background-color: #5a2d91;
	}

	.nav-link {
		color: #007bff;
		text-decoration: none;
		font-weight: 500;
	}

	.nav-link:hover {
		text-decoration: underline;
	}



	/* Error and Loading States */
	.error-message {
		background-color: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
		border-radius: 4px;
		padding: 0.75rem 1rem;
		margin: 1rem 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.error-close {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		color: #721c24;
		padding: 0;
		margin-left: 1rem;
	}

	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.loading-spinner {
		background-color: white;
		padding: 2rem;
		border-radius: 8px;
		font-size: 1.1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}





	@media (max-width: 768px) {
		.budget-container {
			padding: 1rem;
		}

		.budget-header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.action-bar {
			flex-direction: column;
			gap: 1rem;
		}

		.action-buttons {
			flex-direction: column;
			gap: 0.5rem;
		}


	}

</style>
