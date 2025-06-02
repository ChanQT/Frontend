"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import Breadcrumb from "../components/breadcrumbs"
import Header from "../layouts/header"
import Sidemenu from "../layouts/sidemenu"

// Add this import for Remix Icons if not already included
// import "remixicon/fonts/remixicon.css";

interface TenantNearDue {
  tenantName: string
  roomNo: string
  phoneNumber: string
  guardianName: string
  startDate?: string
  dueDate: string
}

function Dashboard() {
  const [totalTenants, setTotalTenants] = useState(0)
  const [totalRooms, setTotalRooms] = useState(0)
  const [monthlyRevenue, setMonthlyRevenue] = useState("₱0.00")
  const [nearDueTenants, setNearDueTenants] = useState<TenantNearDue[]>([])

  useEffect(() => {
    let tenantsData: any[] = []
    let paymentHistories: any[] = []

    // Fetch tenants and payment histories in parallel
    Promise.all([
      axios.get("http://localhost:8000/api/tenants"),
      axios.get("http://localhost:8000/api/payment-histories"),
      axios.get("http://localhost:8000/api/rooms"),
    ])
      .then(([tenantsRes, paymentsRes, roomsRes]) => {
        tenantsData = Array.isArray(tenantsRes.data) ? tenantsRes.data : []
        paymentHistories = Array.isArray(paymentsRes.data) ? paymentsRes.data : []

        setTotalTenants(tenantsData.length)
        setTotalRooms(Array.isArray(roomsRes.data) ? roomsRes.data.length : 0)

        // Monthly Revenue
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        const monthlyTotal = paymentHistories
          .filter((item: any) => {
            const date = new Date(item.payment_date)
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear
          })
          .reduce((sum: number, item: any) => sum + Number(item.payment_amount), 0)
        setMonthlyRevenue(
          `₱${monthlyTotal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        )

        // Due Date Logic
        const today = new Date()
        const soon = 7 // days before due date
        const dueTenants: TenantNearDue[] = tenantsData
          .filter((tenant: any) => {
            if (!tenant.startDate) return false
            const start = new Date(tenant.startDate)

            // Calculate how many 30-day periods have passed since start
            const msInDay = 1000 * 60 * 60 * 24
            const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / msInDay)
            const periodsPassed = Math.floor(daysSinceStart / 30)

            // Current due period
            const lastDueDate = new Date(start)
            lastDueDate.setDate(start.getDate() + periodsPassed * 30)
            const dueDate = new Date(start)
            dueDate.setDate(start.getDate() + (periodsPassed + 1) * 30)

            const diff = (dueDate.getTime() - today.getTime()) / msInDay
            if (!(diff >= 0 && diff <= soon)) return false

            // Check if tenant has already paid for this due period
            const hasPaid = paymentHistories.some((payment: any) => {
              return (
                payment.tenant_name === tenant.tenantName &&
                payment.room === tenant.roomNo &&
                new Date(payment.payment_date) > lastDueDate &&
                new Date(payment.payment_date) <= dueDate &&
                payment.status === "paid"
              )
            })
            return !hasPaid
          })
          .map((tenant: any) => {
            const start = new Date(tenant.startDate)
            const msInDay = 1000 * 60 * 60 * 24
            const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / msInDay)
            const periodsPassed = Math.floor(daysSinceStart / 30)
            const dueDate = new Date(start)
            dueDate.setDate(start.getDate() + (periodsPassed + 1) * 30)

            return {
              tenantName: tenant.tenantName,
              roomNo: tenant.roomNo,
              phoneNumber: tenant.phoneNumber,
              guardianName: tenant.guardianName,
              startDate: tenant.startDate,
              dueDate: dueDate.toLocaleDateString(),
            }
          })

        setNearDueTenants(dueTenants)
      })
      .catch(() => {
        setTotalTenants(0)
        setTotalRooms(0)
        setMonthlyRevenue("₱0.00")
        setNearDueTenants([])
      })
  }, [])

  return (
    <>
      <Header />
      <Sidemenu />
      <div className="main-content app-content">
        <div className="container-fluid">
          <Breadcrumb />
          <div className="grid grid-cols-12 gap-6">
            {/* Total Tenants */}
            <div className="col-span-12 md:col-span-3">
              <Link to="/tenants information">
                <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-black-500 cursor-pointer hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-700" style={{ color: "Green" }}>
                    Total of Boarders
                  </h3>
                  <p className="text-3xl font-bold text-black-600 mt-2">{totalTenants}</p>
                </div>
              </Link>
            </div>

            {/* Available Rooms */}
            <div className="col-span-12 md:col-span-3">
              <Link to="/rooms information">
                <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-black-500 cursor-pointer hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-700" style={{ color: "Blue" }}>
                    Total Rooms
                  </h3>
                  <p className="text-3xl font-bold text-black-600 mt-2">{totalRooms}</p>
                </div>
              </Link>
            </div>

            {/* Monthly Revenue */}
            <div className="col-span-12 md:col-span-4">
              <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-yellow-500">
                <h3 className="text-lg font-semibold text-gray-700" style={{ color: "orange" }}>
                  Monthly Revenue
                </h3>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{monthlyRevenue}</p>
              </div>
            </div>
          </div>

          {/* Tenants Due Date - enhanced version */}
          <div className="mt-8">
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-red-700 flex items-center gap-2">
                  <i className="ri-alarm-warning-line"></i>
                  Upcoming Due Dates
                  {nearDueTenants.length > 0 && (
                    <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                      {nearDueTenants.length}
                    </span>
                  )}
                </h3>
                {nearDueTenants.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <i className="ri-information-line mr-1"></i>
                    Payments due within 7 days
                  </div>
                )}
              </div>

              {nearDueTenants.length === 0 ? (
                <div className="text-center py-8">
                  <i className="ri-check-double-line text-4xl text-green-500 mb-2"></i>
                  <p className="text-lg font-medium text-green-700">All caught up!</p>
                  <p className="text-sm text-gray-500 mt-1">No tenants with upcoming due dates.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Tenant Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Room
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Phone Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Guardian
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Start Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Due Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Days Left
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {nearDueTenants.map((tenant, idx) => {
                        const daysLeft = Math.ceil(
                          (new Date(tenant.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                        )
                        const isUrgent = daysLeft <= 2
                        const isWarning = daysLeft <= 5 && daysLeft > 2

                        return (
                          <tr key={tenant.tenantName + idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{tenant.tenantName}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                {tenant.roomNo}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <a href={`tel:${tenant.phoneNumber}`} className="text-blue-600 hover:text-blue-800">
                                {tenant.phoneNumber}
                              </a>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{tenant.guardianName}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {tenant.startDate ? new Date(tenant.startDate).toLocaleDateString() : "-"}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{tenant.dueDate}</td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isUrgent
                                    ? "bg-red-100 text-red-800"
                                    : isWarning
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                                }`}
                              >
                                {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  isUrgent
                                    ? "bg-red-100 text-red-800"
                                    : isWarning
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
                                    isUrgent ? "bg-red-400" : isWarning ? "bg-yellow-400" : "bg-orange-400"
                                  }`}
                                ></span>
                                {isUrgent ? "Urgent" : isWarning ? "Warning" : "Due Soon"}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              
              
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
