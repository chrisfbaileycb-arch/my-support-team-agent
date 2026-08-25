import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScheduleProvider } from "@/contexts/ScheduleContext";
import { PipelineProvider } from "@/contexts/PipelineContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import FinalReport from "./pages/FinalReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary fallbackTitle="Application Shield Active" fallbackMessage="An error occurred within the top-level application root. Click below to recover immediately.">
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ScheduleProvider>
                <PipelineProvider>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/final-report" element={<FinalReport />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </PipelineProvider>
              </ScheduleProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
