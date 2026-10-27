import { useCallback, useEffect, useRef, useState } from 'react';

interface DocumentViewerState {
  name: string;
  url: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useDocumentViewer(getDocumentUrl: (bucketName: string, path: string) => Promise<string>) {
  const [state, setState] = useState<DocumentViewerState | null>(null);
  const activeUrlRef = useRef<string | null>(null);

  const revokeActiveUrl = useCallback(() => {
    if (activeUrlRef.current?.startsWith('blob:')) URL.revokeObjectURL(activeUrlRef.current);
    activeUrlRef.current = null;
  }, []);

  const close = useCallback(() => {
    revokeActiveUrl();
    setState(null);
  }, [revokeActiveUrl]);

  const open = useCallback(async (bucketName: string, path: string, name: string) => {
    revokeActiveUrl();
    setState({ name, url: null, isLoading: true, error: null });
    try {
      const url = await getDocumentUrl(bucketName, path);
      activeUrlRef.current = url;
      setState({ name, url, isLoading: false, error: null });
    } catch (caught) {
      setState({ name, url: null, isLoading: false, error: caught instanceof Error ? caught.message : 'Unable to load this document.' });
    }
  }, [getDocumentUrl, revokeActiveUrl]);

  useEffect(() => () => revokeActiveUrl(), [revokeActiveUrl]);

  return { viewer: state, open, close };
}
