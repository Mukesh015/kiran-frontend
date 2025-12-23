import { useEffect, useState } from "react";
import { X, Check, Edit2 } from "lucide-react";

/* ======================
   TYPES
====================== */

interface User {
    id: number;
    name: string;
    phone: string;
}

interface ApiListResponse {
    ok: boolean;
    data: User[];
}

interface ApiUpdateResponse {
    ok: boolean;
    message?: string;
}

interface EditMembersModalProps {
    openModal: boolean;
    setOpenModal: (open: boolean) => void;
}

/* ======================
   COMPONENT
====================== */

const EditMembersModal = ({
    openModal,
    setOpenModal,
}: EditMembersModalProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [editId, setEditId] = useState<number | null>(null);
    const [savingId, setSavingId] = useState<number | null>(null);

    const [editData, setEditData] = useState<{
        name: string;
        phone: string;
    }>({
        name: "",
        phone: "",
    });

    /* ======================
       FETCH USERS
    ====================== */

    const handleFetchUsers = async () => {
        try {
            const res = await fetch(
                "https://api.plumuleresearch.co.in/api/user"
            );
            const json: ApiListResponse = await res.json();

            if (json.ok) {
                setUsers(json.data);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    useEffect(() => {
        if (openModal) {
            handleFetchUsers();
        }
    }, [openModal]);

    /* ======================
       EDIT HANDLERS
    ====================== */

    const startEdit = (user: User) => {
        setEditId(user.id);
        setEditData({
            name: user.name,
            phone: user.phone,
        });
    };

    const cancelEdit = () => {
        setEditId(null);
        setEditData({ name: "", phone: "" });
    };

    const saveEdit = async (id: number) => {
        try {
            setSavingId(id);

            const res = await fetch(
                `https://api.plumuleresearch.co.in/api/user/${id}`,
                {
                    method: "PUT", // or PUT based on backend
                    headers: {
                        "Content-Type": "application/json",
                        // Authorization: `Bearer ${token}`, // if needed
                    },
                    body: JSON.stringify(editData),
                }
            );

            const json: ApiUpdateResponse = await res.json();

            if (!res.ok || !json.ok) {
                throw new Error(json.message || "Update failed");
            }

            // update UI on success
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === id ? { ...u, ...editData } : u
                )
            );

            cancelEdit();
        } catch (error) {
            console.error("Failed to update user", error);
            alert("Failed to update user. Please try again.");
        } finally {
            setSavingId(null);
        }
    };

    if (!openModal) return null;

    /* ======================
       RENDER
    ====================== */

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setOpenModal(false)}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Modal */}
            <div
                className="relative z-10 w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Edit Members
                    </h2>
                    <button
                        onClick={() => setOpenModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg text-sm">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="px-3 py-2 text-left">ID</th>
                                <th className="px-3 py-2 text-left">Name</th>
                                <th className="px-3 py-2 text-left">Phone</th>
                                <th className="px-3 py-2 text-center">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-t hover:bg-gray-50"
                                >
                                    <td className="px-3 py-2 text-gray-500">
                                        {user.id}
                                    </td>

                                    {/* Name */}
                                    <td className="px-3 py-2 text-gray-500">
                                        {editId === user.id ? (
                                            <input
                                                value={editData.name}
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        name: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded border px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        ) : (
                                            user.name
                                        )}
                                    </td>

                                    {/* Phone */}
                                    <td className="px-3 py-2 text-gray-500">
                                        {editId === user.id ? (
                                            <input
                                                value={editData.phone}
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        phone: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded border px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        ) : (
                                            user.phone
                                        )}
                                    </td>

                                    {/* Action */}
                                    <td className="px-3 py-2 text-center">
                                        {editId === user.id ? (
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => saveEdit(user.id)}
                                                    disabled={savingId === user.id}
                                                    className={`p-1 rounded text-white ${savingId === user.id
                                                        ? "bg-green-300 cursor-not-allowed"
                                                        : "bg-green-500 hover:bg-green-600"
                                                        }`}
                                                >
                                                    <Check size={16} />
                                                </button>

                                                <button
                                                    onClick={cancelEdit}
                                                    className="p-1 rounded border text-gray-600 hover:bg-gray-100"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => startEdit(user)}
                                                className="flex items-center gap-1 px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                                            >
                                                <Edit2 size={14} />
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {users.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="py-4 text-center text-gray-500"
                                    >
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EditMembersModal;
