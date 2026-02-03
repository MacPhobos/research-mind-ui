<script lang="ts">
  // This page redirects to /sessions via +page.ts
  // This component serves as a fallback during SSR
</script>

<div class="redirect-page">
  <p>Redirecting to sessions...</p>
</div>

<style>
  .redirect-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
  }

  p {
    color: var(--text-secondary);
  }
</style>
