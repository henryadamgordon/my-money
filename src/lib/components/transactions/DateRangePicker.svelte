<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let startDate: Date;
	export let endDate: Date;
	export let disabled = false;

	function formatDateForInput(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	function handleStartDateChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newStartDate = new Date(target.value);
		if (newStartDate <= endDate) {
			startDate = newStartDate;
			dispatch('dateRangeChange', { startDate, endDate });
		}
	}

	function handleEndDateChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newEndDate = new Date(target.value);
		if (newEndDate >= startDate) {
			endDate = newEndDate;
			dispatch('dateRangeChange', { startDate, endDate });
		}
	}

	function setCurrentMonth() {
		const now = new Date();
		startDate = new Date(now.getFullYear(), now.getMonth(), 1);
		endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
		dispatch('dateRangeChange', { startDate, endDate });
	}

	function setPreviousMonth() {
		const now = new Date();
		startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		endDate = new Date(now.getFullYear(), now.getMonth(), 0);
		dispatch('dateRangeChange', { startDate, endDate });
	}

	function setLast30Days() {
		const now = new Date();
		endDate = new Date(now);
		startDate = new Date(now.setDate(now.getDate() - 30));
		dispatch('dateRangeChange', { startDate, endDate });
	}
</script>

<div class="date-range-picker">
	<div class="date-inputs">
		<div class="input-group">
			<label for="start-date">From:</label>
			<input
				id="start-date"
				type="date"
				value={formatDateForInput(startDate)}
				on:change={handleStartDateChange}
				{disabled}
			/>
		</div>
		<div class="input-group">
			<label for="end-date">To:</label>
			<input
				id="end-date"
				type="date"
				value={formatDateForInput(endDate)}
				on:change={handleEndDateChange}
				{disabled}
			/>
		</div>
	</div>

	<div class="quick-filters">
		<button 
			type="button" 
			class="quick-btn" 
			on:click={setCurrentMonth}
			{disabled}
		>
			Current Month
		</button>
		<button 
			type="button" 
			class="quick-btn" 
			on:click={setPreviousMonth}
			{disabled}
		>
			Previous Month
		</button>
		<button 
			type="button" 
			class="quick-btn" 
			on:click={setLast30Days}
			{disabled}
		>
			Last 30 Days
		</button>
	</div>
</div>

<style>
	.date-range-picker {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 20px;
	}

	.date-inputs {
		display: flex;
		gap: 20px;
		margin-bottom: 15px;
		flex-wrap: wrap;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
		flex: 1;
		min-width: 150px;
	}

	.input-group label {
		font-weight: 600;
		color: #333;
		font-size: 0.9rem;
	}

	.input-group input {
		padding: 10px 12px;
		border: 2px solid #e1e5e9;
		border-radius: 6px;
		font-size: 0.95rem;
		transition: border-color 0.2s ease;
	}

	.input-group input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.input-group input:disabled {
		background: #f8f9fa;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.quick-filters {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: flex-start;
	}

	.quick-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.quick-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
	}

	.quick-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	@media (max-width: 768px) {
		.date-range-picker {
			padding: 15px;
		}

		.date-inputs {
			flex-direction: column;
			gap: 15px;
		}

		.input-group {
			min-width: unset;
		}

		.quick-filters {
			justify-content: center;
		}

		.quick-btn {
			flex: 1;
			min-width: 100px;
		}
	}
</style>