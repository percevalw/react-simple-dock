import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Layout, Panel } from "../lib";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import logo from "./logo.svg";

const CloseButton = (props: any) => (
    <button {...props} className="close-button">
        &#x2715;
    </button>
);

const DEFAULT_CONFIG = {
    kind: "row",
    size: 100,
    children: [
        {
            kind: "column",
            size: 50,
            children: [
                { kind: "leaf", tabs: ["Panel 1"], tabIndex: 0, size: 50 },
                { kind: "leaf", tabs: ["Panel 2"], tabIndex: 0, size: 50 },
            ],
        },
        { kind: "leaf", tabs: ["Panel 3"], tabIndex: 0, size: 50 },
    ],
};

const App = () => {
    const [panels, setPanels] = useState(["panel-1", "panel-2", "panel-3", "panel-4"]);
    return (
        <DndProvider backend={HTML5Backend}>
            <div style={{ background: "#bdbdbd", width: "100vw", height: "100vh" }}>
                <Layout
                /* optional initial layout config */
                // defaultConfig={} // DEFAULT_CONFIG as any
                >
                    {panels.map((name) => (
                        <Panel
                            name={name}
                            header={
                                <span className={"custom-header"}>
                                    <span>{name === "panel-2" ? <i>{name}</i> : name} </span>
                                    <CloseButton onClick={() => setPanels(panels.filter((p) => p != name))} />
                                </span>
                            }
                        >
                            <div style={{ background: "white", width: "100%", height: "100%" }}>
                                <img src={logo} className="App-logo" alt="logo" />
                            </div>
                        </Panel>
                    ))}
                </Layout>
            </div>
        </DndProvider>
    );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />);
