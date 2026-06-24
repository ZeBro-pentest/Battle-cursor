import "./App.css";
import { useEffect } from "react";
import { MobileGuard } from "./components/MobileGuard/MobileGuard";
import { Header } from "./components/Header/Header";
import { Footer } from "./components/Footer/Footer";
import { Home } from "./pages/Home/Home";
import { Tutorial } from "./pages/Tutorial/Tutorial";
import { NotFound } from "./pages/NotFound/NotFound";
import { Login } from "./pages/Login/Login";
import { Register } from "./pages/Register/Register";
import { VerifyEmail } from "./pages/VerifyEmail/VerifyEmail";
import { Main } from "./pages/Main/Main";
import { Lobby } from "./pages/Lobby/Lobby";
import { Profile } from "./pages/Profile/Profile";
import { ProfileDetail } from "./pages/Profile/ProfileDetail";
import { Shop } from "./pages/Shop/Shop";
import { ShopItemDetail } from "./pages/Shop/ShopItemDetail";
import { Inventory } from "./pages/Inventory/Inventory";
import { Purchases } from "./pages/Purchases/Purchases";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "./store/store";
import { setAccessToken, clearAuth } from "./store/authSlice";
import { refreshAccessToken } from "./services/api";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";

function useProactiveRefresh() {
  const dispatch = useDispatch();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    async function doRefresh() {
      try {
        const newToken = await refreshAccessToken();
        dispatch(setAccessToken(newToken));
        console.log("[auth] Proactive refresh success");
        scheduleRefresh(newToken);
      } catch {
        dispatch(clearAuth());
        window.location.href = "/login";
      }
    }

    function scheduleRefresh(token: string) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const delay = payload.exp * 1000 - Date.now() - 60_000;
        if (delay <= 0) {
          // Токен уже просрочен или истекает — рефрешим немедленно
          doRefresh();
          return;
        }
        console.log(`[auth] Token expires in ${Math.round((delay + 60_000) / 1000)}s, scheduling refresh`);
        timeoutId = setTimeout(doRefresh, delay);
      } catch {
        // невалидный токен — ничего не делаем
      }
    }

    const token = localStorage.getItem("access_token");
    if (token) scheduleRefresh(token);

    return () => clearTimeout(timeoutId);
  }, [dispatch]);
}

function MainLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function RequireAuth() {
  const token = useSelector((state: RootState) => state.auth.accessToken);
  if (!token) return <Navigate to="/register" replace />;
  return <Outlet />;
}

function App() {
  useProactiveRefresh();
  return (
    <MobileGuard>
    <Router>
      <Routes>
        {/* Страницы авторизации (без хедера) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Все страницы с хедером */}
        <Route element={<MainLayout />}>
          {/* Публичные — доступны всем */}
          <Route path="/" element={<Home />} />
          <Route path="/tutorial" element={<Tutorial />} />

          {/* Защищённые — только для авторизованных */}
          <Route element={<RequireAuth />}>
            <Route path="/main" element={<Main />} />

            <Route path="/games" element={<div>Games (todo)</div>} />
            <Route path="/games/create" element={<div>Create Game (todo)</div>} />
            <Route path="/games/:room_code" element={<Lobby />} />
            <Route path="/game/:id" element={<div>Game (todo)</div>} />
            <Route path="/games/:id/results" element={<div>Results (todo)</div>} />

            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<ProfileDetail />} />

            <Route path="/inventory" element={<Inventory />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/cursors" element={<Shop />} />
            <Route path="/shop/cursors/:id" element={<ShopItemDetail type="cursor" />} />
            <Route path="/shop/canvases" element={<Shop />} />
            <Route path="/shop/canvases/:id" element={<ShopItemDetail type="canvas" />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  </MobileGuard>
  );
}

export default App;
