import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ModuleRoute } from "@/components/auth/ModuleRoute";
import Index from "./pages/Index";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Properties from "./pages/Properties";
import SpaceCalculatorTool from "./pages/SpaceCalculatorTool";
import CostAnalyzerTool from "./pages/CostAnalyzerTool";
import BrochureGeneratorTool from "./pages/BrochureGeneratorTool";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import Outbox from "./pages/Outbox";
import Intelligence from "./pages/Intelligence";
import IntelligenceBriefs from "./pages/IntelligenceBriefs";
import BDTeam from "./pages/BDTeam";
import Payroll from "./pages/Payroll";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Kanban from "./pages/Kanban";
import PipelineDashboard from "./pages/PipelineDashboard";
import IntentSignalsPage from "./pages/IntentSignalsPage";
import IntentIndicators from "./pages/IntentIndicators";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public auth route */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/leads" element={<ModuleRoute module="leads"><Leads /></ModuleRoute>} />
          <Route path="/leads/:id" element={<ModuleRoute module="leads"><LeadDetail /></ModuleRoute>} />
          <Route path="/pipeline" element={<ModuleRoute module="deals"><Kanban /></ModuleRoute>} />
          <Route path="/crm" element={<ModuleRoute module="crm"><PipelineDashboard /></ModuleRoute>} />
          <Route path="/signals" element={<ModuleRoute module="signals"><IntentSignalsPage /></ModuleRoute>} />
          <Route path="/indicators" element={<ModuleRoute module="indicators"><IntentIndicators /></ModuleRoute>} />
          <Route path="/integrations" element={<ModuleRoute module="integrations"><Integrations /></ModuleRoute>} />
          <Route path="/properties" element={<ModuleRoute module="properties"><Properties /></ModuleRoute>} />
          <Route path="/tools/space" element={<ModuleRoute module="tools.space"><SpaceCalculatorTool /></ModuleRoute>} />
          <Route path="/tools/cost" element={<ModuleRoute module="tools.cost"><CostAnalyzerTool /></ModuleRoute>} />
          <Route path="/tools/brochure" element={<ModuleRoute module="tools.brochure"><BrochureGeneratorTool /></ModuleRoute>} />
          <Route path="/campaigns" element={<ModuleRoute module="campaigns"><Campaigns /></ModuleRoute>} />
          <Route path="/campaigns/:id" element={<ModuleRoute module="campaigns"><CampaignDetail /></ModuleRoute>} />
          <Route path="/outbox" element={<ModuleRoute module="outbox"><Outbox /></ModuleRoute>} />
          <Route path="/intelligence" element={<ModuleRoute module="intelligence"><Intelligence /></ModuleRoute>} />
          <Route path="/intelligence/briefs" element={<ModuleRoute module="briefs"><IntelligenceBriefs /></ModuleRoute>} />
          <Route path="/team" element={<ModuleRoute module="team"><BDTeam /></ModuleRoute>} />
          <Route path="/payroll" element={<ModuleRoute module="payroll"><Payroll /></ModuleRoute>} />
          <Route path="/payroll/:id" element={<ModuleRoute module="payroll"><Payroll /></ModuleRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
