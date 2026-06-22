import "./App.css";
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
import { Profile } from "./pages/Profile/Profile";
import { ProfileDetail } from "./pages/Profile/ProfileDetail";
import { Shop } from "./pages/Shop/Shop";
import { ShopItemDetail } from "./pages/Shop/ShopItemDetail";
import { Inventory } from "./pages/Inventory/Inventory";
import { Purchases } from "./pages/Purchases/Purchases";
import { useSelector } from "react-redux";
import type { RootState } from "./store/store";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";

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
  return token ? <Outlet /> : <Navigate to="/register" replace />;
}

function App() {
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
