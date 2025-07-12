<script lang="ts">
	import { Login } from '$lib';
	import { authStore } from '$lib/stores/auth';
	import { APP_VERSION } from '$lib/version';

	// Handle login event from the Login component
	async function handleLogin(event: CustomEvent<{ email: string; password: string }>) {
		const { email, password } = event.detail;
		
		try {
			await authStore.login(email, password);
			// Navigation will be handled automatically by the layout
		} catch (error) {
			console.error('Login failed:', error);
			alert('Login failed. Please try again.');
		}
	}
</script>

<svelte:head>
	<title>Login - My Money App</title>
	<meta name="description" content="Login to your My Money account" />
</svelte:head>

<div class="login-page">
	<Login 
		title="Welcome to My Money" 
		loading={$authStore.isLoading} 
		on:login={handleLogin} 
	/>
	
	<footer class="version-footer">
		<span class="version-badge">v{APP_VERSION}</span>
	</footer>
</div>

<style>
	.login-page {
		min-height: 100vh;
		position: relative;
		/* Don't interfere with Login component's own centering */
	}
	
	.version-footer {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		z-index: 10;
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
</style>


