const UI_HOSTS: Record<string, string> = {
  'api.uipath.com': 'cloud.uipath.com',
  'staging.api.uipath.com': 'staging.uipath.com',
  'alpha.api.uipath.com': 'alpha.uipath.com',
};

export function apiToCloudUrl(apiBaseUrl: string): string {
  const parsed = new URL(apiBaseUrl);
  const uiHost = UI_HOSTS[parsed.hostname];
  if (!uiHost) {
    throw new Error(`Unsupported UiPath API host: ${parsed.hostname}`);
  }
  return `${parsed.protocol}//${uiHost}`;
}

interface TaskEmbedUrlOptions {
  apiBaseUrl: string;
  orgName: string;
  tenantName: string;
  taskId: number | string;
}

export function buildTaskEmbedUrl(options: TaskEmbedUrlOptions): string {
  const origin = apiToCloudUrl(options.apiBaseUrl);
  return `${origin}/embed_/${encodeURIComponent(options.orgName)}/${encodeURIComponent(options.tenantName)}/actions_/current-task/tasks/${encodeURIComponent(String(options.taskId))}`;
}
