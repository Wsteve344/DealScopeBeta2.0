import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { Toaster } from 'react-hot-toast';
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import PrivateRoute from './components/PrivateRoute';
import LandingPage from './components/LandingPage';
import LeadMagnet from './components/checkout/LeadMagnet';
import CheckoutPage from './components/checkout/CheckoutPage';
import ThankYou from './components/checkout/ThankYou';
import InvestorDashboard from './components/investor/InvestorDashboard';
import DealEntry from './components/investor/DealEntry';
import DealStatus from './components/investor/DealStatus';
import ViewDeal from './components/investor/ViewDeal';
import DealAnalyzer from './components/investor/DealAnalyzer';
import AnalystWorkspace from './components/analyst/AnalystWorkspace';
import DealInformationHub from './components/analyst/DealInformationHub';
import DealOverview from './components/analyst/DealOverview';
import Sourcing from './components/analyst/Sourcing';
import FinancialAnalysis from './components/analyst/FinancialAnalysis';
import RehabInspections from './components/analyst/RehabInspections';
import LegalTitle from './components/analyst/LegalTitle';
import FinancingEquity from './components/analyst/FinancingEquity';
import MarketplaceComparisons from './components/analyst/MarketplaceComparisons';
import ReviewPublish from './components/analyst/ReviewPublish';
import ContactBoard from './components/analyst/ContactBoard';
import ContactRequest from './components/analyst/ContactRequest';
import PipelineBoard from './components/analyst/PipelineBoard';
import CalendarBoard from './components/analyst/CalendarBoard';
import AdminAnalytics from './components/analyst/AdminAnalytics';
import CustomerManagement from './components/analyst/CustomerManagement';
import UserProfile from './components/profile/UserProfile';
import CreditPurchase from './components/credits/CreditPurchase';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AnalyticsProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/free-guide" element={<LeadMagnet />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/thank-you" element={<ThankYou />} />
            
            {/* Investor Routes */}
            <Route
              path="/investor/dashboard"
              element={
                <PrivateRoute requiredRole="investor">
                  <InvestorDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/investor/new-deal"
              element={
                <PrivateRoute requiredRole="investor">
                  <DealEntry />
                </PrivateRoute>
              }
            />
            <Route
              path="/investor/analyzer"
              element={
                <PrivateRoute requiredRole="investor">
                  <DealAnalyzer />
                </PrivateRoute>
              }
            />
            <Route
              path="/investor/deal/:dealId/status"
              element={
                <PrivateRoute requiredRole="investor">
                  <DealStatus />
                </PrivateRoute>
              }
            />
            <Route
              path="/investor/deal/:dealId/view"
              element={
                <PrivateRoute requiredRole="investor">
                  <ViewDeal />
                </PrivateRoute>
              }
            />

            {/* Analyst Routes */}
            <Route
              path="/analyst/*"
              element={
                <PrivateRoute requiredRole="analyst">
                  <AnalystWorkspace />
                </PrivateRoute>
              }
            >
              <Route index element={<DealInformationHub />} />
              <Route path="contacts" element={<ContactBoard />} />
              <Route path="contacts/:requestId" element={<ContactRequest />} />
              <Route path="pipeline" element={<PipelineBoard />} />
              <Route path="calendar" element={<CalendarBoard />} />
              <Route path="stats" element={<AdminAnalytics />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="deal/:dealId" element={<DealOverview />} />
              <Route path="deal/:dealId/overview" element={<DealOverview />} />
              <Route path="deal/:dealId/sourcing" element={<Sourcing />} />
              <Route path="deal/:dealId/financial" element={<FinancialAnalysis />} />
              <Route path="deal/:dealId/rehab" element={<RehabInspections />} />
              <Route path="deal/:dealId/legal" element={<LegalTitle />} />
              <Route path="deal/:dealId/financing" element={<FinancingEquity />} />
              <Route path="deal/:dealId/marketplace" element={<MarketplaceComparisons />} />
              <Route path="deal/:dealId/review" element={<ReviewPublish />} />
            </Route>

            {/* Common Routes */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <UserProfile />
                </PrivateRoute>
              }
            />
            <Route
              path="/credits/purchase"
              element={
                <PrivateRoute>
                  <CreditPurchase />
                </PrivateRoute>
              }
            />
          </Routes>
        </AnalyticsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;