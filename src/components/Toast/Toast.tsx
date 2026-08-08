import "./Toast.css";

type Props = {
    open: boolean;
    title: string;
    message: string;
    tx?: string;
    explorer?: string;
    onClose: () => void;
};

export default function Toast({
    open,
    title,
    message,
    tx,
    explorer,
    onClose
}: Props) {

    if (!open) return null;

    // Fallback URL explorer umum jika prop explorer tidak ada
    const cleanExplorer = explorer?.replace(/\/+$/, "");

    return (
        <div className="toast">
            <div className="toastIcon">
                ✅
            </div>

            <div className="toastBody">
                <div className="toastTitle">
                    {title}
                </div>

                <div className="toastMessage">
                    {message}
                </div>

                {
                    tx && (
                        <a
                            href={cleanExplorer ? `${cleanExplorer}/tx/${tx}` : `https://etherscan.io/tx/${tx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="toast-link"
                        >
                            View Transaction ↗
                        </a>
                    )
                }
            </div>

            <button
                className="toastClose"
                onClick={onClose}
            >
                ✕
            </button>
        </div>
    );
}