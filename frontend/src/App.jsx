import { useState, useEffect } from "react";
import EnterAppDSW from "./components/EnterApp";
import DashBoard from "./components/DashBoard";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem('isLoggedIn');
    const savedEmployee = localStorage.getItem('currentEmployee');
    
    if (savedAuth === 'true' && savedEmployee) {
      setIsLoggedIn(true);
      setCurrentEmployee(JSON.parse(savedEmployee));
    }
  }, []);

  const LogSuccess = (employeeData) => {
    setIsLoggedIn(true);
    setCurrentEmployee(employeeData);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentEmployee', JSON.stringify(employeeData));
  };
  
  const LogOut = () => {
    setIsLoggedIn(false);
    setCurrentEmployee(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentEmployee');
  };
  
  return (
    <div className="app">
      {isLoggedIn ? (
        <DashBoard onLogout={LogOut} currentEmployee={currentEmployee} />
      ) : (
        <div className="flex justify-center items-center min-h-screen"> 
          <div className="w-full max-w-[542px] p-4 flex flex-col items-center gap-[30px]"> 
            <EnterAppDSW onLoginSuccess={LogSuccess} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;