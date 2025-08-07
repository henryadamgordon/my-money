<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	const dispatch = createEventDispatcher();

	export let title = '';
	export let showCloseButton = true;
	export let maxWidth = '600px';

	function closeModal() {
		dispatch('close');
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div 
	class="modal-backdrop" 
	on:click={handleBackdropClick}
	on:keydown={handleKeydown}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
	transition:fade={{ duration: 200 }}
>
	<div 
		class="modal-content" 
		style="max-width: {maxWidth}"
		transition:fly={{ y: -50, duration: 300 }}
	>
		{#if title || showCloseButton}
			<div class="modal-header">
				{#if title}
					<h2>{title}</h2>
				{/if}
				{#if showCloseButton}
					<button class="close-btn" on:click={closeModal} aria-label="Close modal">
						✕
					</button>
				{/if}
			</div>
		{/if}
		
		<div class="modal-body">
			<slot />
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
		backdrop-filter: blur(4px);
	}

	.modal-content {
		background: white;
		border-radius: 16px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		position: relative;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24px 24px 0 24px;
		border-bottom: 1px solid #e1e5e9;
		margin-bottom: 0;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #333;
		padding-bottom: 16px;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #666;
		cursor: pointer;
		padding: 8px;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		position: absolute;
		top: 16px;
		right: 16px;
	}

	.close-btn:hover {
		background: rgba(0, 0, 0, 0.1);
		color: #333;
	}

	.modal-body {
		padding: 24px;
	}

	/* Remove padding when no header */
	:global(.modal-content:not(:has(.modal-header)) .modal-body) {
		padding-top: 24px;
	}

	@media (max-width: 768px) {
		.modal-backdrop {
			padding: 10px;
			align-items: flex-start;
			padding-top: 40px;
		}

		.modal-content {
			max-height: calc(100vh - 80px);
			border-radius: 12px;
		}

		.modal-header {
			padding: 20px 20px 0 20px;
		}

		.modal-header h2 {
			font-size: 1.3rem;
			padding-bottom: 12px;
		}

		.modal-body {
			padding: 20px;
		}

		.close-btn {
			top: 12px;
			right: 12px;
			width: 36px;
			height: 36px;
			font-size: 1.3rem;
		}
	}
</style>