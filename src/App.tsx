import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SignedIn, SignedOut, RedirectToSignIn, useAuth, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { syncUserFromClerk } from '@/lib/supabase';

// Layout Components
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Pages
import HomePage from '@/pages/HomePage';
import ConverterPage from '@/pages/ConverterPage';
import BatchProcessorPage from '@/pages/BatchProcessorPage';
import EditorPage from '@/pages/EditorPage';
import HistoryPage from '@/pages/HistoryPage';
import ProfilePage from '@/pages/ProfilePage';
import HowItWorksPage from '@/pages/HowItWorksPage';
import SignInPage from '@/pages/SignInPage';
import SignUpPage from '@/pages/SignUpPage';
import NotFound from '@/pages/NotFound';

// Context Providers
import { ConversionProvider } from '@/contexts/ConversionContext';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Component to sync user to Supabase when they sign in
const UserSync = () => {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Sync user to Supabase
      syncUserFromClerk({
        id: user.id,
        emailAddresses: user.emailAddresses.map(e => ({
          emailAddress: e.emailAddress
        })),
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        imageUrl: user.imageUrl,
        externalAccounts: user.externalAccounts?.map(a => ({
          provider: a.provider
        })),
      }).then((dbUser) => {
        if (dbUser) {
          console.log('✅ User synced to Supabase:', dbUser.email);
        }
      }).catch((err) => {
        console.error('Failed to sync user:', err);
      });
    }
  }, [user, isLoaded, isSignedIn]);

  return null;
};

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

// Auth check component for homepage
const AuthRedirect = () => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <HomePage />;
};

// Layout wrapper
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/sign-in') || location.pathname.startsWith('/sign-up');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

function AppRoutes() {
  return (
    <>
      {/* Sync user to Supabase on sign in */}
      <UserSync />

      <AppLayout>
        <Routes>
          <Route path="/" element={<AuthRedirect />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />

          <Route path="/converter" element={
            <ProtectedRoute><ConverterPage /></ProtectedRoute>
          } />
          <Route path="/batch-processor" element={
            <ProtectedRoute><BatchProcessorPage /></ProtectedRoute>
          } />
          <Route path="/editor" element={
            <ProtectedRoute><EditorPage /></ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute><HistoryPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/how-it-works" element={
            <ProtectedRoute><HowItWorksPage /></ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <ConversionProvider>
            <Router>
              <AppRoutes />
              <Toaster />
            </Router>
          </ConversionProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;