import React, { useEffect, useRef, useState, ChangeEvent, FormEvent } from "react";
import { Grid, html } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import Breadcrumb from "../../components/breadcrumbs";
import Header from "../../layouts/header";
import Sidemenu from "../../layouts/sidemenu";
import axios from "axios";
import Swal from "sweetalert2";

interface Room {
  id: number;
  roomName: string;
  capacity: string;
  price: string;
  status?: string;
}

interface Tenant {
  id: number;
  tenantName: string;
  roomNo: string;
  phoneNumber: string;
  guardianName: string;
}

const Rooms_List: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    roomName: "",
    capacity: "",
    price: "",
    status: "Available",
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [viewRoomTenants, setViewRoomTenants] = useState<Tenant[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get("http://localhost:8000/api/rooms");
        setRooms(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        setError("Failed to fetch rooms. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/tenants");
        setTenants(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching tenants:", error);
      }
    };
    fetchTenants();
  }, []);

  useEffect(() => {
    if (gridRef.current && Array.isArray(rooms)) {
      gridRef.current.innerHTML = "";

      new Grid({
        columns: [
          { name: "ID", hidden: true },
          { name: "Room Number", width: "100px" },
          { name: "Capacity", width: "75px" },
          { name: "Price", width: "75px" },
          { name: "Status", width: "100px" },
          {
            name: "Actions",
            width: "150px",
            formatter: (_, row) => html(`
              <div class="flex justify-center gap-2">
                <button class="bg-blue-500 text-white px-2 py-1 rounded text-xs edit-btn" data-id="${row.cells[0].data}">
                  <i class="ri-pencil-line mr-1"></i> Edit
                </button>
                <button class="bg-cyan-500 text-white px-2 py-1 rounded text-xs view-btn" data-id="${row.cells[0].data}">
                  <i class="ri-eye-line mr-1"></i> View
                </button>
                <button class="bg-red-500 text-white px-2 py-1 rounded text-xs delete-btn" data-id="${row.cells[0].data}">
                  <i class="ri-delete-bin-line mr-1"></i> Delete
                </button>
              </div>
            `),
          },
        ],
        pagination: false, // Disable pagination to remove next page button
        search: true,
        sort: true,
        data: rooms.map((room) => [
          room.id,
          room.roomName || `Room ${room.id}`,
          room.capacity,
          room.price ? `₱${room.price}` : "",
          room.status || "Available",
        ]),
      }).render(gridRef.current);

      const addListeners = () => {
        document.querySelectorAll(".edit-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            handleEdit(Number(id));
          });
        });

        document.querySelectorAll(".view-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            handleView(Number(id));
          });
        });

        document.querySelectorAll(".delete-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            handleDelete(Number(id));
          });
        });
      };

      const timer = setTimeout(addListeners, 100);

      return () => {
        clearTimeout(timer);
        document.querySelectorAll(".edit-btn, .view-btn, .delete-btn").forEach((btn) => {
          btn?.removeEventListener("click", () => {});
        });
      };
    }
  }, [rooms]);

  useEffect(() => {
    rooms.forEach(async (room) => {
      const hiddenTenantIds = JSON.parse(localStorage.getItem('hiddenTenantIds') || '[]');
      const occupants = tenants.filter(
        (tenant) => tenant.roomNo === room.roomName && !hiddenTenantIds.includes(tenant.id)
      );
      const capacity = Number(room.capacity);

      // Debug log
      if (room.roomName === "01") {
        console.log("Room 01 occupants:", occupants.length, "Capacity:", capacity, "Status:", room.status);
      }

      // If room is full and not marked as "Occupied", update status
      if (occupants.length >= capacity && room.status !== "Occupied") {
        try {
          await axios.put(`http://localhost:8000/api/rooms/${room.id}`, {
            ...room,
            status: "Occupied",
          });
          setRooms((prev) =>
            prev.map((r) =>
              r.id === room.id ? { ...r, status: "Occupied" } : r
            )
          );
        } catch (error) {
          console.error("Error updating room status:", error);
        }
      }
      // If room is not full and not marked as "Available", update status
      else if (occupants.length < capacity && room.status !== "Available") {
        try {
          await axios.put(`http://localhost:8000/api/rooms/${room.id}`, {
            ...room,
            status: "Available",
          });
          setRooms((prev) =>
            prev.map((r) =>
              r.id === room.id ? { ...r, status: "Available" } : r
            )
          );
        } catch (error) {
          console.error("Error updating room status:", error);
        }
      }
    });
  }, [tenants, rooms]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (isEditing && currentRoomId) {
        const response = await axios.put(
          `http://localhost:8000/api/rooms/${currentRoomId}`,
          formData
        );
        setRooms(
          rooms.map((room) => (room.id === currentRoomId ? response.data : room))
        );
        window.location.reload();
      } else {
        const response = await axios.post(
          "http://localhost:8000/api/rooms",
          formData
        );
        setRooms([...rooms, response.data]);
        window.location.reload();
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving room:", error);
    }
  };

  const handleEdit = (id: number) => {
    const roomToEdit = rooms.find((room) => room.id === id);
    if (roomToEdit) {
      setFormData({
        roomName: roomToEdit.roomName,
        capacity: roomToEdit.capacity,
        price: roomToEdit.price,
        status: roomToEdit.status || "Available",
      });
      setIsEditing(true);
      setCurrentRoomId(id);
      setIsModalOpen(true);
    }
  };

  const handleView = (id: number) => {
    const room = rooms.find((room) => room.id === id);
    if (room) {
      const hiddenTenantIds = JSON.parse(localStorage.getItem('hiddenTenantIds') || '[]');
      const filteredTenants = tenants.filter(tenant => tenant.roomNo === room.roomName && !hiddenTenantIds.includes(tenant.id));
      setViewRoomTenants(filteredTenants);
      setIsViewModalOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    const room = rooms.find((room) => room.id === id);
    if (!room) return;

    const occupants = tenants.filter((tenant) => tenant.roomNo === room.roomName);

    if (occupants.length > 0) {
      await Swal.fire({
        title: "Cannot Delete Room",
        text: "This room has occupants. Please remove all tenants from this room before deleting.",
        icon: "warning",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this room?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:8000/api/rooms/${id}`);
        setRooms(rooms.filter((room) => room.id !== id));
        window.location.reload();
      } catch (error) {
        console.error("Error deleting room:", error);
        Swal.fire("Error!", "Failed to delete the room.", "error");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      roomName: "",
      capacity: "",
      price: "",
      status: "Available",
    });
    setIsEditing(false);
    setCurrentRoomId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewRoomTenants([]);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <>
      <Header />
      <Sidemenu />
      <div className="main-content app-content">
        <div className="container-fluid">
          <Breadcrumb
            title="List of Rooms"
            links={[{ text: "Dashboard", link: "/dashboard" }]}
            active="Rooms"
            buttons={
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                onClick={() => setIsModalOpen(true)}
              >
                <i className="ri-add-line"></i> Add New Room
              </button>
            }
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={closeModal}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Room" : "Add New Room"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="flex gap-4 mb-4">
                <div className="w-1/2">
                  <label className="block font-medium mb-1" htmlFor="roomName">
                    Room Number
                  </label>
                  <input
                    type="text"
                    id="roomName"
                    name="roomName"
                    value={formData.roomName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Room Number"
                    required
                  />
                </div>
                <div className="w-1/2">
                  <label className="block font-medium mb-1" htmlFor="capacity">
                    Capacity
                  </label>
                  <select
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Capacity</option>
                    {[...Array(8)].map((_, index) => (
                      <option key={index + 1} value={index + 1}>
                        {index + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="w-1/2">
                  <label className="block font-medium mb-1" htmlFor="price">
                    Price
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Price"
                    required
                  />
                </div>
                <div className="w-1/2">
                  <label className="block font-medium mb-1" htmlFor="status">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-4">
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded transition-colors"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
                >
                  {isEditing ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={closeViewModal}
            >
              <i className="bi bi-x-lg"></i>
            </button>
            <h2 className="text-xl font-bold mb-4">Room Occupants</h2>
            {viewRoomTenants.length === 0 ? (
              <p>No tenants in this room.</p>
            ) : (
              <ul>
                {viewRoomTenants.map((tenant) => (
                  <li key={tenant.id} className="mb-2">
                    <strong>{tenant.tenantName}</strong> <br />
                    Phone: {tenant.phoneNumber} <br />
                    Guardian: {tenant.guardianName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Rooms_List;
