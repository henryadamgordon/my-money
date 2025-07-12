<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	// Component props
	export let title = 'Login';
	export let loading = false;
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		login: { email: string; password: string };
	}>();

	// Form data
	let email = '';
	let password = '';
	let errors: { email?: string; password?: string } = {};

	// Form validation
	function validateForm() {
		errors = {};
		
		if (!email) {
			errors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(email)) {
			errors.email = 'Email is invalid';
		}
		
		if (!password) {
			errors.password = 'Password is required';
		} else if (password.length < 6) {
			errors.password = 'Password must be at least 6 characters';
		}
		
		return Object.keys(errors).length === 0;
	}

	// Handle form submission
	function handleSubmit() {
		if (validateForm()) {
			dispatch('login', { email, password });
		}
	}
</script>

<div class="login-container">
	<div class="login-card">
		<h2>{title}</h2>
		
		<form on:submit|preventDefault={handleSubmit}>
			<div class="form-group">
				<label for="email">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					placeholder="Enter your email"
					class:error={errors.email}
					disabled={loading}
				/>
				{#if errors.email}
					<span class="error-message">{errors.email}</span>
				{/if}
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="Enter your password"
					class:error={errors.password}
					disabled={loading}
				/>
				{#if errors.password}
					<span class="error-message">{errors.password}</span>
				{/if}
			</div>

			<button type="submit" class="login-button" disabled={loading}>
				{#if loading}
					<span class="spinner"></span>
					Logging in...
				{:else}
					Login
				{/if}
			</button>
		</form>

		<!-- <div class="login-footer">
			<p>Don't have an account? <a href="/register">Sign up</a></p>
		</div> -->
	</div>
</div>

<style>
	.login-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		background-color: #f5f5f5;
		padding: 1rem;
	}
	
	@media (max-width: 768px) {
		.login-container {
			align-items: flex-start;
			padding-top: 2rem;
			padding-left: 0.5rem;
			padding-right: 0.5rem;
		}
		
		.login-card {
			padding: 1.5rem;
			max-width: 100%;
			border-radius: 12px;
		}
		
		h2 {
			font-size: 1.3rem;
			margin-bottom: 1.5rem;
		}
	}

	.login-card {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 400px;
	}

	h2 {
		text-align: center;
		margin-bottom: 2rem;
		color: #333;
		font-size: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #555;
		font-weight: 500;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		transition: border-color 0.2s;
		box-sizing: border-box;
	}

	input:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	input.error {
		border-color: #dc3545;
	}

	.error-message {
		color: #dc3545;
		font-size: 0.875rem;
		margin-top: 0.25rem;
		display: block;
	}

	.login-button {
		width: 100%;
		padding: 0.75rem;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.login-button:hover:not(:disabled) {
		background-color: #0056b3;
	}

	.login-button:disabled {
		background-color: #6c757d;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.login-footer {
		text-align: center;
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #eee;
	}

	.login-footer p {
		margin: 0;
		color: #666;
	}

	.login-footer a {
		color: #007bff;
		text-decoration: none;
	}

	.login-footer a:hover {
		text-decoration: underline;
	}
</style>
