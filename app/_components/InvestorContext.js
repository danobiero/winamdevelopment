'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const InvestorContext = createContext();

function InvestorProvider({ children }) {
  // 🔹 Core Investor State
  const [investorProfile, setInvestorProfile] = useState(null);

  // 🔹 Portfolio (shares, payments, allocations)
  const [portfolio, setPortfolio] = useState([]);

  // 🔹 UI State (selected investment card, etc.)
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  // 🔹 Loading + refresh control
  const [loading, setLoading] = useState(false);

  /**
   * Refresh portfolio data
   * (You will wire this to Supabase / API)
   */
  const refreshPortfolio = useCallback(async () => {
    try {
      setLoading(true);

      // TODO: Replace with real API call
      // const data = await getInvestorPortfolio();
      // setPortfolio(data);
    } catch (err) {
      console.error('Failed to refresh portfolio:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset all investor state (logout / session reset)
   */
  const resetInvestorState = () => {
    setInvestorProfile(null);
    setPortfolio([]);
    setSelectedInvestment(null);
  };

  return (
    <InvestorContext.Provider
      value={{
        investorProfile,
        setInvestorProfile,

        portfolio,
        setPortfolio,

        selectedInvestment,
        setSelectedInvestment,

        loading,
        refreshPortfolio,

        resetInvestorState,
      }}
    >
      {children}
    </InvestorContext.Provider>
  );
}

function useInvestor() {
  const context = useContext(InvestorContext);
  if (context === undefined) {
    throw new Error('useInvestor must be used within InvestorProvider');
  }
  return context;
}

export { InvestorProvider, useInvestor };
