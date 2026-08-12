import { Alert, AlertDescription } from '@uipath/apollo-wind/components/ui/alert';
import { Button } from '@uipath/apollo-wind/components/ui/button';
import { Spinner } from '@uipath/apollo-wind/components/ui/spinner';
import { Toaster } from '@uipath/apollo-wind/components/ui/sonner';
import { getAppBase } from '@uipath/uipath-typescript';
import { ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ContractLibraryPage } from './pages/ContractLibraryPage';
import { InvoiceWorkspacePage } from './pages/InvoiceWorkspacePage';
import { NewAnalysisPage } from './pages/NewAnalysisPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { createPlatformServices } from './services/platform';
import type { SubmissionDraft } from './services/submission';
import type { ActivityEvent, InvoiceLineItem, InvoiceRecord } from './services/invoice-records';
import type { ProcessVariable } from './utils/process-state';

function AppContent() {
  const { isAuthenticated, isLoading, sdk, login, logout, error } = useAuth();

  if (isLoading) return <div className="auth-screen"><Spinner label="Initializing UiPath…" showLabel /></div>;
  if (!isAuthenticated) return <div className="auth-screen"><div className="auth-card"><span className="auth-mark"><ShieldCheck className="h-7 w-7" /></span><p className="eyebrow">UiPath Healthcare</p><h1>Invoice Assurance</h1><p>Sign in with your delegated UiPath account to review invoice evidence and governed contract findings.</p>{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}<Button onClick={() => void login()}>Sign in with UiPath</Button><small>uipathlabs · Playground · AMER Presales/HLS</small></div></div>;

  return <BrowserRouter basename={getAppBase()}><AuthenticatedRoutes sdk={sdk} onLogout={logout} /></BrowserRouter>;
}

function AuthenticatedRoutes({ sdk, onLogout }: { sdk: ReturnType<typeof useAuth>['sdk']; onLogout: () => void }) {
  const services = useMemo(() => createPlatformServices(sdk), [sdk]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  const loadPortfolio = useCallback(async () => {
    if (invoices.length === 0) setPortfolioLoading(true);
    try { setInvoices(await services.listInvoices()); setPortfolioError(null); }
    catch (caught) { setPortfolioError(caught instanceof Error ? caught.message : 'Unable to load invoice records.'); }
    finally { setPortfolioLoading(false); }
  }, [services, invoices.length]);

  useEffect(() => { void loadPortfolio(); }, [loadPortfolio]);

  return <AppShell onLogout={onLogout}><Routes>
    <Route path="/" element={<PortfolioPage invoices={invoices} isLoading={portfolioLoading} error={portfolioError} onRetry={() => void loadPortfolio()} />} />
    <Route path="/new" element={<NewAnalysisRoute submit={services.submit} afterSubmit={loadPortfolio} />} />
    <Route path="/invoices/:invoiceId" element={<WorkspaceRoute loadWorkspace={services.loadWorkspace} />} />
    <Route path="/contracts" element={<ContractLibraryPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AppShell>;
}

function NewAnalysisRoute({ submit, afterSubmit }: { submit: (draft: SubmissionDraft) => Promise<{ invoiceRecordId: string }>; afterSubmit: () => Promise<void> }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSubmit = async (draft: SubmissionDraft) => {
    setIsSubmitting(true); setError(null);
    try { const result = await submit(draft); await afterSubmit(); navigate(`/invoices/${result.invoiceRecordId}`); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to start the analysis.'); }
    finally { setIsSubmitting(false); }
  };
  return <NewAnalysisPage isSubmitting={isSubmitting} error={error} onSubmit={onSubmit} />;
}

interface WorkspaceData { invoice: InvoiceRecord; lineItems: InvoiceLineItem[]; activities: ActivityEvent[]; processVariables: ProcessVariable[]; taskEmbedUrl: string | null }

function WorkspaceRoute({ loadWorkspace }: { loadWorkspace: (id: string, previous?: ProcessVariable[]) => Promise<WorkspaceData> }) {
  const { invoiceId = '' } = useParams();
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const variablesRef = useRef<ProcessVariable[]>([]);

  const refresh = useCallback(async (initial = false) => {
    if (initial) setIsLoading(true);
    try { const next = await loadWorkspace(invoiceId, variablesRef.current); variablesRef.current = next.processVariables; setData(next); setError(null); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to refresh this invoice.'); }
    finally { if (initial) setIsLoading(false); }
  }, [invoiceId, loadWorkspace]);

  useEffect(() => {
    variablesRef.current = []; setData(null); void refresh(true);
    const interval = window.setInterval(() => void refresh(false), 5000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  return <InvoiceWorkspacePage invoice={data?.invoice ?? null} lineItems={data?.lineItems ?? []} activities={data?.activities ?? []} taskEmbedUrl={data?.taskEmbedUrl ?? null} processVariables={data?.processVariables ?? []} isLoading={isLoading} error={error} onRetry={() => void refresh(!data)} />;
}

export default function App() { return <AuthProvider><AppContent /><Toaster /></AuthProvider>; }
