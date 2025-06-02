import React, { createContext, useContext, useState } from "react";

interface Payment {
    tenantName: string;
    room: string;
    amount: string;
    dueDate: string;
}

interface PaymentContextProps {
    payments: Payment[];
    addPayment: (payment: Payment) => void;
}

const PaymentContext = createContext<PaymentContextProps | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [payments, setPayments] = useState<Payment[]>([]);

    const addPayment = (payment: Payment) => {
        setPayments((prevPayments) => [...prevPayments, payment]);
    };

    return (
        <PaymentContext.Provider value={{ payments, addPayment }}>
            {children}
        </PaymentContext.Provider>
    );
};

export const usePaymentContext = () => {
    const context = useContext(PaymentContext);
    if (!context) {
        throw new Error("usePaymentContext must be used within a PaymentProvider");
    }
    return context;
};