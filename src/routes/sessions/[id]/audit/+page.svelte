<script lang="ts">
  import AuditLogTable from '$lib/components/audit/AuditLogTable.svelte';

  interface Props {
    data: {
      sessionId: string;
    };
  }

  let { data }: Props = $props();
</script>

<svelte:head>
  <title>Audit Log - Research Mind</title>
</svelte:head>

<div class="audit-page">
  <div class="page-header">
    <h2>Audit Log</h2>
    <p class="description">
      View the activity history for this session. All operations are logged with timestamps and status information.
    </p>
  </div>

  <AuditLogTable sessionId={data.sessionId} />
</div>

<style>
  .audit-page {
    padding: var(--space-4) 0;
  }

  .page-header {
    margin-bottom: var(--space-6);
  }

  .page-header h2 {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text-primary);
  }

  .description {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1.5;
  }
</style>
