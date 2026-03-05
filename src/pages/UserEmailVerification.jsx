// react
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useVerifyEmail } from "../hooks/useAuth";
import { useAuth } from "../context/AuthContext";

const UserVerification = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const userId = searchParams.get("userId");
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [message, setMessage] = React.useState("");
  const { mutate: verifyEmail, isPending } = useVerifyEmail();

  const verify = () => {
    if (!token || !userId) {
      setMessage("Invalid verification link. Please register again.");
      return;
    }
    verifyEmail(
      { token, userId: parseInt(userId) },
      {
        onSuccess: async () => {
          setMessage("Email verified successfully!");
          // Force a fresh session fetch so the auth context picks up
          // isVerified: true before we navigate to the dashboard
          await refreshSession();
          setTimeout(() => navigate("/dashboard"), 1500);
        },
        onError: (error) => {
          setMessage(error.response?.data?.message || "Verification failed");
        },
      },
    );
  };

  return (
    // user verification page
    <div className="flex flex-col items-center justify-center h-[30vw]">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-800">User Verification</h1>
        <p className="text-sm text-gray-500">
          Click on the button to verify your account
        </p>
      </div>
      <div className="flex flex-col items-center justify-center">
        <button
          className="
                    w-40
                    h-10
                    mt-4
                    text-white
                    bg-primary
                    rounded-md
                    hover:bg-primary-900
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary-600
                    focus:ring-opacity-50
                    transition
                    duration-300
                "
          onClick={verify}
        >
          Verify
        </button>
        <p className="mt-2 text-sm text-gray-500">
          {message.includes("//") ? message.split("//")[1] : message}
        </p>
      </div>
    </div>
  );
};
export default UserVerification;
