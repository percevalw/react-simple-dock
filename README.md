# React-Simple-Dock

A set of React components to create a dockable interface, allowing to arrange and resize tabs.

## Installation

```bash
npm install react-simple-dock
```

## Demo

[![Edit react-simple-dock](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/p/sandbox/zwgwp3)

## Usage

```tsx
import React from "react";
import { Layout, Panel } from "react-simple-dock";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

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

const App = () => (
    <DndProvider backend={HTML5Backend}>
        <div style={{ background: "#bdbdbd", width: "100vw", height: "100vh" }}>
            <Layout
                /* optional initial layout config */
                defaultConfig={DEFAULT_CONFIG}
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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />);
```
