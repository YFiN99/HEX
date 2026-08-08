import "./SwapButton.css";
import { Cog } from "lucide-react";

type Props = {
    loading?: boolean;
    disabled?: boolean;
    text?: string;
    loadingText?: string;
    onClick?: () => void;
};

export default function SwapButton({

    loading = false,

    disabled = false,

    text = "SWAP",

    loadingText = "Preparing...",

    onClick

}: Props) {

    return (

        <button

            className="swapBtn"

            disabled={loading || disabled}

            onClick={onClick}

        >

            {

                loading ? (

                    <>

                        <Cog

                            size={22}

                            className="gear"

                        />

                        {loadingText}

                    </>

                ) : (

                    text

                )

            }

        </button>

    );

}