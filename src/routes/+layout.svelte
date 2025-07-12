<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { navigationStore } from '$lib/stores/navigation';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	
	let { children } = $props();

	// Initialize stores on mount
	onMount(() => {
		authStore.init();
		navigationStore.init();
	});

	// Track page changes for navigation state
	$effect(() => {
		if ($page.url.pathname) {
			navigationStore.navigateTo($page.url.pathname);
		}
	});

	// Handle authentication routing
	$effect(() => {
		if (!$authStore.isLoading) {
			const isLoginPage = $page.url.pathname === '/' || $page.url.pathname === '/login';
			
			if (!$authStore.isAuthenticated && !isLoginPage) {
				// User not authenticated and not on login page -> redirect to login
				goto('/');
			} else if ($authStore.isAuthenticated && isLoginPage) {
				// User authenticated but on login page -> redirect to last page or dashboard
				const redirectPage = navigationStore.getRedirectPage();
				goto(redirectPage);
			}
		}
	});
</script>

{#if $authStore.isLoading}
	<div class="loading-screen">
		<div class="spinner"></div>
		<p>Loading...</p>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.loading-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		background-color: #f5f5f5;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #007bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading-screen p {
		color: #666;
		font-size: 1.1rem;
	}
</style>
