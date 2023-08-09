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

function App() {
  const [panels, setPanels] = useState([
    "panel-1",
    "panel-2",
    "panel-3",
    "panel-4",
  ]);
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <header className="App-header">
          <Layout
            defaultConfig={{
              kind: "column",
              size: 100,
              children: [
                {
                  kind: "row",
                  size: 100,
                  children: [
                    {
                      kind: "leaf",
                      tabs: ["panel-1"],
                      tabIndex: 0,
                      size: 50,
                    },
                    {
                      kind: "column",
                      size: 50,
                      children: [
                        {
                          kind: "leaf",
                          tabs: ["panel-2"],
                          tabIndex: 0,
                          size: 25,
                        },
                        {
                          kind: "leaf",
                          tabs: ["panel-3"],
                          tabIndex: 0,
                          size: 25,
                        },
                        {
                          kind: "leaf",
                          tabs: ["panel-4"],
                          tabIndex: 0,
                          size: 25,
                        },
                      ],
                    },
                  ],
                },
              ],
            }}
          >
            {panels.map((name) => (
              <Panel
                name={name}
                header={
                  <span className={"custom-header"}>
                    <span>{name} </span>
                    <CloseButton
                      onClick={() => setPanels(panels.filter((p) => p != name))}
                    />
                  </span>
                }
              >
                <img
                  src={logo}
                  className="App-logo"
                  alt="logo"
                />
              </Panel>
            ))}
          </Layout>
        </header>
      </div>
    </DndProvider>
  );
  /*
                                          /*<Panel name="panel-2" header={
                                            <span>panel-1 <CloseButton/></span>
                                          }>
                                            <img src={logo} className="App-logo" alt="logo" />
                                          </Panel>
                                          <Panel name="panel-3">
                                            <p>
                                              Edit <code>src/App.tsx</code> and save to reload.
                                            </p>
                                          </Panel>
                                          <Panel name="panel-4">
                                            <a
                                              className="App-link"
                                              href="https://reactjs.org"
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              Learn React
                                            </a>
                                           */
}

const DEFAULT_CONFIG = {
    kind: "row",
    size: 100,
    children: [
        {
            kind: "column",
            size: 50,
            children: [
                {kind: "leaf", tabs: ["Panel 1"], tabIndex: 0, size: 50},
                {kind: "leaf", tabs: ["Panel 2"], tabIndex: 0, size: 50},
            ],
        },
        {kind: "leaf", tabs: ["Panel 3"], tabIndex: 0, size: 50},
    ],
}

const NewApp = () => (
    <DndProvider backend={HTML5Backend}>
        <div style={{background: "#bdbdbd", width: "100vw", height: "100vh"}}>
            <Layout
                /* optional initial layout config */
                defaultConfig={DEFAULT_CONFIG as any}
            >
                <Panel key="Panel 1">
                    <p>Content 1</p>
                </Panel>
                <Panel key="Panel 2" header={<i>Italic title</i>}>
                    <p>Content 2</p>
                </Panel>
                <Panel key="Panel 3">
                    <p>Content 3</p>
                </Panel>
            </Layout>
        </div>
    </DndProvider>
);


ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
).render(
  /*<React.StrictMode>*/
  <NewApp />
  /*</React.StrictMode>*/
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
