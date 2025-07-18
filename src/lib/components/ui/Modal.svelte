<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Props
	export let show: boolean = false;
	export let title: string = '';
	export let titleId: string = 'modal-title';
	export let size: 'small' | 'medium' | 'large' = 'medium';
	export let closeOnOverlayClick: boolean = true;
	export let closeOnEscape: boolean = true;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	// Handle close events
	function handleClose() {
		dispatch('close');
	}

	function handleOverlayClick() {
		if (closeOnOverlayClick) {
			handleClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (closeOnEscape && event.key === 'Escape') {
			handleClose();
		}
	}
</script>

{#if show}
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div 
		class="modal-overlay" 
		role="dialog" 
		aria-modal="true" 
		aria-labelledby={titleId}
		tabindex="0"
		on:click={handleOverlayClick}
		on:keydown={handleKeydown}
	>
		<div 
			class="modal-content {size}" 
			role="document"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="modal-header">
				<h3 id={titleId}>{title}</h3>
				<button on:click={handleClose} class="modal-close" aria-label="Close modal">×</button>
			</div>
			<div class="modal-body">
				<slot />
			</div>
			{#if $$slots.footer}
				<div class="modal-footer">
					<slot name="footer" />
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
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
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		max-height: 90vh;
		overflow-y: auto;
		width: 100%;
		max-width: 500px;
	}

	.modal-content.small {
		max-width: 400px;
	}

	.modal-content.medium {
		max-width: 600px;
	}

	.modal-content.large {
		max-width: 800px;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 1.5rem 0;
		border-bottom: 1px solid #e9ecef;
		margin-bottom: 1rem;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #333;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
		color: #666;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.modal-close:hover {
		background-color: #f8f9fa;
		color: #333;
	}

	.modal-body {
		padding: 0 1.5rem 1.5rem;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid #e9ecef;
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.modal-overlay {
			padding: 0.5rem;
		}
		
		.modal-content {
			max-width: 100%;
			margin: 0;
		}
		
		.modal-header {
			padding: 1rem 1rem 0;
		}
		
		.modal-body {
			padding: 0 1rem 1rem;
		}
		
		.modal-footer {
			padding: 1rem;
		}
	}
</style>
