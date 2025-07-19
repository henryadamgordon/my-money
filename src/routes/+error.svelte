<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { authStore } from '$lib/stores/auth';

	let countdown = 5;
	let redirectTimer: ReturnType<typeof setTimeout> | null = null;
	let countdownInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		if (!browser) return;

		// Wait for auth store to initialize before starting countdown
		const unsubscribe = authStore.subscribe((auth) => {
			if (!auth.isLoading) {
				startCountdown();
				unsubscribe();
			}
		});

		// Cleanup on component destroy
		return () => {
			cleanupTimers();
			unsubscribe();
		};
	});

	function startCountdown() {
		if (!browser) return;

		// Start countdown timer
		countdownInterval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				cleanupTimers();
				redirectToDashboard();
			}
		}, 1000);

		// Auto redirect after 5 seconds
		redirectTimer = setTimeout(() => {
			redirectToDashboard();
		}, 5000);
	}

	function cleanupTimers() {
		if (countdownInterval) {
			clearInterval(countdownInterval);
			countdownInterval = null;
		}
		if (redirectTimer) {
			clearTimeout(redirectTimer);
			redirectTimer = null;
		}
	}

	function redirectToDashboard() {
		if (!browser) return;

		// Check auth state and redirect accordingly
		if ($authStore.isAuthenticated) {
			goto('/dashboard');
		} else {
			goto('/');
		}
	}

	function redirectNow() {
		cleanupTimers();
		redirectToDashboard();
	}
</script>

<svelte:head>
	<title>Page Not Found - My Money</title>
</svelte:head>

<div class="error-page">
	<div class="error-container">
		<div class="error-content">
			<div class="error-icon">🔍</div>
			<h1 class="error-title">Page Not Found</h1>
			<p class="error-message">
				Sorry, we couldn't find the page you're looking for.
			</p>
			<div class="error-details">
				<p class="error-path">
					<strong>Requested path:</strong> {$page.url.pathname}
				</p>
				{#if $page.error?.message}
					<p class="error-description">
						<strong>Error:</strong> {$page.error.message}
					</p>
				{/if}
			</div>
			
			<div class="redirect-info">
				<p class="redirect-message">
					Redirecting to dashboard in <span class="countdown">{countdown}</span> seconds...
				</p>
				<div class="redirect-actions">
					<button class="redirect-btn primary" on:click={redirectNow}>
						🏠 Go to Dashboard Now
					</button>
					<a href="/" class="redirect-btn secondary">
						🔑 Back to Login
					</a>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.error-container {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		max-width: 600px;
		width: 100%;
		overflow: hidden;
	}

	.error-content {
		padding: 3rem 2rem;
		text-align: center;
	}

	.error-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.8;
	}

	.error-title {
		color: #2c3e50;
		font-size: 2.5rem;
		margin: 0 0 1rem 0;
		font-weight: 700;
	}

	.error-message {
		color: #7f8c8d;
		font-size: 1.2rem;
		margin: 0 0 2rem 0;
		line-height: 1.5;
	}

	.error-details {
		background: #f8f9fa;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
		text-align: left;
	}

	.error-path,
	.error-description {
		margin: 0.5rem 0;
		font-size: 0.9rem;
		color: #495057;
		word-break: break-all;
	}

	.error-path strong,
	.error-description strong {
		color: #2c3e50;
	}

	.redirect-info {
		border-top: 1px solid #e9ecef;
		padding-top: 2rem;
	}

	.redirect-message {
		color: #6c757d;
		font-size: 1rem;
		margin: 0 0 1.5rem 0;
	}

	.countdown {
		color: #e74c3c;
		font-weight: 700;
		font-size: 1.1rem;
	}

	.redirect-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.redirect-btn {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.redirect-btn.primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.redirect-btn.primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
	}

	.redirect-btn.secondary {
		background: #6c757d;
		color: white;
	}

	.redirect-btn.secondary:hover {
		background: #5a6268;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
	}

	@media (max-width: 768px) {
		.error-page {
			padding: 1rem;
		}

		.error-content {
			padding: 2rem 1.5rem;
		}

		.error-title {
			font-size: 2rem;
		}

		.error-message {
			font-size: 1rem;
		}

		.redirect-actions {
			flex-direction: column;
			align-items: center;
		}

		.redirect-btn {
			width: 200px;
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		.error-content {
			padding: 1.5rem 1rem;
		}

		.error-icon {
			font-size: 3rem;
		}

		.error-title {
			font-size: 1.8rem;
		}

		.error-details {
			padding: 1rem;
		}
	}
</style>
