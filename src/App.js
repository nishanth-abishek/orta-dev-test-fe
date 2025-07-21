import "./App.css";
import { useEffect, useReducer } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import TokenContext from "./context/TokenContext";
import tokenReducer from "./reducer/tokenReducer";
import userReducer from "./reducer/userReducer";
import Header from "./components/Header/Header";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/forgotPassword/ForgotPassword";
import ResetPassword from "./components/forgotPassword/ResetPassword";
import axios from "./Axios/axios.js";
import Shifts from "./components/Shifts/Shifts";
import ShiftDetails from './components/Shifts/ShiftDetails';
import EditShift from "./components/Shifts/EditShift.jsx";
import CreateShift from "./components/Shifts/CreateShift.jsx";


function App() {
  const storedToken = JSON.parse(localStorage.getItem("authToken"));
  const [userToken, tokenDispatch] = useReducer(tokenReducer, storedToken);
  const [user, userDispatch] = useReducer(userReducer, {});

  useEffect(() => {
    if (!userToken) return;

    (async () => {
      try {
        const res = await axios.get("/user/getUser", {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        userDispatch({ type: "SET_USER", payload: res.data.user });
      } catch (err) {
        console.error(err);
      }
    })();
  }, [userToken]);

  return (
    <BrowserRouter>
      <TokenContext.Provider
        value={{ userToken, tokenDispatch, user, userDispatch }}
      >
        <Routes>
          <Route path="/" element={<Header />}>
            <Route
              index
              element={userToken ? <Shifts /> : <Navigate to="/login" />}
            />
            <Route path="shifts" element={<Navigate to="/" replace />} />
            <Route path="shifts/:id" element={<ShiftDetails />} />
            <Route path="shifts/:id/edit" element={<EditShift />} />
            <Route path="shifts/create" element={<CreateShift />} />
            <Route
              path="login"
              element={userToken ? <Navigate to="/" /> : <Login />}
            />
            <Route
              path="register"
              element={userToken ? <Navigate to="/" /> : <Register />}
            />
            <Route
              path="forgotPassword"
              element={userToken ? <Navigate to="/" /> : <ForgotPassword />}
            />
            <Route
              path="resetPassword"
              element={userToken ? <Navigate to="/" /> : <ResetPassword />}
            />
          </Route>
        </Routes>
      </TokenContext.Provider>
    </BrowserRouter>
  );
}

export default App;
