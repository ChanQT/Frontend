"use client"

import type React from "react"
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { Grid, html } from "gridjs"
import "gridjs/dist/theme/mermaid.css"
import Breadcrumb from "../../components/breadcrumbs"
import Header from "../../layouts/header"
import Sidemenu from "../../layouts/sidemenu"
import Swal from "sweetalert2"
import axios from "axios"

interface Room {
  id: number
  roomName: string
  capacity: string
  price?: string
  status?: string
}

interface Tenant {
  id: number
  tenantName: string
  roomNo: string
  phoneNumber: string
  guardianName: string
  startDate?: string
}

interface HiddenTenantData {
  id: number
  dateRemoved: string
}

const getCurrentDueDate = (startDate?: string, paymentHistories: any[] = []) => {
  if (!startDate) return "-"

  const start = new Date(startDate)
  const today = new Date()

  // Calculate how many months have passed since start date
  const monthsSinceStart = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth())

  // Calculate the current billing period
  const currentPeriodStart = new Date(start)
  currentPeriodStart.setMonth(start.getMonth() + monthsSinceStart)

  const currentPeriodEnd = new Date(start)
  currentPeriodEnd.setMonth(start.getMonth() + monthsSinceStart + 1)

  // Check if we've passed the due date for current month
  let dueDateMonth = monthsSinceStart
  if (today.getDate() >= start.getDate() && today >= currentPeriodStart) {
    dueDateMonth = monthsSinceStart + 1
  }

  // Check if payment was made for the current/upcoming billing period
  const hasRecentPayment = paymentHistories.some((payment: any) => {
    const paymentDate = new Date(payment.payment_date)
    const paymentPeriodStart = new Date(start)
    paymentPeriodStart.setMonth(start.getMonth() + dueDateMonth - 1)
    const paymentPeriodEnd = new Date(start)
    paymentPeriodEnd.setMonth(start.getMonth() + dueDateMonth)

    return paymentDate >= paymentPeriodStart && paymentDate < paymentPeriodEnd && payment.status === "paid"
  })

  // If payment was made, move due date to next month
  if (hasRecentPayment) {
    dueDateMonth += 1
  }

  // Calculate the actual due date
  const dueDate = new Date(start)
  dueDate.setMonth(start.getMonth() + dueDateMonth)

  // Handle edge case where the day doesn't exist in the target month (e.g., Jan 31 -> Feb 31)
  if (dueDate.getDate() !== start.getDate()) {
    dueDate.setDate(0) // Set to last day of previous month
  }

  return dueDate.toLocaleDateString()
}

const Tenants_List: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null)
  const [tableData, setTableData] = useState<Tenant[]>([])
  const [paymentHistories, setPaymentHistories] = useState<any[]>([])
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [newTenantData, setNewTenantData] = useState({
    tenantName: "",
    roomNo: "",
    phoneNumber: "",
    guardianName: "",
    startDate: "",
  })
  const [editTenantData, setEditTenantData] = useState({
    tenantName: "",
    roomNo: "",
    phoneNumber: "",
    guardianName: "",
    startDate: "",
  })
  const [rooms, setRooms] = useState<Room[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [originalTableData, setOriginalTableData] = useState<Tenant[]>([])
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<string>("")
  const [allTenants, setAllTenants] = useState<Tenant[]>([])
  const [reportSortBy, setReportSortBy] = useState<string>("")
  const [reportSearch, setReportSearch] = useState<string>("")

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/tenants")
        if (response.data && response.data.length > 0) {
          setAllTenants(response.data)
          const hiddenTenantIds = JSON.parse(localStorage.getItem("hiddenTenantIds") || "[]")
          const filteredData = response.data.filter((tenant: Tenant) => !hiddenTenantIds.includes(tenant.id))
          setTableData(filteredData)
          setOriginalTableData(filteredData)
        } else {
          setAllTenants([])
          setTableData([])
          setOriginalTableData([])
          Swal.fire({
            title: "No Records Found",
            text: "No matching tenant records were found.",
            icon: "info",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "OK",
          })
        }
      } catch (error: any) {
        console.error("Error fetching tenants:", error)
        Swal.fire({
          title: "Error!",
          text: error.response?.data?.message || "Failed to fetch tenants.",
          icon: "error",
          confirmButtonColor: "#d33",
          confirmButtonText: "OK",
        })
      }
    }
    fetchTenants()
  }, [])

  useEffect(() => {
    const fetchPaymentHistories = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/payment-histories")
        setPaymentHistories(Array.isArray(response.data) ? response.data : [])
      } catch (error: any) {
        console.error("Error fetching payment histories:", error)
        setPaymentHistories([])
      }
    }
    fetchPaymentHistories()
  }, [])

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/rooms")
        setRooms(Array.isArray(response.data) ? response.data : [])
      } catch (error: any) {
        console.error("Error fetching rooms:", error)
        Swal.fire({
          title: "Error!",
          text: error.response?.data?.message || "Failed to fetch rooms.",
          icon: "error",
          confirmButtonColor: "#d33",
          confirmButtonText: "OK",
        })
      }
    }
    fetchRooms()
  }, [])

  const filteredTableData = searchTerm.trim()
    ? [...tableData].filter(
        (tenant) =>
          tenant.tenantName.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
          tenant.roomNo.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
          tenant.phoneNumber.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
          tenant.guardianName.toLowerCase().includes(searchTerm.trim().toLowerCase()),
      )
    : originalTableData

  const getSortedTableData = () => {
    const data = [...tableData]
    if (sortBy === "name") {
      data.sort((a, b) => a.tenantName.localeCompare(b.tenantName))
    } else if (sortBy === "room") {
      data.sort((a, b) => a.roomNo.localeCompare(b.roomNo))
    } else if (sortBy === "startDate") {
      data.sort((a, b) => {
        if (!a.startDate) return 1
        if (!b.startDate) return -1
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      })
    }
    return data
  }

  const sortedTableData = getSortedTableData()

  useEffect(() => {
    if (gridRef.current && Array.isArray(tableData)) {
      gridRef.current.innerHTML = ""

      if (filteredTableData.length > 0) {
        new Grid({
          columns: [
            { name: "Tenants Name", width: "200px" },
            { name: "Room No.", width: "120px" },
            { name: "Phone Number", width: "120px" },
            { name: "Guardian Name", width: "200px" },
            {
              name: "Actions",
              width: "120px",
              formatter: (_, row) =>
                html(`
                  <div class="flex justify-center gap-2">
                    <button class="bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center edit-tenant-btn" data-id="${row.cells[4].data}">
                      <i class="ri-pencil-line mr-1"></i>
                    </button>
                    <button class="bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center make-payment-btn" data-id="${row.cells[4].data}">
                      <i class="ri-cash-line mr-1"></i>
                    </button>
                  </div>
                `),
            },
          ],
          search: false,
          data: filteredTableData.map((tenant) => [
            tenant.tenantName,
            tenant.roomNo,
            tenant.phoneNumber,
            tenant.guardianName,
            tenant.id,
          ]),
        }).render(gridRef.current)
      } else {
        gridRef.current.innerHTML = "<p>No tenants found.</p>"
      }

      const addListeners = () => {
        document.querySelectorAll(".edit-tenant-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id")
            handleEditButtonClick(Number(id))
          })
        })

        document.querySelectorAll(".make-payment-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id")
            const tenant = tableData.find((t) => t.id === Number(id))
            if (tenant) handleMakePayment(tenant)
          })
        })
      }

      const timer = setTimeout(addListeners, 100)

      return () => {
        clearTimeout(timer)
        document.querySelectorAll(".edit-tenant-btn, .make-payment-btn").forEach((btn) => {
          btn?.removeEventListener("click", () => {})
        })
      }
    }
  }, [filteredTableData])

  const handleMakePayment = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setIsPaymentModalOpen(true)
  }

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false)
    setSelectedTenant(null)
    setPaymentAmount("")
  }

  const handleSubmitPayment = async () => {
    if (selectedTenant && paymentAmount) {
      try {
        const paymentData = {
          tenant_name: selectedTenant.tenantName,
          room: selectedTenant.roomNo,
          payment_amount: Number.parseFloat(paymentAmount),
          payment_date: new Date().toISOString().slice(0, 19).replace("T", " "),
          status: "paid",
        }

        const response = await axios.post("http://localhost:8000/api/payment-histories", paymentData)

        if (response.status === 201 || response.status === 200) {
          // Fetch updated payment histories
          const paymentsResponse = await axios.get("http://localhost:8000/api/payment-histories")
          setPaymentHistories(Array.isArray(paymentsResponse.data) ? paymentsResponse.data : [])

          Swal.fire({
            title: "Payment Successful!",
            text: `Payment of ₱${paymentAmount} has been made for ${selectedTenant.tenantName}. Due date has been updated.`,
            icon: "success",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "OK",
          })
          closePaymentModal()
        }
      } catch (error: any) {
        console.error("Error submitting payment:", error)
        Swal.fire({
          title: "Error!",
          text: error.response?.data?.message || "Failed to process payment.",
          icon: "error",
          confirmButtonColor: "#d33",
          confirmButtonText: "OK",
        })
      }
    } else {
      Swal.fire({
        title: "Error!",
        text: "Please enter a valid payment amount.",
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      })
    }
  }

  const formatPhoneNumber = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 11)
  }

  const isValidPhoneNumber = (value: string) => {
    return /^09\d{9}$/.test(value)
  }

  const handleAddTenantChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target
    if (name === "phoneNumber") {
      value = formatPhoneNumber(value)
    }
    setNewTenantData({ ...newTenantData, [name]: value })
  }

  const handleAddTenantSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!isValidPhoneNumber(newTenantData.phoneNumber)) {
      Swal.fire({
        title: "Invalid Phone Number",
        text: "Please enter a valid 11-digit number (e.g., 09171234567).",
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      })
      return
    }

    const selectedRoom = rooms.find((room) => room.roomName === newTenantData.roomNo)
    if (!selectedRoom) {
      Swal.fire({
        title: "Room Not Found",
        text: "Please select a valid room.",
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      })
      return
    }

    const tenantsInRoom = tableData.filter((tenant) => tenant.roomNo === selectedRoom.roomName).length
    const roomCapacity = Number(selectedRoom.capacity)

    if (tenantsInRoom >= roomCapacity) {
      await Swal.fire({
        title: "Room Full",
        text: `Room ${selectedRoom.roomName} has reached its capacity of ${roomCapacity}.`,
        icon: "warning",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      })
      return
    }

    try {
      const response = await axios.post("http://localhost:8000/api/tenants", newTenantData)
      const updatedTableData = [...tableData, response.data]
      setTableData(updatedTableData)

      const tenantsInRoomAfter = updatedTableData.filter((tenant) => tenant.roomNo === selectedRoom.roomName).length

      if (tenantsInRoomAfter >= roomCapacity && selectedRoom.status !== "Occupied") {
        await axios.put(`http://localhost:8000/api/rooms/${selectedRoom.id}`, {
          ...selectedRoom,
          status: "Occupied",
        })
      }

      setIsAddTenantModalOpen(false)
      setNewTenantData({
        tenantName: "",
        roomNo: "",
        phoneNumber: "",
        guardianName: "",
        startDate: "",
      })
      window.location.reload()
    } catch (error) {
      console.error("Error adding tenant:", error)
      Swal.fire({
        title: "Error!",
        text: "Failed to add tenant.",
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      })
    }
  }

  const handleEditTenantChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target
    if (name === "phoneNumber") {
      value = formatPhoneNumber(value)
    }
    setEditTenantData({ ...editTenantData, [name]: value })
  }

  const handleEditButtonClick = (id: number) => {
    const tenantToEdit = tableData.find((tenant) => tenant.id === id)
    if (tenantToEdit) {
      setSelectedTenant(tenantToEdit)
      setEditTenantData({
        tenantName: tenantToEdit.tenantName,
        roomNo: tenantToEdit.roomNo,
        phoneNumber: tenantToEdit.phoneNumber,
        guardianName: tenantToEdit.guardianName,
        startDate: tenantToEdit.startDate || "",
      })
      setIsEditModalOpen(true)
    }
  }

  const handleEditTenantSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!isValidPhoneNumber(editTenantData.phoneNumber)) {
      Swal.fire({
        title: "Invalid Phone Number",
        text: "Please enter a valid 11-digit number (e.g., 09171234567).",
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      })
      return
    }

    try {
      if (selectedTenant) {
        const response = await axios.put(`http://localhost:8000/api/tenants/${selectedTenant.id}`, editTenantData)
        setTableData(tableData.map((tenant) => (tenant.id === selectedTenant.id ? response.data : tenant)))
        Swal.fire({
          title: "Success!",
          text: `Tenant "${editTenantData.tenantName}" updated successfully!`,
          icon: "success",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "OK",
        })
        setIsEditModalOpen(false)
        setSelectedTenant(null)
        window.location.reload()
      }
    } catch (error) {
      console.error("Error updating tenant:", error)
      Swal.fire({
        title: "Error!",
        text: "Failed to update tenant.",
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      })
    }
  }

  const handleRemoveButtonClick = async (id: number) => {
    const tenantToRemove = tableData.find((tenant) => tenant.id === id)
    if (!tenantToRemove) return

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to remove this tenant from the list?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "Cancel",
    })

    if (result.isConfirmed) {
      try {
        const hiddenTenantIds = JSON.parse(localStorage.getItem("hiddenTenantIds") || "[]")
        if (!hiddenTenantIds.includes(id)) {
          hiddenTenantIds.push(id)
          localStorage.setItem("hiddenTenantIds", JSON.stringify(hiddenTenantIds))
        }

        const hiddenTenantData = JSON.parse(localStorage.getItem("hiddenTenantData") || "[]")
        if (!hiddenTenantData.some((item: HiddenTenantData) => item.id === id)) {
          hiddenTenantData.push({
            id: id,
            dateRemoved: new Date().toISOString().split("T")[0],
          })
          localStorage.setItem("hiddenTenantData", JSON.stringify(hiddenTenantData))
        }

        const updatedTableData = tableData.filter((tenant) => tenant.id !== id)
        setTableData(updatedTableData)

        const room = rooms.find((room) => room.roomName === tenantToRemove.roomNo)
        if (room) {
          const roomCapacity = Number(room.capacity)
          const tenantsInRoom = updatedTableData.filter((tenant) => tenant.roomNo === room.roomName).length

          if (tenantsInRoom < roomCapacity && room.status !== "Available") {
            await axios.put(`http://localhost:8000/api/rooms/${room.id}`, {
              ...room,
              status: "Available",
            })
          }
        }

        Swal.fire({
          title: "Removed!",
          text: "The tenant has been removed from the list.",
          icon: "success",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "OK",
        })
      } catch (error) {
        console.error("Error removing tenant from the list:", error)
        Swal.fire({
          title: "Error!",
          text: "Failed to remove tenant from the list.",
          icon: "error",
          confirmButtonColor: "#d33",
          confirmButtonText: "OK",
        })
      }
    }
  }

  return (
    <>
      <Header />
      <Sidemenu />
      <div className="main-content app-content">
        <div className="container-fluid">
          <Breadcrumb
            title="Tenants"
            links={[{ text: "Dashboard", link: "/dashboard" }]}
            active="Tenants"
            buttons={
              <div className="flex gap-2">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                  onClick={() => setIsAddTenantModalOpen(true)}
                >
                  <i className="ri-add-line"></i> Add New Tenant
                </button>
                <button
                  className="bg-purple-500 hover:bg-purple-700 text-white px-2 py-2 rounded flex items-center text-xs"
                  style={{ height: "40px" }}
                  onClick={() => setIsReportModalOpen(true)}
                  title="Generate Report"
                >
                  <i className="ri-file-chart-line text-base"></i>
                </button>
              </div>
            }
          />
          <div className="box overflow-x-auto main-content-card mt-6">
            <div className="box-header p-5 bg-gray-100 border-b">
              <h3 className="font-bold text-xl text-blue-700">Tenants List</h3>
            </div>
            <div className="box-body p-6">
              <div className="flex items-center mb-4">
                <label htmlFor="sortBy" className="mr-2 font-medium">
                  Sort by:
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border rounded px-2 py-1"
                  style={{ minWidth: 150 }}
                >
                  <option value="">Default</option>
                  <option value="name">Name</option>
                  <option value="room">Room</option>
                  <option value="startDate">Start Date</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm mb-4">
                  <thead>
                    <tr>
                      <th className="border px-2 py-2">Tenant Name</th>
                      <th className="border px-2 py-2">Room No.</th>
                      <th className="border px-2 py-2">Phone</th>
                      <th className="border px-2 py-2">Guardian</th>
                      <th className="border px-2 py-2">Start Date</th>
                      <th className="border px-2 py-2">Due Date</th>
                      <th className="border px-2 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTableData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-2">
                          No tenants
                        </td>
                      </tr>
                    ) : (
                      sortedTableData.map((tenant) => {
                        const tenantPayments = paymentHistories.filter(
                          (p: any) => p.tenant_name === tenant.tenantName && p.room === tenant.roomNo,
                        )
                        return (
                          <tr key={tenant.id}>
                            <td className="border px-2 py-2">{tenant.tenantName}</td>
                            <td className="border px-2 py-2">{tenant.roomNo}</td>
                            <td className="border px-2 py-2">{tenant.phoneNumber}</td>
                            <td className="border px-2 py-2">{tenant.guardianName}</td>
                            <td className="border px-2 py-2">
                              {tenant.startDate ? new Date(tenant.startDate).toLocaleDateString() : "-"}
                            </td>
                            <td className="border px-2 py-2">{getCurrentDueDate(tenant.startDate, tenantPayments)}</td>
                            <td className="border px-2 py-2">
                              <div className="flex flex-wrap gap-1 items-center">
                                <button
                                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                                  onClick={() => handleEditButtonClick(tenant.id)}
                                  style={{ minWidth: "28px", minHeight: "28px" }}
                                >
                                  <i className="ri-pencil-line"></i>
                                </button>
                                <button
                                  className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                                  onClick={() => handleMakePayment(tenant)}
                                  style={{ minWidth: "28px", minHeight: "28px" }}
                                >
                                  <i className="ri-cash-line"></i>
                                </button>
                                <button
                                  className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                                  onClick={() => handleRemoveButtonClick(tenant.id)}
                                  style={{ minWidth: "28px", minHeight: "28px" }}
                                >
                                  <i className="ri-delete-bin-line"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Make a Payment</h2>
            {selectedTenant && (
              <div>
                <p>
                  <strong>Tenant Name:</strong> {selectedTenant.tenantName}
                </p>
                <p>
                  <strong>Room:</strong> {selectedTenant.roomNo}
                </p>
                <p>
                  <strong>Current Due Date:</strong>{" "}
                  {getCurrentDueDate(
                    selectedTenant.startDate,
                    paymentHistories.filter(
                      (p) => p.tenant_name === selectedTenant.tenantName && p.room === selectedTenant.roomNo,
                    ),
                  )}
                </p>
              </div>
            )}
            <div className="mt-4">
              <label className="block font-medium mb-1" htmlFor="paymentAmount">
                Payment Amount
              </label>
              <input
                type="number"
                id="paymentAmount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none"
                placeholder="Enter payment amount"
                required
              />
            </div>
            <div className="flex justify-between mt-4">
              <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleSubmitPayment}>
                Submit Payment
              </button>
              <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={closePaymentModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddTenantModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setIsAddTenantModalOpen(false)}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            <h2 className="text-xl font-bold mb-4">Add New Tenant</h2>
            <form onSubmit={handleAddTenantSubmit}>
              <div className="flex gap-4 mb-4">
                <div className="w-1/2">
                  <label className="block font-medium mb-1" htmlFor="tenantName">
                    Tenant Name
                  </label>
                  <input
                    type="text"
                    id="tenantName"
                    name="tenantName"
                    value={newTenantData.tenantName}
                    onChange={handleAddTenantChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none"
                    placeholder="Enter Tenant Name"
                    required
                  />
                </div>
                <div className="w-1/2">
                  <label className="block font-medium mb-1" htmlFor="roomNo">
                    Room No.
                  </label>
                  <select
                    id="roomNo"
                    name="roomNo"
                    value={newTenantData.roomNo}
                    onChange={handleAddTenantChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none"
                    required
                  >
                    <option value="" disabled>
                      Select Room No.
                    </option>
                    {rooms
                      .filter((room) => room.status === "Available")
                      .map((room) => (
                        <option key={room.id} value={room.roomName}>
                          {room.roomName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="w-1/2">
                  <label className="block font-medium mb-1" htmlFor="phoneNumber">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={newTenantData.phoneNumber}
                    onChange={handleAddTenantChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none"
                    placeholder="Enter 11-digit Phone Number (e.g. 09171234567)"
                    maxLength={11}
                    required
                  />
                </div>
                <div className="w-1/2">
                  <label className="block font-medium mb-1" htmlFor="guardianName">
                    Guardian Name
                  </label>
                  <input
                    type="text"
                    id="guardianName"
                    name="guardianName"
                    value={newTenantData.guardianName}
                    onChange={handleAddTenantChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none"
                    placeholder="Enter Guardian Name"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-1" htmlFor="startDate">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={newTenantData.startDate}
                  onChange={handleAddTenantChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  className="bg-gray-300 px-4 py-2 rounded"
                  onClick={() => setIsAddTenantModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditModalOpen(false)}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            <h2 className="text-xl font-bold mb-4">Edit Tenant</h2>
            <form onSubmit={handleEditTenantSubmit}>
              <div className="flex gap-4 mb-4">
                <div className="w-1/2">
                  <label className="block font-medium mb-1" htmlFor="tenantName">
                    Tenant Name
                  </label>
                  <input
                    type="text"
                    id="tenantName"
                    name="tenantName"
                    value={editTenantData.tenantName}
                    onChange={handleEditTenantChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none"
                    placeholder="Enter Tenant Name"
                    required
                  />
                </div>
                <div className="w-1/2">
                  <label className="block font-medium mb-1" htmlFor="roomNo">
                    Room No.
                  </label>
                  <select
                    id="roomNo"
                    name="roomNo"
                    value={editTenantData.roomNo}
                    onChange={handleEditTenantChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none"
                    required
                  >
                    <option value="" disabled>
                      Select Room No.
                    </option>
                    {rooms
                      .filter((room) => room.status === "Available" || room.roomName === editTenantData.roomNo)
                      .map((room) => (
                        <option key={room.id} value={room.roomName}>
                          {room.roomName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="w-1/2">
                  <label className="block font-medium mb-1" htmlFor="phoneNumber">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={editTenantData.phoneNumber}
                    onChange={handleEditTenantChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none"
                    placeholder="Enter 11-digit Phone Number (e.g. 09171234567)"
                    maxLength={11}
                    required
                  />
                </div>
                <div className="w-1/2">
                  <label className="block font-medium mb-1" htmlFor="guardianName">
                    Guardian Name
                  </label>
                  <input
                    type="text"
                    id="guardianName"
                    name="guardianName"
                    value={editTenantData.guardianName}
                    onChange={handleEditTenantChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none"
                    placeholder="Enter Guardian Name"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-1" htmlFor="startDate">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={editTenantData.startDate}
                  onChange={handleEditTenantChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  className="bg-gray-300 px-4 py-2 rounded"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReportModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsReportModalOpen(false)
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-2 relative"
            style={{ maxHeight: "90vh", overflowY: "auto" }} // Make modal scrollable
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsReportModalOpen(false)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
            <h2 className="text-base font-bold mb-2">Tenant Report</h2>
            <div className="mb-2 flex items-center gap-2">
              <label htmlFor="reportSortBy" className="font-medium text-xs">
                Sort by:
              </label>
              <select
                id="reportSortBy"
                value={reportSortBy}
                onChange={(e) => setReportSortBy(e.target.value)}
                className="border rounded px-1 py-0.5 text-xs"
              >
                <option value="">Default</option>
                <option value="name">Name</option>
                <option value="room">Room</option>
                <option value="startDate">Start Date</option>
              </select>
              <input
                type="text"
                placeholder="Search name"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="border rounded px-1 py-0.5 ml-2 text-xs"
                style={{ minWidth: 80 }}
              />
            </div>
            <div className="mb-3">
              <h3 className="font-semibold mb-1 text-green-700 text-xs">Active Tenants</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-[11px] mb-2">
                  <thead>
                    <tr>
                      <th className="border px-1 py-1">Name</th>
                      <th className="border px-1 py-1">Room</th>
                      <th className="border px-1 py-1">Phone</th>
                      <th className="border px-1 py-1">Guardian</th>
                      <th className="border px-1 py-1">Start</th>
                      <th className="border px-1 py-1">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const hiddenTenantIds = JSON.parse(localStorage.getItem("hiddenTenantIds") || "[]")
                      let filtered = allTenants.filter((t) => !hiddenTenantIds.includes(t.id))
                      if (reportSearch.trim()) {
                        filtered = filtered.filter((t) =>
                          t.tenantName.toLowerCase().includes(reportSearch.trim().toLowerCase()),
                        )
                      }
                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="text-center py-1">
                              No tenants found.
                            </td>
                          </tr>
                        )
                      }
                      return filtered
                        .sort((a, b) => {
                          if (reportSortBy === "name") {
                            return a.tenantName.localeCompare(b.tenantName)
                          } else if (reportSortBy === "room") {
                            return a.roomNo.localeCompare(b.roomNo)
                          } else if (reportSortBy === "startDate") {
                            if (!a.startDate) return 1
                            if (!b.startDate) return -1
                            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                          }
                          return 0
                        })
                        .map((tenant) => {
                          const tenantPayments = paymentHistories.filter(
                            (p: any) => p.tenant_name === tenant.tenantName && p.room === tenant.roomNo,
                          )
                          return (
                            <tr key={tenant.id}>
                              <td className="border px-1 py-1">{tenant.tenantName}</td>
                              <td className="border px-1 py-1">{tenant.roomNo}</td>
                              <td className="border px-1 py-1">{tenant.phoneNumber}</td>
                              <td className="border px-1 py-1">{tenant.guardianName}</td>
                              <td className="border px-1 py-1">
                                {tenant.startDate ? new Date(tenant.startDate).toLocaleDateString() : "-"}
                              </td>
                              <td className="border px-1 py-1">
                                {getCurrentDueDate(tenant.startDate, tenantPayments)}
                              </td>
                            </tr>
                          )
                        })
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-red-700 text-xs">Removed Tenants</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-[11px]">
                  <thead>
                    <tr>
                      <th className="border px-1 py-1">Name</th>
                      <th className="border px-1 py-1">Room</th>
                      <th className="border px-1 py-1">Phone</th>
                      <th className="border px-1 py-1">Guardian</th>
                      <th className="border px-1 py-1">Start</th>
                      <th className="border px-1 py-1">Date Removed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const hiddenTenantData: HiddenTenantData[] = JSON.parse(
                        localStorage.getItem("hiddenTenantData") || "[]",
                      )
                      let filtered = allTenants.filter((t) => hiddenTenantData.some((hidden) => hidden.id === t.id))
                      if (reportSearch.trim()) {
                        filtered = filtered.filter((t) =>
                          t.tenantName.toLowerCase().includes(reportSearch.trim().toLowerCase()),
                        )
                      }
                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="text-center py-1">
                              No removed tenants found.
                            </td>
                          </tr>
                        )
                      }
                      return filtered
                        .sort((a, b) => {
                          if (reportSortBy === "name") {
                            return a.tenantName.localeCompare(b.tenantName)
                          } else if (reportSortBy === "room") {
                            return a.roomNo.localeCompare(b.roomNo)
                          } else if (reportSortBy === "startDate") {
                            if (!a.startDate) return 1
                            if (!b.startDate) return -1
                            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                          }
                          return 0
                        })
                        .map((tenant) => {
                          const hiddenData = hiddenTenantData.find((hidden) => hidden.id === tenant.id)
                          return (
                            <tr key={tenant.id}>
                              <td className="border px-1 py-1">{tenant.tenantName}</td>
                              <td className="border px-1 py-1">{tenant.roomNo}</td>
                              <td className="border px-1 py-1">{tenant.phoneNumber}</td>
                              <td className="border px-1 py-1">{tenant.guardianName}</td>
                              <td className="border px-1 py-1">
                                {tenant.startDate ? new Date(tenant.startDate).toLocaleDateString() : "-"}
                              </td>
                              <td className="border px-1 py-1">
                                {hiddenData && hiddenData.dateRemoved
                                  ? new Date(hiddenData.dateRemoved).toLocaleDateString()
                                  : "-"}
                              </td>
                            </tr>
                          )
                        })
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Tenants_List
