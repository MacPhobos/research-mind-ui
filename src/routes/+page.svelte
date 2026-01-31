<script lang="ts">
  import { getApiBaseUrl } from '$lib/utils/env';

  const apiBaseUrl = getApiBaseUrl();

  let loading = $state(true);
  let apiStatus = $state('Checking...');

  $effect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/version`);
        if (response.ok) {
          apiStatus = 'Connected';
        } else {
          apiStatus = `API Error: ${response.status}`;
        }
      } catch (error) {
        apiStatus = `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      } finally {
        loading = false;
      }
    };
    checkApi();
  });
</script>

<div class="container">
  <h1>Research Mind</h1>
  <p>Frontend application for research-mind service</p>

  <section>
    <h2>API Status</h2>
    {#if loading}
      <p>Checking API status...</p>
    {:else}
      <p>{apiStatus}</p>
    {/if}
  </section>

  <footer>
    <p>Running on port 15000 | Service on {apiBaseUrl}</p>
  </footer>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    color: #0066cc;
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
  }

  section {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    margin-top: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  footer {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid #ddd;
    text-align: center;
    color: #666;
  }
</style>
