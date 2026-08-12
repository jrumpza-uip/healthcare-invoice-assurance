import { apiToCloudUrl, buildTaskEmbedUrl } from './urls';

describe('UiPath URL construction', () => {
  it.each([
    ['https://api.uipath.com', 'https://cloud.uipath.com'],
    ['https://staging.api.uipath.com/', 'https://staging.uipath.com'],
    ['https://alpha.api.uipath.com', 'https://alpha.uipath.com'],
  ])('maps the supported API host %s to its exact UI host', (api, expected) => {
    expect(apiToCloudUrl(api)).toBe(expected);
  });

  it('rejects unknown API hosts instead of guessing', () => {
    expect(() => apiToCloudUrl('https://example.invalid')).toThrow('Unsupported UiPath API host');
  });

  it('builds the Action Center embed URL for the correlated task', () => {
    expect(buildTaskEmbedUrl({
      apiBaseUrl: 'https://api.uipath.com',
      orgName: 'uipathlabs',
      tenantName: 'Playground',
      taskId: 4182,
    })).toBe('https://cloud.uipath.com/embed_/uipathlabs/Playground/actions_/current-task/tasks/4182');
  });

});
