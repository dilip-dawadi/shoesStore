import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEdit2,
  FiSave,
  FiX,
} from "react-icons/fi";
import { NotifySuccess, NotifyError } from "../toastify";

const Profile = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/users/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data.data;
    },
  });

  // Update form data when user data is loaded
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/users/profile`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["profile"]);
      NotifySuccess("Profile updated successfully!");
      setIsEditing(false);
    },
    onError: (error) => {
      NotifyError(error.response?.data?.message || "Failed to update profile");
    },
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-card rounded-xl shadow-md p-8 animate-pulse">
            <div className="h-8 bg-secondary/20 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-secondary/20 rounded w-full"></div>
              <div className="h-4 bg-secondary/20 rounded w-3/4"></div>
              <div className="h-4 bg-secondary/20 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            My Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your account information
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl shadow-lg overflow-hidden border border-border"
        >
          {/* Profile Header */}
          <div className="bg-linear-to-r from-primary to-accent px-8 py-12 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="bg-background rounded-full p-4">
                  <FiUser className="text-primary" size={48} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-1">
                    {user?.name || "User"}
                  </h2>
                  <p className="text-primary-foreground/80">{user?.email}</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-background text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-background/90 transition-colors flex items-center space-x-2 shadow-md border border-border"
                >
                  <FiEdit2 size={18} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
                  <FiUser className="mr-2 text-primary" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-transparent disabled:bg-secondary/20 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      <FiMail className="inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={true}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-secondary/20 text-foreground cursor-not-allowed"
                      title="Email cannot be changed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      <FiPhone className="inline mr-1" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-transparent disabled:bg-secondary/20 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
                  <FiMapPin className="mr-2 text-primary" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Street Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-transparent disabled:bg-secondary/20 disabled:cursor-not-allowed resize-none"
                      placeholder="Enter your full address"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 border border-border text-foreground rounded-lg font-semibold hover:bg-secondary/20 transition-colors flex items-center space-x-2"
                  >
                    <FiX size={18} />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    <FiSave size={18} />
                    <span>
                      {updateProfileMutation.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Account Stats */}
          <div className="bg-secondary/10 px-8 py-6 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total Orders
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Wishlist Items
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">$0.00</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total Spent
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
