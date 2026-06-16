import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import PostListingPage from "./pages/PostListingPage";
import MyBidsPage from "./pages/MyBidsPage";
import AgentRegisterPage from "./pages/AgentRegisterPage";
import BrowseListingsPage from "./pages/BrowseListingsPage";
import ProposalFormPage from "./pages/ProposalFormPage";
import AgentDashboardPage from "./pages/AgentDashboardPage";
import HomeownerVerifyPage from "./pages/HomeownerVerifyPage";
import AdminPage from "./pages/AdminPage";
import AgentProfilePage from "./pages/AgentProfilePage";
import AgentListingPage from "./pages/AgentListingPage";
import FaqPage from "./pages/FaqPage";
import AgentLandingPage from "./pages/AgentLandingPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"                          element={<HomePage />} />
        <Route path="/signup"                    element={<SignUpPage />} />
        <Route path="/post"                      element={<PostListingPage />} />
        <Route path="/my-bids"                   element={<MyBidsPage />} />
        <Route path="/verify"                    element={<HomeownerVerifyPage />} />
        <Route path="/admin"                     element={<AdminPage />} />
        <Route path="/agents/register"           element={<AgentRegisterPage />} />
        <Route path="/agents/browse"             element={<BrowseListingsPage />} />
        <Route path="/agents/propose/:requestId"   element={<ProposalFormPage />} />
        <Route path="/agents/listings/:requestId" element={<AgentListingPage />} />
        <Route path="/agents/dashboard"           element={<AgentDashboardPage />} />
        <Route path="/agents/profile/:agentId"   element={<AgentProfilePage />} />
        <Route path="/faq"                        element={<FaqPage />} />
        <Route path="/for-agents"                element={<AgentLandingPage />} />
      </Routes>
    </AuthProvider>
  );
}
