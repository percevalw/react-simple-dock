import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./index.css";
import { DndProvider, useDrag, useDragDropManager, useDrop } from "react-dnd";
import { DnDItem, LayoutConfig, LeafLayoutConfig, PanelProps, Zone } from "./types";
import { filterPanels, movePanel } from "./utils";
import { HTML5Backend } from "react-dnd-html5-backend";

export const Panel = (props: PanelProps) => {
    return null;
};

function useForceUpdate() {
    const [value, setValue] = useState(0); // integer state
    return () => setValue((value) => value + 1); // update state to force render
}

const getPanelElementHeader = (node: HTMLElement): HTMLElement => node.children[0] as any;

const TabHandle = ({
    name,
    index,
    visible,
    onClick,
    children,
}: {
    name: string;
    index: number;
    visible: boolean;
    onClick: (i: number) => void;
    children: React.ReactNode;
}) => {
    const getItem: () => {
        name: string;
        handleElement: HTMLDivElement | null;
        width: number;
    } = () => ({
        name,
        handleElement: targetRef.current,
        width: targetRef.current!.offsetWidth,
    });
    const targetRef = useRef<HTMLDivElement | null>(null);
    const [{}, dragRef] = useDrag(
        () => ({
            type: "TabHeader",
            collect: () => ({}),
            item: getItem,
        }),
        [name],
    );
    return (
        <div
            className={`tab-handle tab-handle__${visible ? "visible" : "hidden"}`}
            ref={(element) => {
                dragRef(element);
                targetRef.current = element;
            }}
            onClick={() => onClick(index)}
        >
            {children}
        </div>
    );
};

const TabHeader = ({
    config,
    onClick,
    leaves,
}: {
    config: LeafLayoutConfig;
    onClick: (i: number) => void;
    leaves: {
        [key: string]: { element: React.ReactNode; header?: React.ReactNode };
    };
}) => {
    return (
        <div>
            <div className="tab-header">
                {config.tabs
                    .map((tab, i) => [
                        <div
                            key={`${i}-placeholder`}
                            className="tab-placeholder"
                            style={{ width: "0px" }}
                            data-panel-name={tab}
                        />,
                        <TabHandle key={i} name={tab} index={i} visible={config.tabIndex === i} onClick={onClick}>
                            {leaves[tab].header || tab}
                        </TabHandle>,
                    ])
                    .flat()}
                <div className="tab-placeholder" />
            </div>
            <div className="tab-header-border" />
            <div className="tab-header-bottom" />
        </div>
    );
};

const NestedPanel = React.memo(
    ({
        leaves,
        config,
        index,
        onResize,
        saveSizes,
        isLast,
        direction,
        style,
        panelElements,
    }: {
        leaves: {
            [key: string]: { element: React.ReactNode; header?: React.ReactNode };
        };
        config: LayoutConfig;
        index?: number;
        onResize?: (ratio: number, i: number, target: HTMLElement) => void;
        saveSizes?: () => void;
        isLast?: boolean;
        direction?: "row" | "column";
        style?: { [key: string]: any };
        panelElements: Map<LayoutConfig, HTMLDivElement>;
    }) => {
        const startEvent = useRef<{
            width: number;
            height: number;
            target: HTMLElement;
            side: string;
            handleMouseMove: any;
            size: number;
        } | null>(null);
        const savedSizes = useRef<number[]>([]);

        const forceUpdate = useForceUpdate();

        useEffect(() => {
            const handleMouseUp = (e: MouseEvent) => {
                document.removeEventListener("mousemove", startEvent.current?.handleMouseMove);
                if (startEvent.current) {
                    e.preventDefault();
                }
                startEvent.current = null;
            };
            document.addEventListener("mouseup", handleMouseUp);

            // Make sure to remove event listener on component unmount
            return () => {
                document.removeEventListener("mouseup", handleMouseUp);
                document.removeEventListener("mousemove", startEvent.current?.handleMouseMove);
            };
        }, []);

        useLayoutEffect(() => {
            panelElements.set(config, panelRef.current!);
            return () => {
                panelElements.delete(config);
            };
        }, [config]);

        const handleMouseMove = useCallback(
            (e: MouseEvent) => {
                if (!startEvent.current) {
                    return;
                }
                e.preventDefault();
                const { clientX, clientY } = e;
                // get Panel top left corner
                const { top, left } = (
                    startEvent.current?.target as HTMLDivElement
                ).parentElement!.getBoundingClientRect();
                let ratio;
                if (startEvent.current.side === "bottom") {
                    ratio = (clientY - top) / startEvent.current.height;
                } else if (startEvent.current.side === "right") {
                    ratio = (clientX - left) / startEvent.current.width;
                } else {
                    return;
                }
                onResize && onResize(ratio, index!, startEvent.current.target!);
            },
            [onResize, index],
        );

        const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, side: string) => {
            if (startEvent.current) {
                return;
            }
            document.addEventListener("mousemove", handleMouseMove);
            const { top, left } = (e.currentTarget as HTMLDivElement).parentElement!.getBoundingClientRect();
            e.preventDefault();

            saveSizes && saveSizes();

            startEvent.current = {
                width: e.clientX - left,
                height: e.clientY - top,
                target: e.currentTarget,
                side: side,
                handleMouseMove,
                size: config.size,
            };
        };

        const makeStyle = () => {
            if (config.kind === "row") {
                // return {gridTemplateColumns: config.children.map(c => `calc((${100}% - var(--grid-gap) * ${config.children.length - 1}) * ${c.size / 100})`).join(" ")};
                return {
                    gridTemplateColumns: config.children.map((c) => `${c.size}fr`).join(" "),
                };
            }
            if (config.kind === "column") {
                // return {gridTemplateRows: config.children.map(c => `calc((${100}% - var(--grid-gap) * ${config.children.length - 1}) * ${c.size / 100})`).join(" ")};
                return {
                    gridTemplateRows: config.children.map((c) => `${c.size}fr`).join(" "),
                };
            }
        };

        const handleResize = useCallback(
            (ratio: number, idx: number, target: HTMLElement) => {
                if (config.kind === "leaf") return;
                let size = savedSizes.current[idx] * ratio;
                let nextSize = savedSizes.current[idx + 1] + (savedSizes.current[idx] - size);
                const total = savedSizes.current.reduce((a, b) => a + b, 0);
                const headerHeight = getPanelElementHeader(target.parentElement).offsetHeight;

                if (config.kind === "column") {
                    const parentHeight = panelContentRef.current!.offsetHeight;
                    if ((size * parentHeight) / total < headerHeight) {
                        size = (headerHeight / parentHeight) * total;
                        nextSize = savedSizes.current[idx + 1] + (savedSizes.current[idx] - size);
                    } else if ((nextSize * parentHeight) / total < headerHeight) {
                        nextSize = (headerHeight / parentHeight) * total;
                        size = savedSizes.current[idx] + (savedSizes.current[idx + 1] - nextSize);
                    }
                }
                config.children[idx].size = size;
                config.children[idx + 1].size = nextSize;

                Object.assign(panelContentRef.current!.style, makeStyle());
            },
            [config],
        );

        const handleSaveSizes = useCallback(() => {
            if (config.kind === "leaf") return;
            savedSizes.current = config.children.map((child) => child.size);
        }, [config]);

        const handleHeaderClick = (i: number) => {
            if (config.kind === "leaf") {
                forceUpdate();
                config.tabIndex = i;
            }
        };

        const panelContentRef = useRef<HTMLDivElement>(null);
        const panelRef = useRef<HTMLDivElement>(null);
        return (
            <div className={`${config.kind} panel`} style={style} ref={panelRef}>
                {config.kind === "leaf" ? (
                    <TabHeader config={config} leaves={leaves} onClick={handleHeaderClick} />
                ) : null}
                <div className="panel-content" ref={panelContentRef} style={makeStyle()}>
                    {config.kind === "leaf" ? (
                        config.tabIndex < config.tabs.length ? (
                            <div>{leaves[config.tabs[config.tabIndex]].element}</div>
                        ) : (
                            <div style={{ width: "100%", height: "100%" }} />
                        )
                    ) : (
                        config.children.map((c, i) => (
                            <NestedPanel
                                key={i}
                                config={c}
                                leaves={leaves}
                                saveSizes={handleSaveSizes}
                                index={i}
                                onResize={handleResize}
                                isLast={i === config.children.length - 1}
                                direction={config.kind}
                                panelElements={panelElements}
                            />
                        ))
                    )}
                </div>
                {!isLast && direction === "column" && (
                    <div className="resize-border bottom" onMouseDown={(e) => handleMouseDown(e, "bottom")} />
                )}
                {!isLast && direction === "row" && (
                    <div className="resize-border right" onMouseDown={(e) => handleMouseDown(e, "right")} />
                )}
            </div>
        );
    },
);

const Overlay = ({
    panelElements,
    onDrop,
}: {
    panelElements: React.MutableRefObject<Map<LayoutConfig, HTMLDivElement>>;
    onDrop: (zone: Zone, name: string) => void;
}) => {
    const closestRef = useRef<Zone>(null);
    const lastItem = useRef<DnDItem | null>(null);

    let lastPlaceholder = useRef<HTMLDivElement | null>(null);
    const clearDnDState = () => {
        setTimeout(() => {
            if (lastItem.current) {
                lastItem.current.handleElement.style.display = "block";
                lastItem.current = null;
            }
        }, 0);
        if (lastPlaceholder.current) {
            lastPlaceholder.current.style.width = "0px";
            lastPlaceholder.current.style.transition = "0s linear";
            setTimeout(() => {
                lastPlaceholder.current!.style.transition = "0.1s linear";
            }, 0);
        }
    };
    const dropRef = useDrop(
        () => ({
            accept: "TabHeader",
            drop: (item: DnDItem) => {
                clearDnDState();
                onDrop(closestRef.current!, item.name);
            },
        }),
        [onDrop],
    )[1];
    const dragDropManager = useDragDropManager();
    const monitor = dragDropManager.getMonitor();

    const subscribeRef = useRef<any>(null);
    useEffect(() => {
        monitor.subscribeToStateChange(() => {
            const draggedItem = monitor.getItem();
            if (!monitor.isDragging() && lastItem.current?.handleElement.previousSibling) {
                (lastItem.current.handleElement.previousSibling as any).style.height = "0px";
                clearDnDState();
            }
            if (monitor.getItemType() === "TabHeader" && monitor.isDragging() && !subscribeRef.current) {
                const placeholder = draggedItem.handleElement.previousSibling;
                if (placeholder) {
                    placeholder.style.height = draggedItem.handleElement.offsetHeight + "px";
                }
                const overlay = overlayRef.current!;
                let zones: Zone[] = [];
                for (const [config, element] of panelElements.current.entries()) {
                    const rect = element.getBoundingClientRect();
                    const { left, top, width, height } = rect;
                    const pushZone = (
                        index: "LEFT" | "RIGHT" | "TOP" | "BOTTOM" | "CENTER" | "TAB",
                        left: number,
                        top: number,
                        width: number,
                        height: number,
                    ) => {
                        const rect = { left, top, width, height };
                        zones.push({ rect, config, index, element });
                    };
                    if (config.kind === "leaf") {
                        pushZone("TOP", left, top, width, height / 2);
                        pushZone("BOTTOM", left, top + height / 2, width, height / 2);
                        pushZone("LEFT", left, top, width / 2, height);
                        pushZone("RIGHT", left + width / 2, top, width / 2, height);
                        pushZone("CENTER", left, top, width, height);
                        pushZone("TAB", left, top, width, getPanelElementHeader(element).offsetHeight);
                    } else {
                        if (config.kind === "row" || config.nesting === 0) {
                            const zoneWidth = width / (config.kind === "row" ? config.children.length + 1 : 2);
                            pushZone("LEFT", left, top, zoneWidth, height);
                            pushZone("RIGHT", left + width - zoneWidth, top, zoneWidth, height);
                        }
                        if (config.kind === "column" || config.nesting === 0) {
                            const zoneHeight = height / (config.kind === "column" ? config.children.length + 1 : 2);
                            pushZone("TOP", left, top, width, zoneHeight);
                            pushZone("BOTTOM", left, top + height - zoneHeight, width, zoneHeight);
                        }
                    }
                }
                if (!zones.length) return;
                overlay.style.display = "block";
                overlay.style.transition = "0s linear";

                lastItem.current = draggedItem;
                draggedItem.handleElement!.nextSibling.style.transition = "0.0s linear";
                draggedItem.handleElement!.nextSibling.style.width =
                    draggedItem.handleElement!.getBoundingClientRect().offsetWidth + "px";
                lastPlaceholder.current = draggedItem.handleElement!.nextSibling;

                subscribeRef.current = monitor.subscribeToOffsetChange(() => {
                    let candidateZones = zones;
                    const offset = monitor.getClientOffset()!;
                    const draggedItem = monitor.getItem() as {
                        name: string;
                        handleElement: any;
                        width: number;
                    };
                    if (!offset || !draggedItem) return;

                    const overlay = overlayRef.current!;
                    if (overlay.style.transition !== "0.1s linear") {
                        setTimeout(() => {
                            overlay.style.transition = "0.1s linear";
                        }, 0);
                    }

                    draggedItem.handleElement!.style.display = "none";
                    if (draggedItem.handleElement!.nextSibling!.style.transition !== "0.1s linear") {
                        setTimeout(() => {
                            draggedItem.handleElement!.nextSibling!.style.transition = "0.1s linear";
                        }, 0);
                    }

                    const { left: offsetX, top: offsetY } = overlay.parentElement!.getBoundingClientRect();
                    const closest = candidateZones
                        .map((zone, i) => {
                            if (zone.index === "TAB") {
                                if (
                                    offset.x > zone!.rect.left &&
                                    offset.x < zone!.rect.left + zone!.rect.width &&
                                    offset.y > zone!.rect.top - zone!.rect.height &&
                                    offset.y < zone!.rect.top + zone!.rect.height * 2
                                ) {
                                    return {
                                        ...zone,
                                        distance: -100000 + Math.abs(zone!.rect.top - offset.y),
                                    };
                                } else {
                                    return { ...zone, distance: 100000 };
                                }
                            }

                            const center = {
                                x: zone.rect.left + zone.rect.width / 2,
                                y: zone.rect.top + zone.rect.height / 2,
                            };
                            // const area = (zone.rect.width * zone.rect.height) / (containerRef.current!.offsetWidth * containerRef.current!.offsetHeight);
                            const distance = Math.sqrt(
                                Math.pow(center.x - offset.x, 2) + Math.pow(center.y - offset.y, 2),
                            ); // / Math.sqrt(area);
                            return { ...zone, distance };
                        })
                        .sort((a, b) => a.distance - b.distance)[0];
                    closestRef.current = closest;
                    dropRef(closest.element);
                    overlay.style.left = `${closest.rect.left - offsetX}px`;
                    overlay.style.top = `${closest.rect.top - offsetY}px`;
                    overlay.style.width = `${closest.rect.width}px`;
                    overlay.style.height = `${closest.rect.height}px`;

                    if (closest.index === "TAB") {
                        // Lookup tab-placeholder nodes in the closest.element dom node
                        const tabPlaceholders: HTMLDivElement[] = Array.from(
                            closest.element.querySelectorAll(".tab-placeholder"),
                        );
                        const closestPlaceholder = tabPlaceholders
                            .filter((element) => element.getAttribute("data-panel-name") !== draggedItem.name)
                            .map((element, i) => {
                                const rect = element.getBoundingClientRect();
                                return {
                                    before: element.getAttribute("data-panel-name"),
                                    element: element,
                                    distance: Math.abs(rect.left + rect.width / 2 - offset.x),
                                };
                            })
                            .sort((a, b) => a.distance - b.distance)[0];
                        if (lastPlaceholder.current && lastPlaceholder.current !== closestPlaceholder.element) {
                            lastPlaceholder.current.style.width = "0px";
                        }
                        closestPlaceholder.element.style.width = draggedItem.width + "px";

                        lastPlaceholder.current = closestPlaceholder.element;
                        closest.before = closestPlaceholder.before!;
                    } else if (lastPlaceholder.current) {
                        lastPlaceholder.current.style.width = "0px";
                    }
                });
            } else if (subscribeRef.current && !monitor.isDragging()) {
                subscribeRef.current();
                subscribeRef.current = null;
                overlayRef.current!.style.display = "none";
                overlayRef.current!.style.left = "0";
                overlayRef.current!.style.top = "0";
                overlayRef.current!.style.width = "0";
                overlayRef.current!.style.height = "0";
            }
        });
    }, [monitor, onDrop]);

    const overlayRef = useRef<HTMLDivElement>(null);
    return <div className="tab-handle-overlay" ref={overlayRef} />;
};

export function Layout(props: {
    children: React.ReactElement<PanelProps>[] | React.ReactElement<PanelProps>;
    defaultConfig?: LayoutConfig;
    wrapDnd?: boolean;
}) {
    const children = React.Children.toArray(props.children) as React.ReactElement<PanelProps>[];
    const namedChildren = Object.fromEntries(
        children.map((c, i) => [
            c.props.name || (c.key !== null ? c.key.toString().slice(2) : `unnamed-${i}`),
            {
                element: c.props.children as any,
                header: c.props.header,
            },
        ]),
    );
    const panelElements = useRef<Map<LayoutConfig, HTMLDivElement>>(new Map());
    const [rootConfig, setRootConfig] = useState<LayoutConfig>(
        props.defaultConfig || {
            kind: "row",
            size: 1,
            nesting: 0,
            children: children.map((c, i) => ({
                kind: "leaf",
                nesting: 1,
                tabs: [c.props.name || (c.key !== null ? c.key.toString().slice(2) : `unnamed-${i}`)],
                tabIndex: 0,
                size: 100 / children.length,
            })),
        },
    );
    let config = rootConfig;

    if (rootConfig.kind !== "leaf" || rootConfig.tabs.length > 0) {
        const newConfig = filterPanels(Object.keys(namedChildren), rootConfig);
        if (newConfig !== rootConfig) {
            config = newConfig || { kind: "leaf", tabs: [], tabIndex: 0, size: 100, nesting: 0 };
            setRootConfig(config);
        }
    }

    const handleDrop = (zone: Zone, name: string) => {
        console.log(zone, name);
        const newConfig = movePanel(zone, name, rootConfig);
        setRootConfig(newConfig!);
    };

    const container = (
        <div className="container">
            <NestedPanel leaves={namedChildren} config={config} panelElements={panelElements.current} />
            <Overlay panelElements={panelElements} onDrop={handleDrop} />
        </div>
    );
    if (props.wrapDnd) {
        return <DndProvider backend={HTML5Backend}>{container}</DndProvider>;
    }
    return container;
}
