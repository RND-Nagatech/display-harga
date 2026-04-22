import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import ContentTypes from "./pages/ContentTypes";
import MediaPage from "./pages/Media";
import Promos from "./pages/Promos";
import Users from "./pages/Users";
import SettingsPage from "./pages/SettingsPage";
import DisplayTV from "./pages/DisplayTV";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/auth-context";
import RequireAuth from "./components/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/display" element={<DisplayTV />} />
            <Route
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/content-types" element={<ContentTypes />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/promos" element={<Promos />} />
              <Route path="/users" element={<Users />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
