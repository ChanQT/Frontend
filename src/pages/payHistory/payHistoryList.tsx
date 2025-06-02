import React, { useEffect, useRef } from "react";
import { Grid, html } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import Breadcrumb from "../../components/breadcrumbs";
import Header from "../../layouts/header";
import Sidemenu from "../../layouts/sidemenu";

const PaymentHistory_List: React.FC = () => {
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
    if (gridRef.current) {
        // Clear previous grid content to prevent double render
        gridRef.current.innerHTML = "";

        new Grid({
            columns: [
                { name: "Tenant Name", width: "200px" },
                { name: "Room", width: "150px" },
                { name: "Payment Amount", width: "150px" },
                { name: "Date", width: "150px" },
                {
                    name: "Status",
                    width: "150px",
                    formatter: (cell) =>
                        html(`
                            <div class="flex justify-center gap-2">
                                <button class="bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center">
                                    <span class="px-1">${cell}</span>
                                </button>
                            </div>
                        `),
                },
            ],
            data: () => {
                return fetch("http://localhost:8000/api/payment-histories")
                    .then(res => res.json())
                    .then(data => data.map((item: any) => [
                        item.tenant_name,
                        item.room,
                        `₱${item.payment_amount}`,
                        new Date(item.payment_date).toLocaleDateString(),
                        item.status.charAt(0).toUpperCase() + item.status.slice(1),
                    ]));
            },
        }).render(gridRef.current);
    }
}, []);

    return (
        <>
            <Header />
            <Sidemenu />
            <div className="main-content app-content">
                <div className="container-fluid">
                    <Breadcrumb
                        title="Payment History"
                        links={[{ text: "Dashboard", link: "/dashboard" }]}
                        active="History"
                    />

                    <div className="grid grid-cols-12 gap-x-6">
                        <div className="xxl:col-span-12 col-span-12">
                            <div className="box overflow-hidden main-content-card">
                                <div className="box-body p-5">
                                    <div ref={gridRef}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentHistory_List;
