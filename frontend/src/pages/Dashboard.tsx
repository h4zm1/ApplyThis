import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>dashboard</h1>
      <h1>{user?.email}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;
