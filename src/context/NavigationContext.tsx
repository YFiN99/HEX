import {
    createContext,
    useContext,
    useState,
    ReactNode
} from "react";


/* =========================================================
   AVAILABLE PAGES
   ========================================================= */

export type Page =
    | "swap"
    | "pool"
    | "addLiquidity"
    | "removeLiquidity"
    | "settings"
    | "transparency"
    | "roadmap";


/* =========================================================
   NAVIGATION CONTEXT TYPE
   ========================================================= */

type NavigationContextType = {

    page: Page;

    data: any;

    navigate: (
        page: Page,
        data?: any
    ) => void;

};


/* =========================================================
   CONTEXT
   ========================================================= */

const NavigationContext =
    createContext<NavigationContextType | null>(null);


/* =========================================================
   PROVIDER
   ========================================================= */

export function NavigationProvider({

    children

}: {

    children: ReactNode;

}) {

    const [page, setPage] =
        useState<Page>("swap");

    const [data, setData] =
        useState<any>(null);


    function navigate(

        page: Page,

        data?: any

    ) {

        setPage(page);

        setData(data ?? null);

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


/* =========================================================
   HOOK
   ========================================================= */

export function useNavigation() {

    const context =
        useContext(NavigationContext);


    if (!context) {

        throw new Error(
            "NavigationProvider not found"
        );

    }


    return context;

}