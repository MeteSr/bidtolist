import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import PostListingPage from "./pages/PostListingPage";
import MyBidsPage from "./pages/MyBidsPage";
import AgentRegisterPage from "./pages/AgentRegisterPage";
import BrowseListingsPage from "./pages/BrowseListingsPage";
import ProposalFormPage from "./pages/ProposalFormPage";
import AgentDashboardPage from "./pages/AgentDashboardPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"                   element={<HomePage />} />
        <Route path="/post"               element={<PostListingPage />} />
        <Route path="/my-bids"            element={<MyBidsPage />} />
        <Route path="/agents/register"    element={<AgentRegisterPage />} />
        <Route path="/agents/browse"      element={<BrowseListingsPage />} />
        <Route path="/agents/propose/:requestId" element={<ProposalFormPage />} />
        <Route path="/agents/dashboard"   element={<AgentDashboardPage />} />
      </Routes>
    </AuthProvider>
  );
}
