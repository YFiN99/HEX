import "./BottomNav.css";

import {

useNavigation

} from "../../hooks/useNavigation";

export default function BottomNav(){

    const {

        page,

        navigate

    }=useNavigation();

    return(

        <nav className="bottomNav">

            <button

                className={

                    page==="swap"

                    ?

                    "navItem active"

                    :

                    "navItem"

                }

                onClick={()=>navigate("swap")}

            >

                Swap

            </button>

            <button

                className={

                    page==="pool"

                    ?

                    "navItem active"

                    :

                    "navItem"

                }

                onClick={()=>navigate("pool")}

            >

                Pool

            </button>

            <button

                className={

                    page==="smart"

                    ?

                    "navItem active"

                    :

                    "navItem"

                }

                onClick={()=>navigate("smart")}

            >

                Smart

            </button>

            <button

                className={

                    page==="chat"

                    ?

                    "navItem active"

                    :

                    "navItem"

                }

                onClick={()=>navigate("chat")}

            >

                Chat

            </button>

        </nav>

    );

}