"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PencilIcon } from "lucide-react";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import GlobalApi from "@/app/api/_services/GlobalApi";
import toast from "react-hot-toast";
import Link from "next/link";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [isEditing, setIsEditing] = useState(false); // Toggle editing mode for user info
  const [loading, setLoading] = useState(true); // Toggle editing mode for user info
  const [editingChild, setEditingChild] = useState(null); // To manage the child being edited

  const handleEditUser = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleEditChild = (childId, e) => {
    const { name, value } = e.target;
    setChildren((prevChildren) =>
      prevChildren.map((child) =>
        child.id === childId ? { ...child, [name]: value } : child
      )
    );
  };

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const response = await GlobalApi.GetUserChildren(token);
        const children = response.data.data;
        const users = response.data.user;
        setChildren(children);
        setUser(users);
      }
    } catch (error) {
      console.error("Error fetching children:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("User details updated:", user);
    console.log("Children details updated:", children);
  };

  const updateUserData = async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        await GlobalApi.UpdateUserData(token, user);
        toast.success("User updated successfully!");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update user data. Please try again."
      );
    }
  };

  const handleEditChildDetails = (child) => {
    setEditingChild(child);
  };

  const handleSaveChildChanges = async () => {
    try {
      // Assuming GlobalApi.UpdateChildData is the API call to update a child's details.
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        await GlobalApi.UpdateChildData(token, editingChild); // Make the API call
        toast.success(`${editingChild.name}'s details updated successfully!`);
        setChildren((prevChildren) =>
          prevChildren.map((child) =>
            child.id === editingChild.id ? editingChild : child
          )
        );
        setEditingChild(null); // Close the popup after successful update
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update child's details. Please try again."
      );
    }
  };

  const handleSearchCriteriaChange = (e) => {
    const newCriteria = parseInt(e.target.value);
    const age = editingChild.age;

    // Calculate the range for search_criteria based on the age
    const minCriteria = age > 3 ? -(age - 3) : 0; // If age is 3, min = 0, if age is 4, min = -1, etc.
    const maxCriteria = 12 - age; // Maximum limit based on the child's age

    // Ensure the criteria is within the allowed range
    if (newCriteria >= minCriteria && newCriteria <= maxCriteria) {
      setEditingChild({ ...editingChild, search_criteria: newCriteria });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* User Info Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-lg mb-8"
        >
          <h2 className="text-3xl font-semibold text-center mb-4">
            User Profile
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="font-medium min-w-28">Name:</div>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={user.name}
                  onChange={handleEditUser}
                  className="border p-2 rounded-md w-full"
                />
              ) : (
                <div className="text-lg">{user.name}</div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="font-medium min-w-28">Username:</div>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={user.username}
                  onChange={handleEditUser}
                  className="border p-2 rounded-md w-full"
                />
              ) : (
                <div className="text-lg">{user.username}</div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="font-medium min-w-28">Mobile:</div>
              {isEditing ? (
                <input
                  type="text"
                  name="mobile"
                  value={user.mobile}
                  onChange={handleEditUser}
                  className="border p-2 rounded-md w-full"
                />
              ) : (
                <div className="text-lg">{user.mobile}</div>
              )}
            </div>

            {/* Edit Pencil Icon */}
            {!isEditing && (
              <button
                onClick={toggleEditMode}
                className="absolute top-4 right-4 text-blue-500"
              >
                <PencilIcon className="w-6 h-6" />
              </button>
            )}

            {/* Submit Button */}
            {isEditing && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={updateUserData}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md"
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </motion.div>

        {/* Children Info Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-3xl font-semibold text-center mb-4">
            Children Information
          </h2>
          <div className="w-full flex justify-end">
            <Link
              href={"/add-child"}
              className="bg-blue-600 rounded-md px-3 py-2 text-white mb-4"
            >
              Add Child
            </Link>
          </div>
          <div className="space-y-4">
            {children.map((child) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-between items-center bg-orange-50 p-4 rounded-md shadow-sm"
              >
                <img
                  src={`/images/${
                    child.gender === "male" ? "boy.png" : "girl.png"
                  }`}
                  alt={child.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1 pl-4">
                  <div className="text-lg font-medium">{child.name}</div>
                  <div className="text-sm text-gray-500">
                    Age: {child.age} years
                  </div>
                  <div className="text-sm text-gray-500">
                    Search Criteria: {child.search_criteria}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditChildDetails(child)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                  >
                    Edit
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Edit Child Popup */}
        {editingChild && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-2xl font-semibold mb-4">
                Edit {editingChild.name} Info
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Name:</label>
                  <input
                    type="text"
                    value={editingChild.name}
                    onChange={(e) =>
                      setEditingChild({ ...editingChild, name: e.target.value })
                    }
                    className="border p-2 rounded-md w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Search Criteria (Age):
                  </label>
                  <input
                    type="number"
                    value={editingChild.search_criteria}
                    onChange={handleSearchCriteriaChange}
                    min={editingChild.age > 3 ? -(editingChild.age - 3) : 0} // Dynamic minimum
                    max={12 - editingChild.age} // Dynamic maximum
                    className="border p-2 rounded-md w-full"
                  />
                </div>

                <div className="flex space-x-4 mt-4">
                  <button
                    onClick={handleSaveChildChanges}
                    className="px-6 py-2 bg-green-500 text-white rounded-md"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingChild(null)}
                    className="px-6 py-2 bg-gray-500 text-white rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;
