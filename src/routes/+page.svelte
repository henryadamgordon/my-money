<script lang="ts">
	import { Login } from '$lib';
	import { login } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { APP_VERSION, APP_NAME } from '$lib/version';

	let loading = false;

	// Handle login from the Login component
	async function handleLogin(data: { email: string; password: string }) {
		const { email, password } = data;
		
		loading = true;
		
		try {
			const user = await login(email, password);
			console.log('Login successful:', user.uid);
			alert(`Welcome back, ${user.email}!`);
			
			// Redirect to dashboard
			goto('/dashboard');
			
		} catch (error: any) {
			console.error('Login failed:', error);
			
			// Handle specific Firebase Auth errors
			let errorMessage = 'Login failed. Please try again.';
			
			if (error.code === 'auth/user-not-found') {
				errorMessage = 'No account found with this email.';
			} else if (error.code === 'auth/wrong-password') {
				errorMessage = 'Incorrect password.';
			} else if (error.code === 'auth/invalid-email') {
				errorMessage = 'Invalid email address.';
			} else if (error.code === 'auth/too-many-requests') {
				errorMessage = 'Too many failed attempts. Please try again later.';
			}
			
			alert(errorMessage);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Login - My Money App</title>
	<meta name="description" content="Login to your My Money account" />
</svelte:head>

<Login 
	title="Welcome to My Money" 
	{loading} 
	onLogin={handleLogin} 
/>

<footer class="app-version">
	<p>{APP_NAME} v{APP_VERSION}</p>
</footer>

<style>
	.app-version {
		position: fixed;
		bottom: 20px;
		right: 20px;
		background: rgba(255, 255, 255, 0.95);
		padding: 8px 12px;
		border-radius: 8px;
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		z-index: 100;
	}
	
	.app-version p {
		margin: 0;
		font-size: 0.75rem;
		color: #333;
		font-weight: 600;
		letter-spacing: 0.5px;
	}
	
	@media (max-width: 768px) {
		.app-version {
			bottom: 15px;
			right: 15px;
			padding: 8px 12px;
			background: rgba(255, 255, 255, 0.95);
			border: 1px solid rgba(0, 0, 0, 0.1);
			z-index: 1000;
		}
		
		.app-version p {
			font-size: 0.75rem;
			color: #333;
			font-weight: 600;
		}
	}
</style>
