import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Play from "./pages/Play";
import Shop from "./pages/Shop";
import History from "./pages/History";
import Redeem from "./pages/Redeem";
import Navbar from "./components/Navbar";

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/play" component={Play} />
        <Route path="/shop" component={Shop} />
        <Route path="/history" component={History} />
        <Route path="/redeem" component={Redeem} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
