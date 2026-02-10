'use client';
import { createContext, useContext, useState } from 'react';

const ReservationContext = createContext();

const today = new Date();

const initialState = {
  from: undefined,
  to: undefined,
  month: today, // initial focus for DayPicker
  student: 1
};

function ReservationProvider({ children }) {
  const [range, setRange] = useState(initialState);
  const [students, setStudents] = useState(1)

  const resetRange = () => setRange(initialState);

  return (
    <ReservationContext.Provider value={{ range, setRange, resetRange, students, setStudents }}>
      {children}
    </ReservationContext.Provider>
  );
}

function useReservation() {
  const context = useContext(ReservationContext);
  if (context === undefined)
    throw new Error('Context was used outside provider');
  return context;
}

export { ReservationProvider, useReservation };
