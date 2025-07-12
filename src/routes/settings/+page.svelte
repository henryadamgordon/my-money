<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import { navigationStore } from '$lib/stores/navigation';
	import { goto } from '$app/navigation';

	async function handleLogout() {
		try {
			authStore.logout();
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}

	function goToDashboard() {
		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Settings - My Money App</title>
</svelte:head>

<div class="settings-container">
	<header class="settings-header">
		<h1>Settings</h1>
		<div class="user-info">
			{#if $authStore.user}
				<span>Logged in as: {$authStore.user.email}</span>
				<button on:click={handleLogout} class="logout-btn">Logout</button>
			{/if}
		</div>
	</header>

	<main class="settings-content">
		<div class="navigation-demo">
			<h2>Navigation Persistence Demo</h2>
			<p>This page demonstrates how the app remembers where you were when you refresh the browser.</p>
			
			<div class="demo-instructions">
				<h3>Try this:</h3>
				<ol>
					<li>Stay on this settings page</li>
					<li>Refresh your browser (F5 or Ctrl+R)</li>
					<li>Notice how you stay on the settings page instead of being redirected to login</li>
					<li>Your authentication state and current page are preserved!</li>
				</ol>
			</div>

			<div class="navigation-info">
				<h3>Current Navigation State:</h3>
				<p><strong>Current Page:</strong> {$navigationStore.currentPage}</p>
				<p><strong>Previous Page:</strong> {$navigationStore.previousPage || 'None'}</p>
				<p><strong>First Visit:</strong> {$navigationStore.isFirstVisit ? 'Yes' : 'No'}</p>
			</div>

			<div class="actions">
				<button on:click={goToDashboard} class="nav-btn">Go to Dashboard</button>
				<button on:click={() => goto('/')} class="nav-btn">Go to Login</button>
			</div>
		</div>

		<div class="settings-section">
			<h2>User Preferences</h2>
			<p>Settings functionality will be implemented here...</p>
		</div>
	</main>
</div>

<style>
	.settings-container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding: 2rem;
	}

	.settings-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: white;
		padding: 1.5rem 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.settings-header h1 {
		margin: 0;
		color: #333;
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

	.settings-content {
		display: grid;
		gap: 2rem;
		grid-template-columns: 1fr;
		max-width: 800px;
	}

	.navigation-demo, .settings-section {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.navigation-demo h2, .settings-section h2 {
		margin-top: 0;
		color: #333;
	}

	.demo-instructions {
		background: #e3f2fd;
		padding: 1.5rem;
		border-radius: 6px;
		margin: 1.5rem 0;
	}

	.demo-instructions h3 {
		margin-top: 0;
		color: #1976d2;
	}

	.demo-instructions ol {
		margin-bottom: 0;
	}

	.demo-instructions li {
		margin-bottom: 0.5rem;
	}

	.navigation-info {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 6px;
		margin: 1.5rem 0;
	}

	.navigation-info h3 {
		margin-top: 0;
		color: #495057;
	}

	.navigation-info p {
		margin: 0.5rem 0;
		font-family: monospace;
		background: white;
		padding: 0.5rem;
		border-radius: 4px;
		border: 1px solid #dee2e6;
	}

	.actions {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.nav-btn {
		background-color: #007bff;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.nav-btn:hover {
		background-color: #0056b3;
	}

	@media (max-width: 768px) {
		.settings-container {
			padding: 1rem;
		}

		.settings-header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.actions {
			flex-direction: column;
		}
	}
</style>
