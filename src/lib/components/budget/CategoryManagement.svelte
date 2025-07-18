<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { CategoryService, type Category } from '$lib/services/categoryService';
	import { authStore } from '$lib/stores/auth';

	// Props
	export let categories: Category[] = [];
	export let isVisible = false;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		categoriesUpdated: void;
		error: { message: string };
	}>();

	// Component state
	let showCategoryModal = false;
	let categoryFormData = {
		name: '',
		color: '#FF6B6B',
		icon: '📁'
	};
	let editingCategory: Category | null = null;

	// Modal functions
	function closeCategoryModal() {
		showCategoryModal = false;
		editingCategory = null;
		categoryFormData = {
			name: '',
			color: '#FF6B6B',
			icon: '📁'
		};
	}

	function openAddCategoryModal() {
		editingCategory = null;
		categoryFormData = {
			name: '',
			color: '#FF6B6B',
			icon: '📁'
		};
		showCategoryModal = true;
	}

	function openEditCategoryModal(category: Category) {
		editingCategory = category;
		categoryFormData = {
			name: category.name,
			color: category.color,
			icon: category.icon
		};
		showCategoryModal = true;
	}

	// Category CRUD operations
	async function saveCategory() {
		if (!$authStore.user || !categoryFormData.name.trim()) return;

		try {
			if (editingCategory) {
				await CategoryService.updateCategory(editingCategory.id, categoryFormData);
			} else {
				await CategoryService.addCategory(categoryFormData, $authStore.user.id);
			}
			dispatch('categoriesUpdated');
			closeCategoryModal();
		} catch (err) {
			console.error('Error saving category:', err);
			dispatch('error', { message: 'Failed to save category. Please try again.' });
		}
	}

	async function deleteCategory(categoryId: string) {
		if (!confirm('Are you sure you want to delete this category?')) return;

		try {
			await CategoryService.deleteCategory(categoryId);
			dispatch('categoriesUpdated');
		} catch (err) {
			console.error('Error deleting category:', err);
			dispatch('error', { message: 'Failed to delete category. Please try again.' });
		}
	}

	// Handle escape key for modal
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && showCategoryModal) {
			closeCategoryModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isVisible}
	<!-- Category Management Section -->
	<div class="category-management">
		<div class="category-header">
			<h3>📁 Categories</h3>
			<button on:click={openAddCategoryModal} class="add-category-btn">
				➕ Add Category
			</button>
		</div>
		
		<div class="categories-grid">
			{#each categories as category}
				<div class="category-card" style="border-left: 4px solid {category.color};">
					<div class="category-info">
						<span class="category-icon">{category.icon}</span>
						<span class="category-name">{category.name}</span>
					</div>
					<div class="category-actions">
						<button 
							on:click={() => openEditCategoryModal(category)} 
							class="edit-category-btn"
							title="Edit category"
						>
							✏️
						</button>
						<button 
							on:click={() => deleteCategory(category.id)} 
							class="delete-category-btn"
							title="Delete category"
						>
							🗑️
						</button>
					</div>
				</div>
			{/each}
			
			{#if categories.length === 0}
				<div class="no-categories">
					<p>No categories yet. Add your first category to get started!</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Category Modal -->
	{#if showCategoryModal}
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		<div 
			class="modal-overlay" 
			role="dialog" 
			aria-modal="true" 
			aria-labelledby="category-modal-title"
			tabindex="0"
			on:click={closeCategoryModal}
			on:keydown={(e) => e.key === 'Escape' && closeCategoryModal()}
		>
			<div 
				class="modal-content" 
				role="document"
				on:click|stopPropagation
				on:keydown|stopPropagation
			>
				<div class="modal-header">
					<h3 id="category-modal-title">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
					<button on:click={closeCategoryModal} class="modal-close">×</button>
				</div>
				<div class="modal-body">
					<form on:submit|preventDefault={saveCategory} class="category-form">
						<div class="form-group">
							<label for="categoryName">Category Name *</label>
							<input
								id="categoryName"
								type="text"
								bind:value={categoryFormData.name}
								placeholder="Enter category name"
								required
							/>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label for="categoryIcon">Icon</label>
								<input
									id="categoryIcon"
									type="text"
									bind:value={categoryFormData.icon}
									placeholder="📁"
									maxlength="2"
								/>
							</div>

							<div class="form-group">
								<label for="categoryColor">Color</label>
								<input
									id="categoryColor"
									type="color"
									bind:value={categoryFormData.color}
								/>
							</div>
						</div>

						<div class="category-preview">
							<span>Preview:</span>
							<span 
								class="category-badge" 
								style="background-color: {categoryFormData.color}20; color: {categoryFormData.color}; border: 1px solid {categoryFormData.color}40;"
							>
								{categoryFormData.icon} {categoryFormData.name || 'Category Name'}
							</span>
						</div>

						<div class="form-actions">
							<button type="submit" class="submit-btn">
								{editingCategory ? 'Update Category' : 'Add Category'}
							</button>
							<button type="button" on:click={closeCategoryModal} class="cancel-btn">
								Cancel
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.category-management {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.category-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.category-header h3 {
		margin: 0;
		color: #333;
		font-size: 1.25rem;
	}

	.add-category-btn {
		background: #28a745;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.add-category-btn:hover {
		background: #218838;
	}

	.categories-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}

	.category-card {
		background: #f8f9fa;
		border-radius: 6px;
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.category-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.category-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.category-icon {
		font-size: 1.2rem;
	}

	.category-name {
		font-weight: 500;
		color: #333;
	}

	.category-actions {
		display: flex;
		gap: 0.5rem;
	}

	.edit-category-btn,
	.delete-category-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	.edit-category-btn:hover {
		background: #e9ecef;
	}

	.delete-category-btn:hover {
		background: #f8d7da;
	}

	.no-categories {
		grid-column: 1 / -1;
		text-align: center;
		padding: 2rem;
		color: #6c757d;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		border-radius: 8px;
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
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
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background-color 0.2s;
	}

	.modal-close:hover {
		background: #f8f9fa;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.category-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-group label {
		font-weight: 500;
		color: #333;
		font-size: 0.9rem;
	}

	.form-group input {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	.category-preview {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 4px;
	}

	.category-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	.submit-btn {
		background: #007bff;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: background-color 0.2s;
	}

	.submit-btn:hover {
		background: #0056b3;
	}

	.cancel-btn {
		background: #6c757d;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: background-color 0.2s;
	}

	.cancel-btn:hover {
		background: #545b62;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.categories-grid {
			grid-template-columns: 1fr;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.modal-content {
			width: 95%;
			margin: 1rem;
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>
