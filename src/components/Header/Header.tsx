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
                CENTER MENU
            ===================================================== */}

            <nav className="headerMenu">


                {/* =================================================
                    SWAP
                ================================================= */}

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



                {/* =================================================
                    POOL
                ================================================= */}

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



                {/* =================================================
                    TRANSPARENCY
                ================================================= */}

                <button
                    className={`menuButton ${
                        page === "transparency"
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        navigate("transparency")
                    }
                >
                    Transparency
                </button>



                {/* =================================================
                    ROADMAP
                ================================================= */}

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