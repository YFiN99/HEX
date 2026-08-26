import {
    createContext,
    useContext,
    useState
} from "react";

import type {
    ReactNode
} from "react";

export type Page =
    | "swap"
    | "pool"
    | "addLiquidity"
    | "removeLiquidity"
    | "settings"
    | "smart"
    | "transparency"
    | "docs";

type NavigationContextType = {
    page: Page;
    data: any;

    navigate: (
        page: Page,
        data?: any
    ) => void;
};

const NavigationContext =
    createContext<NavigationContextType | null>(null);

export function NavigationProvider({
    children
}: {
    children: ReactNode;
}) {

    const [
        page,
        setPage
    ] = useState<Page>("swap");

    const [
        data,
        setData
    ] = useState<any>(null);

    function navigate(
        nextPage: Page,
        nextData?: any
    ) {

        setPage(nextPage);

        setData(
            nextData ?? null
        );

    }

    return (
        <NavigationContext.Provider
            value={{
                page,
                data,
                navigate
            }}
        >
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigation() {

    const context =
        useContext(
            NavigationContext
        );

    if (!context) {

        throw new Error(
            "NavigationProvider not found"
        );

    }

    return context;
}