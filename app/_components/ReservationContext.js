'use client';

import { createContext, useContext, useState } from 'react';

const ReservationContext = createContext();

const initialState = {
  from: undefined,
  to: undefined,
};

function ReservationProvider({ children }) {
  const [range, setRange] = useState(initialState);

  // Refactored: 'students' is now 'shareholders' to match your investor logic
  const [shareholders, setShareholders] = useState(1);

  const resetRange = () => {
    setRange(initialState);
    setShareholders(1);
  };

  return (
    <ReservationContext.Provider
      value={{
        range,
        setRange,
        resetRange,
        shareholders,
        setShareholders,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
}

function useReservation() {
  const context = useContext(ReservationContext);
  if (context === undefined)
    throw new Error('useReservation must be used within a ReservationProvider');
  return context;
}

export { ReservationProvider, useReservation };
