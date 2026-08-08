import "./WalletButton.css";
import { Wallet } from "lucide-react";

type Props = {
    connected?: boolean;
    address?: string;
    wrongNetwork?: boolean;
    loading?: boolean;
    connect?: () => void;
    disconnect?: () => void;
};

export default function WalletButton({

    connected = false,
    address = "",
    wrongNetwork = false,
    loading = false,
    connect,
    disconnect

}: Props) {

    function short(addr: string) {

        return addr.slice(0, 6) + "..." + addr.slice(-4);

    }

    function handleClick() {

        if (connected) {

            disconnect?.();

        } else {

            connect?.();

        }

    }

    return (

        <button
            className="walletButton"
            onClick={handleClick}
        >

            <Wallet size={18} />

            {

                loading
                    ? "Connecting..."
                    : wrongNetwork
                        ? "Wrong Network"
                        : connected
                            ? short(address)
                            : "Connect Wallet"

            }

        </button>

    );

}