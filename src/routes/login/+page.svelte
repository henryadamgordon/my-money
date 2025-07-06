<script lang="ts">
	import { Login } from '$lib';
	import { goto } from '$app/navigation';

	let loading = false;

	// Handle login event from the Login component
	async function handleLogin(event: CustomEvent<{ email: string; password: string }>) {
		const { email, password } = event.detail;
		
		loading = true;
		
		try {
			// Simulate API call
			console.log('Login attempt:', { email, password });
			
			// Simulate network delay
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			// In a real app, you would make an API call here
			// const response = await fetch('/api/login', {
			//   method: 'POST',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify({ email, password })
			// });
			
			// For demo purposes, accept any login
			alert(`Login successful for ${email}!`);
			
			// Redirect to dashboard or home page
			goto('/');
			
		} catch (error) {
			console.error('Login failed:', error);
			alert('Login failed. Please try again.');
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
	title="Welcome Back" 
	{loading} 
	on:login={handleLogin} 
/>
