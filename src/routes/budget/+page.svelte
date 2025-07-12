<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { BudgetService, type BudgetItem } from '$lib/services/budgetService';
	import { browser } from '$app/environment';
	import { APP_VERSION } from '$lib/version';
	import * as XLSX from 'xlsx';



	// Budget state
	let budgetItems: BudgetItem[] = [];
	let loading = false;
	let error = '';

	// Excel import state
	let showImportInfo = false;
	let importProgress = 0;
	let importTotal = 0;
	let isImporting = false;

	// Table state - pagination, sorting, filtering
	let currentPage = 1;
	let itemsPerPage = 10;
	let sortField: keyof BudgetItem = 'createdAt';
	let sortDirection: 'asc' | 'desc' = 'desc';
	let filters = {
		type: '',
		owner: '',
		paymentMethod: '',
		isRecurrent: '',
		search: ''
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
		
		try {
			const savedCurrentPage = localStorage.getItem(STORAGE_KEYS.currentPage);
			if (savedCurrentPage) currentPage = parseInt(savedCurrentPage, 10) || 1;

			const savedItemsPerPage = localStorage.getItem(STORAGE_KEYS.itemsPerPage);
			if (savedItemsPerPage) itemsPerPage = parseInt(savedItemsPerPage, 10) || 10;

			const savedSortField = localStorage.getItem(STORAGE_KEYS.sortField);
			if (savedSortField) sortField = savedSortField as keyof BudgetItem;

			const savedSortDirection = localStorage.getItem(STORAGE_KEYS.sortDirection);
			if (savedSortDirection) sortDirection = savedSortDirection as 'asc' | 'desc';

			const savedFilters = localStorage.getItem(STORAGE_KEYS.filters);
			if (savedFilters) {
				const parsedFilters = JSON.parse(savedFilters);
				filters = { ...filters, ...parsedFilters };
			}
		} catch (error) {
			console.warn('Failed to load table state from localStorage:', error);
		}
	}



	// Load budget items on mount
	onMount(async () => {
		if (browser && $authStore.user) {
			// Load saved table state first
			loadTableState();
			await loadBudgetItems();
		}
	});

	// Reactive statements to save individual state changes to localStorage
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
		try {
			localStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(filters));
		} catch (error) {
			console.warn('Failed to save filters to localStorage:', error);
		}
	}

	// Form state
	let showAddForm = false;
	let editingItem: BudgetItem | null = null;
	let formData = {
		name: '',
		type: 'expense' as 'income' | 'expense' | 'savings',
		amount: 0,
		isRecurrent: true,
		dueDay: 1,
		dueDate: '',
		owner: '',
		paymentMethod: 'cash' as 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'other'
	};
	let errors = {
		name: false,
		amount: false,
		dueDay: false,
		dueDate: false,
		owner: false
	};

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

	// Validation
	function validateForm(): boolean {
		errors = {
			name: false,
			amount: false,
			dueDay: false,
			dueDate: false,
			owner: false
		};

		if (!formData.name.trim()) {
			errors.name = true;
		}

		if (formData.amount <= 0) {
			errors.amount = true;
		}

		if (formData.isRecurrent) {
			if (formData.dueDay < 1 || formData.dueDay > 31) {
				errors.dueDay = true;
			}
		} else {
			if (!formData.dueDate) {
				errors.dueDate = true;
			}
		}

		if (!formData.owner.trim()) {
			errors.owner = true;
		}

		return !Object.values(errors).some(error => error);
	}

	async function handleSubmit() {
		if (!validateForm() || !$authStore.user) return;

		try {
			loading = true;
			error = '';

			if (editingItem) {
				// Update existing item - filter out undefined values
				const updateData: any = {
					name: formData.name,
					type: formData.type,
					amount: formData.amount,
					isRecurrent: formData.isRecurrent,
					owner: formData.owner,
					paymentMethod: formData.paymentMethod
				};

				// Add due date fields only if they have values
				if (formData.isRecurrent && formData.dueDay) {
					updateData.dueDay = formData.dueDay;
					// Remove dueDate field when switching to recurrent
					updateData.dueDate = null;
				}
				if (!formData.isRecurrent && formData.dueDate) {
					updateData.dueDate = formData.dueDate;
					// Remove dueDay field when switching to one-time
					updateData.dueDay = null;
				}

				await BudgetService.updateBudgetItem(editingItem.id, updateData);
			} else {
				// Add new item - filter out undefined values
				const newItemData: any = {
					name: formData.name,
					type: formData.type,
					amount: formData.amount,
					isRecurrent: formData.isRecurrent,
					owner: formData.owner,
					paymentMethod: formData.paymentMethod,
					createdAt: new Date().toISOString()
				};

				// Add due date fields only if they have values
				if (formData.isRecurrent && formData.dueDay) {
					newItemData.dueDay = formData.dueDay;
				}
				if (!formData.isRecurrent && formData.dueDate) {
					newItemData.dueDate = formData.dueDate;
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
		formData = {
			name: '',
			type: 'expense',
			amount: 0,
			isRecurrent: true,
			dueDay: 1,
			dueDate: '',
			owner: '',
			paymentMethod: 'cash'
		};
	
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
		formData = {
			name: item.name,
			type: item.type,
			amount: item.amount,
			isRecurrent: item.isRecurrent,
			dueDay: item.dueDay || 1,
			dueDate: item.dueDate || '',
			owner: item.owner,
			paymentMethod: item.paymentMethod
		};
		showAddForm = true;
	}



	// Excel import function
	async function handleExcelImport(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file || !$authStore.user) {
			return;
		}

		try {
			isImporting = true;
			error = '';
			importProgress = 0;
			importTotal = 0;

			// Read the Excel file
			const data = await file.arrayBuffer();
			const workbook = XLSX.read(data, { type: 'array' });
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];
			const jsonData = XLSX.utils.sheet_to_json(worksheet);

			if (jsonData.length === 0) {
				error = 'Excel file is empty or has no data';
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
				await loadBudgetItems();
			}

			if (errorCount > 0) {
				error = `Import completed with ${successCount} successful and ${errorCount} failed items. Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`;
			} else {
				error = `Successfully imported ${successCount} budget items!`;
			}

		} catch (err) {
			console.error('Excel import error:', err);
			error = 'Failed to import Excel file. Please check the file format.';
		} finally {
			isImporting = false;
			importProgress = 0;
			importTotal = 0;
			// Reset file input
			input.value = '';
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

	// Calculate totals
	$: totalIncome = budgetItems
		.filter(item => item.type === 'income')
		.reduce((sum, item) => sum + item.amount, 0);
	
	$: totalExpenses = budgetItems
		.filter(item => item.type === 'expense')
		.reduce((sum, item) => sum + item.amount, 0);
	
	$: totalSavings = budgetItems
		.filter(item => item.type === 'savings')
		.reduce((sum, item) => sum + item.amount, 0);
	
	$: netAmount = totalIncome - totalExpenses - totalSavings;

	// Filtered and sorted items
	$: filteredItems = budgetItems.filter(item => {
		// Search filter
		if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase())) {
			return false;
		}
		// Type filter
		if (filters.type && item.type !== filters.type) {
			return false;
		}
		// Owner filter
		if (filters.owner && !item.owner.toLowerCase().includes(filters.owner.toLowerCase())) {
			return false;
		}
		// Payment method filter
		if (filters.paymentMethod && item.paymentMethod !== filters.paymentMethod) {
			return false;
		}
		// Recurrent filter
		if (filters.isRecurrent !== '') {
			const isRecurrentFilter = filters.isRecurrent === 'true';
			if (item.isRecurrent !== isRecurrentFilter) {
				return false;
			}
		}
		return true;
	}).sort((a, b) => {
		const aValue = a[sortField];
		const bValue = b[sortField];
		
		// Handle undefined values
		if (aValue == null && bValue == null) return 0;
		if (aValue == null) return 1;
		if (bValue == null) return -1;
		
		let comparison = 0;
		if (aValue < bValue) comparison = -1;
		else if (aValue > bValue) comparison = 1;
		
		return sortDirection === 'asc' ? comparison : -comparison;
	});

	// Pagination
	$: totalPages = Math.ceil(filteredItems.length / itemsPerPage);
	$: paginatedItems = filteredItems.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Reset to first page when filters change (but not on initial load)
	let filtersInitialized = false;
	$: {
		if (filtersInitialized && filters) {
			currentPage = 1;
		}
		filtersInitialized = true;
	}

	// Get unique values for filter dropdowns
	$: uniqueOwners = [...new Set(budgetItems.map(item => item.owner))].sort();
	$: uniquePaymentMethods = [...new Set(budgetItems.map(item => item.paymentMethod))].sort();

	// Sorting functions
	function handleSort(field: keyof BudgetItem) {
		if (sortField === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'asc';
		}
	}

	// Pagination functions
	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	// Clear all filters
	function clearFilters() {
		filters = {
			type: '',
			owner: '',
			paymentMethod: '',
			isRecurrent: '',
			search: ''
		};
	}

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
		<div class="summary-grid">
			<div class="summary-card income">
				<h3>💰 Total Income</h3>
				<p class="amount">{formatCurrency(totalIncome)}</p>
			</div>
			<div class="summary-card expense">
				<h3>💸 Total Expenses</h3>
				<p class="amount">{formatCurrency(totalExpenses)}</p>
			</div>
			<div class="summary-card savings">
				<h3>🏦 Total Savings</h3>
				<p class="amount">{formatCurrency(totalSavings)}</p>
			</div>
			<div class="summary-card net {netAmount >= 0 ? 'positive' : 'negative'}">
				<h3>📊 Net Amount</h3>
				<p class="amount">{formatCurrency(netAmount)}</p>
			</div>
		</div>

		<!-- Action Bar -->
		<div class="action-bar">
			<div class="action-buttons">
				<button 
					on:click={() => showAddForm = !showAddForm} 
					class="add-btn"
				>
					{showAddForm ? '❌ Cancel' : '➕ Add Budget Item'}
				</button>
				
				<div class="import-section">
					<label for="excel-import" class="import-btn" class:disabled={isImporting}>
						{#if isImporting}
							⏳ Importing... ({importProgress}/{importTotal})
						{:else}
							📊 Import Excel
						{/if}
					</label>
					<input 
						id="excel-import" 
						type="file" 
						accept=".xlsx,.xls" 
						on:change={handleExcelImport}
						disabled={isImporting}
						style="display: none;"
					/>
					<button 
						on:click={() => showImportInfo = !showImportInfo} 
						class="info-btn"
						title="Show Excel format requirements"
					>
						ℹ️
					</button>
				</div>
			</div>
			<a href="/dashboard" class="nav-link">← Back to Dashboard</a>
		</div>

		<!-- Excel Import Info Modal -->
		{#if showImportInfo}
			<div 
				class="modal-overlay" 
				role="dialog" 
				aria-modal="true" 
				aria-labelledby="modal-title"
				tabindex="-1"
				on:click={() => showImportInfo = false}
				on:keydown={(e) => e.key === 'Escape' && (showImportInfo = false)}
			>
				<div 
					class="modal-content" 
					role="document"
					on:click|stopPropagation
					on:keydown|stopPropagation
				>
					<div class="modal-header">
						<h3>📊 Excel Import Format</h3>
						<button on:click={() => showImportInfo = false} class="modal-close">×</button>
					</div>
					<div class="modal-body">
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
								</div>
								<div class="example-row">
									<span>Salary</span>
									<span>income</span>
									<span>5000</span>
									<span>John</span>
									<span>bank_transfer</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Add Form -->
		{#if showAddForm}
			<div class="add-form-container">
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

					<div class="form-actions">
						<button type="submit" class="submit-btn">{editingItem ? 'Update Budget Item' : 'Add Budget Item'}</button>
						<button type="button" on:click={resetForm} class="cancel-btn">Cancel</button>
					</div>
				</form>
			</div>
		{/if}

		<!-- Budget Items Table -->
		<div class="budget-table-container">
			<div class="table-header">
				<h2>Budget Items ({filteredItems.length} of {budgetItems.length})</h2>
				<div class="table-controls">
					<div class="items-per-page">
						<label for="itemsPerPage">Items per page:</label>
						<select id="itemsPerPage" bind:value={itemsPerPage}>
							<option value={5}>5</option>
							<option value={10}>10</option>
							<option value={25}>25</option>
							<option value={50}>50</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Filters -->
			<div class="filters-container">
				<div class="filters-row">
					<div class="filter-group">
						<label for="searchFilter">Search:</label>
						<input
							id="searchFilter"
							type="text"
							bind:value={filters.search}
							placeholder="Search by name..."
							class="filter-input"
						/>
					</div>

					<div class="filter-group">
						<label for="typeFilter">Type:</label>
						<select id="typeFilter" bind:value={filters.type} class="filter-select">
							<option value="">All Types</option>
							<option value="income">💰 Income</option>
							<option value="expense">💸 Expense</option>
							<option value="savings">🏦 Savings</option>
						</select>
					</div>

					<div class="filter-group">
						<label for="ownerFilter">Owner:</label>
						<select id="ownerFilter" bind:value={filters.owner} class="filter-select">
							<option value="">All Owners</option>
							{#each uniqueOwners as owner}
								<option value={owner}>{owner}</option>
							{/each}
						</select>
					</div>

					<div class="filter-group">
						<label for="paymentFilter">Payment:</label>
						<select id="paymentFilter" bind:value={filters.paymentMethod} class="filter-select">
							<option value="">All Methods</option>
							{#each uniquePaymentMethods as method}
								<option value={method}>{method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
							{/each}
						</select>
					</div>

					<div class="filter-group">
						<label for="recurrentFilter">Recurrent:</label>
						<select id="recurrentFilter" bind:value={filters.isRecurrent} class="filter-select">
							<option value="">All Items</option>
							<option value="true">Recurrent Only</option>
							<option value="false">One-time Only</option>
						</select>
					</div>

					<button on:click={clearFilters} class="clear-filters-btn" title="Clear all filters">
						🗑️ Clear
					</button>
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
									<td class="actions-cell">
										<div class="action-buttons">
											<button 
												on:click={() => editBudgetItem(item)} 
												class="edit-btn"
												title="Edit item"
											>
												✏️
											</button>
											<button 
												on:click={() => deleteBudgetItem(item.id)} 
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

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.summary-card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.summary-card h3 {
		margin: 0 0 1rem 0;
		color: #333;
		font-size: 1rem;
	}

	.summary-card .amount {
		font-size: 1.5rem;
		font-weight: bold;
		margin: 0;
	}

	.summary-card.income .amount { color: #28a745; }
	.summary-card.expense .amount { color: #dc3545; }
	.summary-card.savings .amount { color: #007bff; }
	.summary-card.net.positive .amount { color: #28a745; }
	.summary-card.net.negative .amount { color: #dc3545; }

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

	.import-section {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.import-btn {
		background-color: #17a2b8;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: background-color 0.2s;
		display: inline-block;
		text-decoration: none;
	}

	.import-btn:hover:not(.disabled) {
		background-color: #138496;
	}

	.import-btn.disabled {
		background-color: #6c757d;
		cursor: not-allowed;
		opacity: 0.7;
	}

	.info-btn {
		background-color: #6c757d;
		color: white;
		border: none;
		padding: 0.5rem;
		border-radius: 50%;
		cursor: pointer;
		font-size: 1rem;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
	}

	.info-btn:hover {
		background-color: #5a6268;
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

	.nav-link {
		color: #007bff;
		text-decoration: none;
		font-weight: 500;
	}

	.nav-link:hover {
		text-decoration: underline;
	}

	.add-form-container {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.add-form-container h2 {
		margin-top: 0;
		color: #333;
	}

	.budget-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group label {
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #333;
	}

	.form-group input,
	.form-group select {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	.form-group input.error {
		border-color: #dc3545;
	}

	.error-text {
		color: #dc3545;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.submit-btn {
		background-color: #007bff;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
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
	}

	.cancel-btn:hover {
		background-color: #545b62;
	}

	.budget-table-container {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.budget-table-container h2 {
		margin-top: 0;
		color: #333;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #666;
	}

	.table-wrapper {
		overflow-x: auto;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
	}

	.budget-table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		font-size: 0.9rem;
	}

	.budget-table thead {
		background-color: #f8f9fa;
		border-bottom: 2px solid #dee2e6;
	}

	.budget-table th {
		padding: 12px 16px;
		text-align: left;
		font-weight: 600;
		color: #495057;
		border-right: 1px solid #dee2e6;
		white-space: nowrap;
	}

	.budget-table th:last-child {
		border-right: none;
	}

	.budget-table td {
		padding: 12px 16px;
		border-bottom: 1px solid #dee2e6;
		border-right: 1px solid #dee2e6;
		vertical-align: middle;
	}

	.budget-table td:last-child {
		border-right: none;
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
		border-left: 4px solid #007bff;
	}

	.name-cell {
		font-weight: 500;
		color: #333;
		min-width: 150px;
	}

	.amount-cell {
		font-weight: 600;
		text-align: right;
		color: #333;
		min-width: 100px;
	}

	.date-cell {
		white-space: nowrap;
		min-width: 100px;
	}

	.owner-cell {
		min-width: 120px;
	}

	.payment-cell {
		min-width: 120px;
	}

	.actions-cell {
		text-align: center;
		width: 100px;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		align-items: center;
	}

	.edit-btn,
	.delete-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.1rem;
		padding: 4px 8px;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	.edit-btn:hover {
		background-color: #e3f2fd;
	}

	.delete-btn:hover {
		background-color: #f8d7da;
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

	.type-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.type-badge.income {
		background-color: #d4edda;
		color: #155724;
	}

	.type-badge.expense {
		background-color: #f8d7da;
		color: #721c24;
	}

	.type-badge.savings {
		background-color: #d1ecf1;
		color: #0c5460;
	}

	fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}

	fieldset legend {
		font-weight: 500;
		color: #333;
		margin-bottom: 0.5rem;
		padding: 0;
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
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.radio-option:hover {
		background-color: #f8f9fa;
		border-color: #007bff;
	}

	.radio-option input[type="radio"] {
		margin: 0;
	}

	.recurrent-badge {
		background-color: #e3f2fd;
		color: #1565c0;
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
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

		.form-row {
			grid-template-columns: 1fr;
		}

		.action-bar {
			flex-direction: column;
			gap: 1rem;
		}

		.form-actions {
			flex-direction: column;
		}

		.budget-grid {
			grid-template-columns: 1fr;
		}

		.action-buttons {
			flex-direction: column;
			gap: 0.5rem;
		}

		.import-section {
			justify-content: center;
		}
	}

	/* Modal Styles */
	.modal-overlay {
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
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 8px;
		max-width: 600px;
		width: 100%;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e9ecef;
	}

	.modal-header h3 {
		margin: 0;
		color: #333;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #6c757d;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	.modal-close:hover {
		background-color: #f8f9fa;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.format-table {
		display: grid;
		grid-template-columns: 1fr 1fr 2fr;
		gap: 0.5rem;
		margin: 1rem 0;
		border: 1px solid #e9ecef;
		border-radius: 6px;
		overflow: hidden;
	}

	.format-header {
		display: contents;
	}

	.format-header > span {
		background-color: #f8f9fa;
		padding: 0.75rem;
		font-weight: 600;
		border-bottom: 1px solid #e9ecef;
	}

	.format-row {
		display: contents;
	}

	.format-row > span {
		padding: 0.75rem;
		border-bottom: 1px solid #f8f9fa;
	}

	.format-row:last-child > span {
		border-bottom: none;
	}

	.format-example {
		margin-top: 1.5rem;
		padding: 1rem;
		background-color: #f8f9fa;
		border-radius: 6px;
	}

	.format-example h4 {
		margin: 0 0 1rem 0;
		color: #333;
	}

	.example-table {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.5rem;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		overflow: hidden;
		font-size: 0.875rem;
	}

	.example-header {
		display: contents;
	}

	.example-header > span {
		background-color: #e9ecef;
		padding: 0.5rem;
		font-weight: 600;
		border-bottom: 1px solid #dee2e6;
	}

	.example-row {
		display: contents;
	}

	.example-row > span {
		padding: 0.5rem;
		background-color: white;
	}

	/* Table Features Styles */
	.table-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
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

	/* Filters */
	.filters-container {
		background: white;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.filters-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
		gap: 1rem;
		align-items: end;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.filter-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #333;
	}

	.filter-input,
	.filter-select {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.875rem;
		transition: border-color 0.2s;
	}

	.filter-input:focus,
	.filter-select:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	.clear-filters-btn {
		background-color: #6c757d;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background-color 0.2s;
		height: fit-content;
	}

	.clear-filters-btn:hover {
		background-color: #5a6268;
	}

	/* Sortable Headers */
	.sort-btn {
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		font-weight: 600;
		color: #333;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		width: 100%;
		justify-content: flex-start;
		transition: background-color 0.2s;
	}

	.sort-btn:hover {
		background-color: #f8f9fa;
	}

	.sort-icon {
		font-size: 0.75rem;
		color: #007bff;
	}

	/* Pagination */
	.pagination-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1rem;
		padding: 1rem 0;
		border-top: 1px solid #e9ecef;
	}

	.pagination-info {
		font-size: 0.875rem;
		color: #666;
	}

	.pagination-controls {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}

	.pagination-btn {
		padding: 0.5rem 0.75rem;
		border: 1px solid #ddd;
		background: white;
		color: #333;
		cursor: pointer;
		border-radius: 4px;
		font-size: 0.875rem;
		transition: all 0.2s;
		min-width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pagination-btn:hover:not(:disabled) {
		background-color: #f8f9fa;
		border-color: #007bff;
	}

	.pagination-btn.active {
		background-color: #007bff;
		color: white;
		border-color: #007bff;
	}

	.pagination-btn:disabled {
		background-color: #f8f9fa;
		color: #6c757d;
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Responsive Design for Table Features */
	@media (max-width: 768px) {
		.filters-row {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

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
