import { useEffect, useState } from "react";
import * as Toast from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { onDemoLimit } from "../../services/demoLimit";
import "./toast.scss";

export default function DemoLimitToast() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const { logout } = useAuth();
  const navigate = useNavigate();

  // run once on start
  // start listening when mounted, stop when unmounted
  useEffect(() => {
    // give newMessage to the bridge
    return onDemoLimit((newMessage, type) => {
      // and bridge will run this (setmessage)
      setMessage(newMessage);
      setType(type);
      setOpen(true);
      if (type === "cap") {
        setTitle("Demo limit reached");
      } else if (type === "block") {
        setTitle("Sign up");
      }
    });
  }, []);

  function handleSignUp() {
    logout();
    navigate("/register");
  }

  function handleSignIn() {
    logout();
    navigate("/login");
  }

  return (
    <Toast.Provider swipeDirection="right" duration={7000}>
      <Toast.Root className="toast-root" open={open} onOpenChange={setOpen}>
        <Toast.Title className="toast-title">{title}</Toast.Title>
        <Toast.Description className="toast-desc">{message}</Toast.Description>
        <Toast.Action altText="Sign up for a full account" asChild>
          <div className="toast-btn-holder">
            <button className="toast-action" onClick={handleSignUp}>
              Sign up
            </button>

            <button className="toast-action" onClick={handleSignIn}>
              Sign in
            </button>
          </div>
        </Toast.Action>
        <Toast.Close className="toast-close" aria-label="Close">
          <X size={16} />
        </Toast.Close>
      </Toast.Root>
      <Toast.Viewport className="toast-viewport" />
    </Toast.Provider>
  );
}
