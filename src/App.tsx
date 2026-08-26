import "./App.css";

import NightSky from "./components/NightSky/NightSky";
import Header from "./components/Header/Header";
import BottomNav from "./components/BottomNav/BottomNav";

import SwapPage from "./pages/SwapPage";
import PoolPage from "./pages/PoolPage";
import AddLiquidityPage from "./pages/AddLiquidityPage";
import RemoveLiquidityPage from "./pages/RemoveLiquidityPage";
import SettingsPage from "./pages/SettingsPage";
import SmartPage from "./components/SmartPage/SmartPage";

import Transparency from "./components/Transparency/Transparency";
import Roadmap from "./components/Roadmap/Roadmap";

import {
    NavigationProvider,
    useNavigation
} from "./context/NavigationContext";

import {
    WalletProvider
} from "./context/WalletContext";


function AppContent() {

    const { page } = useNavigation();

    return (
        <>
            <NightSky count={50} />

            <Header />

            {/* =====================================================
                PAGES
            ===================================================== */}

            {page === "swap" && (
                <SwapPage />
            )}

            {page === "pool" && (
                <PoolPage />
            )}

            {page === "addLiquidity" && (
                <AddLiquidityPage />
            )}

            {page === "removeLiquidity" && (
                <RemoveLiquidityPage />
            )}

            {page === "settings" && (
                <SettingsPage />
            )}

            {page === "smart" && (
                <SmartPage />
            )}

            {page === "transparency" && (
                <Transparency />
            )}

            {page === "roadmap" && (
                <Roadmap />
            )}

            <BottomNav />
        </>
    );
}


export default function App() {

    return (
        <WalletProvider>

            <NavigationProvider>

                <AppContent />

            </NavigationProvider>

        </WalletProvider>
    );
}