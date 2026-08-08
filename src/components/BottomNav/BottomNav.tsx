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

                    page==="settings"

                    ?

                    "navItem active"

                    :

                    "navItem"

                }

                onClick={()=>navigate("settings")}

            >

                Settings

            </button>

        </nav>

    );

}