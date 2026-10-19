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
  const { logout } = useAuth();
  const navigate = useNavigate();

  // run once on start
  // start listening when mounted, stop when unmounted
  useEffect(() => {
    // give newMessage to the bridge
    return onDemoLimit((newMessage) => {
      // and bridge will run this (setmessage)
      setMessage(newMessage);
      setOpen(true);
    });
  }, []);

  function handleSignUp() {
    logout();
    navigate("/register");
  }

  return (
    <Toast.Provider swipeDirection="right" duration={700000}>
      <Toast.Root className="toast-root" open={open} onOpenChange={setOpen}>
        <Toast.Title className="toast-title">Demo limit reached</Toast.Title>
        <Toast.Description className="toast-desc">{message}</Toast.Description>
        <Toast.Action altText="Sign up for a full account" asChild>
          <button className="toast-action" onClick={handleSignUp}>
            Sign up to remove limits
          </button>
        </Toast.Action>
        <Toast.Close className="toast-close" aria-label="Close">
          <X size={16} />
        </Toast.Close>
      </Toast.Root>
      <Toast.Viewport className="toast-viewport" />
    </Toast.Provider>
  );
}
