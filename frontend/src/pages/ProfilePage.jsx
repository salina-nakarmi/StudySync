import React from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import ProfileSection from "./Profile.jsx"; // same folder
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  if (!user) return <div>Loading...</div>;

  const handleLogout = async () => {
    await signOut();
    navigate("/"); // redirect to home after logout
  };

  return (
    <ProfileSection
      user={{
        name: user.fullName,
        email: user.emailAddresses[0].emailAddress,
        avatar: user.profileImageUrl,
        joinedAt: user.createdAt,
      }}
      onLogout={handleLogout}
    />
  );
};

export default ProfilePage;
