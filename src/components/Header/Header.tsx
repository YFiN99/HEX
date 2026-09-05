import "./Header.css";

import ChainWalletSelector from "../ChainWalletSelector/ChainWalletSelector";

import { useNavigation } from "../../context/NavigationContext";

export default function Header() {

    const {
        page,
        navigate
    } = useNavigation();

    return (
        <header className="header">

            {/* =====================================================
                LEFT / HEX LOGO
            ===================================================== */}

            <div className="headerLeft">

                <img
                    src="/mark.svg"
                    className="headerLogo"
                    alt="HEX"
                />

                <span className="headerTitle">
                </span>

            </div>

            {/* =====================================================
                CENTER MENU (Swap -> Pool -> Smart -> Roadmap -> Transparency)
            ===================================================== */}

            <nav className="headerMenu">

                {/* SWAP */}
                <button
                    className={`menuButton ${
                        page === "swap"
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        navigate("swap")
                    }
                >
                    Swap
                </button>

                {/* POOL */}
                <button
                    className={`menuButton ${
                        page === "pool"
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        navigate("pool")
                    }
                >
                    Pool
                </button>

                {/* SMART */}
                <button
                    className={`menuButton ${
                        page === "smart"
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        navigate("smart")
                    }
                >
                    Smart
                </button>

                {/* CHAT */}
                <button
                    className={`menuButton ${
                        page === "chat"
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        navigate("chat")
                    }
                >
                    Chat
                </button>

                {/* ROADMAP (juga mencakup Transparency lewat sub-tab di dalamnya) */}
                <button
                    className={`menuButton ${
                        page === "roadmap"
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        navigate("roadmap")
                    }
                >
                    Roadmap
                </button>

            </nav>

            {/* =====================================================
                RIGHT / NETWORK + WALLET
            ===================================================== */}

            <div className="headerRight">

                <ChainWalletSelector />

            </div>

        </header>
    );
}