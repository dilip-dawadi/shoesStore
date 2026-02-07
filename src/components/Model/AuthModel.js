import React from "react";
import { useNavigate } from "react-router-dom";
import { useLogin, useRegister } from "../../hooks/useAuth";
import { NotifyInfo, NotifySuccess } from "../../toastify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Auth({
  IsSignup,
  setIsSignup,
  text,
  closeModalDropDown,
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [checkbox, setCheckbox] = React.useState(false);
  const navigate = useNavigate();
  const { mutate: login } = useLogin();
  const { mutate: register } = useRegister();

  const [authData, setAuthData] = React.useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    address: "",
    number: "",
  });

  function closeModal() {
    setIsOpen(false);
    window.innerWidth < 768 && closeModalDropDown();
  }

  function openModal() {
    setIsOpen(true);
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    if (IsSignup) {
      if (checkbox === false) {
        return NotifyInfo("Please accept the terms and conditions");
      }
      if (authData.password !== authData.confirmPassword) {
        return NotifyInfo("Password and Confirm Password must be same");
      }

      register(authData, {
        onSuccess: () => {
          NotifySuccess("Registration successful! Please verify your email.");
          closeModal();
          closeModalDropDown && closeModalDropDown();
        },
        onError: (error) => {
          NotifyInfo(error.response?.data?.message || "Registration failed");
        },
      });
    } else {
      login(authData, {
        onSuccess: () => {
          NotifySuccess("Login successful!");
          closeModal();
          closeModalDropDown && closeModalDropDown();
          navigate("/");
        },
        onError: (error) => {
          NotifyInfo(error.response?.data?.message || "Login failed");
        },
      });
    }
  };

  const handleChange = (e) => {
    setAuthData({ ...authData, [e.target.name]: e.target.value });
  };
  return (
    <>
      <p type="button" className="cursor-pointer" onClick={openModal}>
        {text}
      </p>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="mx-2 max-w-md max-h-[90vh] overflow-y-auto rounded-lg bg-background">
          <DialogHeader>
            <DialogTitle className="text-center text-foreground">
              {IsSignup ? "Sign up for an account" : "Log in to your account"}
            </DialogTitle>
          </DialogHeader>
          <form
            className="mb-0 md:space-y-5 space-y-2"
            autoComplete="off"
            onSubmit={handleSubmit}
          >
            {IsSignup && (
              <>
                <div className="w-full md:w-1/2 md:inline-block md:mr-1">
                  <label htmlFor="firstName">First Name</label>
                  <div className="mt-1">
                    <input
                      name="firstName"
                      type="text"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="w-full md:w-[48%] md:inline-block">
                  <label htmlFor="lastName">Last Name</label>
                  <div className="mt-1">
                    <input
                      onChange={handleChange}
                      name="lastName"
                      type="text"
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <label htmlFor="email">Email address</label>
              <div className="mt-1">
                <input
                  onChange={handleChange}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                />
              </div>
            </div>
            <div
              className={
                IsSignup ? "w-full md:w-1/2 md:inline-block md:mr-1" : "w-full"
              }
            >
              <label htmlFor="password">Password</label>
              <div className="mt-1">
                <input
                  onChange={handleChange}
                  name="password"
                  type="password"
                  onClick={(e) => {
                    e.target.type = "text";
                  }}
                  onBlur={(e) => {
                    e.target.type = "password";
                  }}
                />
              </div>
            </div>
            {IsSignup && (
              <>
                <div className="w-full md:w-[48%] md:inline-block">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="mt-1">
                    <input
                      onChange={handleChange}
                      name="confirmPassword"
                      type="password"
                      onClick={(e) => {
                        e.target.type = "text";
                      }}
                      onBlur={(e) => {
                        e.target.type = "password";
                      }}
                    />
                  </div>
                </div>
                <div className="w-full md:w-1/2 md:inline-block md:mr-1">
                  <label htmlFor="address">Address</label>
                  <div className="mt-1">
                    <input onChange={handleChange} name="address" type="text" />
                  </div>
                </div>
                <div className="w-full md:w-[48%] md:inline-block">
                  <label htmlFor="number">Contact Number</label>
                  <div className="mt-1">
                    <input onChange={handleChange} name="number" type="tel" />
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center">
              <input
                id="terms-and-privacy"
                name="terms-and-privacy"
                type="checkbox"
                className="h-4 w-4 text-accent focus:ring-accent border-border rounded"
                checked={checkbox}
                onChange={() => setCheckbox(!checkbox)}
              />
              <label
                htmlFor="terms-and-privacy"
                className="ml-2 block text-sm text-foreground"
              >
                I agree to the
                <a href="/" className="text-accent hover:text-accent/80">
                  {" "}
                  Terms{" "}
                </a>
                and
                <a href="/" className="text-accent hover:text-accent/80">
                  {" "}
                  Privacy Policy{" "}
                </a>
                .
              </label>
            </div>

            <div className="flex gap-2 w-full">
              <Button
                variant="ghost"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSignup(!IsSignup);
                }}
                className="flex-1 text-accent hover:text-accent/80 hover:bg-accent/10"
              >
                {IsSignup ? "Sign in instead" : "Create Account"}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {IsSignup ? "Sign Up" : "Log In"}
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground first-letter:capitalize">
              click on the overlay to close the popup window
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
