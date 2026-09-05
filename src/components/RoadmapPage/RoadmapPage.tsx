import "./RoadmapPage.css";
import { useState } from "react";

import Roadmap from "../Roadmap/Roadmap";
import Transparency from "../Transparency/Transparency";

type SubTab = "roadmap" | "transparency";

export default function RoadmapPage() {
    const [subTab, setSubTab] = useState<SubTab>("roadmap");

    return (
        <div className="roadmapPage-wrapper">

            <div className="roadmapPage-tabs">
                <button
                    className={
                        "roadmapPage-tab" +
                        (subTab === "roadmap" ? " active" : "")
                    }
                    onClick={() => setSubTab("roadmap")}
                >
                    Roadmap
                </button>

                <button
                    className={
                        "roadmapPage-tab" +
                        (subTab === "transparency" ? " active" : "")
                    }
                    onClick={() => setSubTab("transparency")}
                >
                    Transparency
                </button>
            </div>

            {subTab === "roadmap" ? <Roadmap /> : <Transparency />}

        </div>
    );
}