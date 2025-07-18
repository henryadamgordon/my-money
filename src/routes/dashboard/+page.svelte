<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { APP_VERSION } from '$lib/version';
	import { DashboardWidgets } from '$lib/components/dashboard';
	
	async function handleLogout() {
		try {
			authStore.logout();
			// Navigation will be handled by the layout
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}
</script>

<svelte:head>
	<title>Dashboard - My Money App</title>
</svelte:head>

<div class="dashboard">
	<header class="dashboard-header">
		<div class="header-top">
			<h1>My Money Dashboard</h1>
			<span class="version-badge">v{APP_VERSION}</span>
		</div>
		<div class="user-info">
			{#if $authStore.user}
				<span>Welcome, {$authStore.user.email}!</span>
				<button on:click={handleLogout} class="logout-btn">Logout</button>
			{/if}
		</div>
	</header>
	
	<main class="dashboard-content">
		<!-- Dashboard Widgets Section -->
		<DashboardWidgets />
		
		<div class="features-grid">
			<div class="feature-card">
				<h3>💰 Expenses</h3>
				<p>Track your daily expenses</p>
				<button disabled>Coming Soon</button>
			</div>
			
			<div class="feature-card">
				<h3>📊 Budget</h3>
				<p>Set and monitor budgets</p>
				<a href="/budget" class="nav-link">Manage Budget</a>
			</div>
			
			<div class="feature-card">
				<h3>📈 Reports</h3>
				<p>View financial reports</p>
				<button disabled>Coming Soon</button>
			</div>
			
			<div class="feature-card">
				<h3>⚙️ Settings</h3>
				<p>Test navigation persistence</p>
				<a href="/settings" class="nav-link">Go to Settings</a>
			</div>
		</div>
	</main>
</div>

<style>
	.dashboard {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 20px;
	}
	
	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: white;
		padding: 20px 30px;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		margin-bottom: 30px;
	}
	
	.header-top {
		display: flex;
		align-items: center;
		gap: 15px;
	}
	
	.dashboard-header h1 {
		margin: 0;
		color: #333;
		font-size: 1.8rem;
	}
	
	.version-badge {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 4px 10px;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.5px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	.user-info {
		display: flex;
		align-items: center;
		gap: 15px;
	}
	
	.user-info span {
		color: #666;
		font-weight: 500;
	}
	
	.logout-btn {
		background: #ff4757;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}
	
	.logout-btn:hover {
		background: #ff3742;
	}
	
	.dashboard-content {
		max-width: 1200px;
		margin: 0 auto;
	}
	
	/* Dashboard widgets will handle their own styling */
	
	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
	}
	
	.feature-card {
		background: white;
		padding: 25px;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		text-align: center;
	}
	
	.feature-card h3 {
		color: #333;
		margin-bottom: 10px;
	}
	
	.feature-card p {
		color: #666;
		margin-bottom: 20px;
	}
	
	.feature-card button {
		background: #ddd;
		color: #999;
		border: none;
		padding: 10px 20px;
		border-radius: 6px;
		cursor: not-allowed;
	}
	
	@media (max-width: 768px) {
		.dashboard-header {
			flex-direction: column;
			gap: 15px;
			text-align: center;
		}
		
		.user-info {
			flex-direction: column;
			gap: 10px;
		}
		
		.features-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
