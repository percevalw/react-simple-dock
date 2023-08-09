import {Zone, LayoutConfig, ContainerLayoutConfig, LeafLayoutConfig} from "./types";

const simplifyLayout = (config: LayoutConfig) => {
    if (config.kind === "row" || config.kind === "column") {
        let expandedChildren: LayoutConfig[] = [];
        let changed = false;
        config.children.forEach((child) => {
            if (child.kind === (config as LayoutConfig).kind) {
                changed = true;
                const totalChildContainerSize = (
                    child as ContainerLayoutConfig
                ).children.reduce((a, b) => a + b.size, 0);
                (child as ContainerLayoutConfig).children.forEach((grandChild) => {
                    expandedChildren.push({
                        ...grandChild,
                        size: (child.size * totalChildContainerSize) / grandChild.size,
                    });
                });
            } else {
                expandedChildren.push(child);
            }
        });
        if (changed) {
            config = {...config, children: expandedChildren};
        }
    }
    return config;
}

export const movePanel = (zone: Zone | null, name: string, inside: LayoutConfig) => {
    // if (zone.config.kind === "leaf" && zone.config.tabs.includes(name)) {
    //   return;
    // }
    const editLayout = (visitedConfig: LayoutConfig): LayoutConfig | null => {
        let config: LayoutConfig | null = visitedConfig;
        if (config.kind === "leaf" && config.tabs.includes(name)) {
            /* If it's a simple leaf, try to remove the matching tab if it was
             * the tab that was picked by the user (since we're moving it) */
            const newTabs = config.tabs.filter((tabName) => tabName !== name);
            config = {
                ...config,
                tabs: newTabs,
                tabIndex: Math.min(newTabs.length - 1, config.tabIndex),
            };
            if (config.tabs.length === 0) {
                config = null;
            }
        }
        /* If this zone is the zone targeted as drop-zone by the user */
        if (zone && visitedConfig === zone.config) {
            if (config === null) {
                return {
                    kind: "leaf",
                    tabs: [name],
                    tabIndex: 0,
                    size: visitedConfig.size,
                };
            }
            // or it's a container zone
            else if (config.kind === "row" || config.kind === "column") {
                const totalSize = config.children.reduce((a, b) => a + b.size, 0);
                const fraction =
                    config.kind === "column"
                        ? zone.rect.height / zone.element.parentElement!.offsetHeight
                        : zone.rect.width / zone.element.parentElement!.offsetWidth;
                // x / (y + x) = a
                // x = a y + a x
                // x = a y / ( 1 - a )
                const newZone: LayoutConfig = {
                    kind: "leaf",
                    tabs: [name],
                    tabIndex: 0,
                    size: (totalSize * fraction) / (1 - fraction),
                };
                config = {
                    ...config,
                    children:
                        zone.index === 0
                            ? [
                                newZone,
                                ...config.children.map(editLayout).filter((c) => c !== null),
                            ]
                            : [
                                ...config.children.map(editLayout).filter((c) => c !== null),
                                newZone,
                            ],
                } as LayoutConfig;
            }
            // Or it's a leaf zone
            else if (config.kind === "leaf") {
                const newZone: LayoutConfig = {
                    kind: "leaf",
                    tabs: [name],
                    tabIndex: 0,
                    size: 50,
                };
                if (zone.index < 4) {
                    config = {
                        kind: zone.index === 0 || zone.index === 1 ? "column" : "row",
                        children:
                            zone.index === 0 || zone.index === 2
                                ? [newZone, {...config, size: 50}]
                                : [{...config, size: 50}, newZone],
                        size: config.size,
                    };
                } else if (zone.index === 4) {
                    const newTabs = [
                        ...config.tabs.filter((tabName) => tabName !== name),
                        name,
                    ];
                    config = {
                        ...config,
                        tabs: newTabs,
                        tabIndex: newTabs.length - 1,
                    };
                } else if (zone.index === 5) {
                    const newTabs = [...config.tabs];
                    let insertIndex = newTabs.findIndex((tabName) => tabName === zone.before);
                    if (insertIndex === -1) {
                        insertIndex = newTabs.length;
                    }
                    newTabs.splice(insertIndex!, 0, name);
                    config = {
                        ...config,
                        tabs: newTabs,
                        tabIndex: insertIndex!,
                    };
                } else {
                    throw new Error(`Zone type ${zone.index} not implemented`);
                }
            }
        }
        // If there is nothing left after removing the dropped zone
        else if (config === null) {
            return null;
        }
        // Otherwise, recurse into the node
        else {
            let hasChanged = false;
            if (config.kind !== "leaf") {
                const children = config.children
                    .map((child) => {
                        const updated = editLayout(child);
                        if (updated !== child) {
                            hasChanged = true;
                        }
                        return updated;
                    })
                    .filter((child) => child !== null) as LayoutConfig[];
                if (hasChanged) {
                    config = {...config, children};
                }
            }
        }
        if (
            (config.kind === "leaf" && config.tabs.length === 0) ||
            (config.kind !== "leaf" && config.children.length === 0)
        ) {
            return null;
        }
        /* Simplify a node of the layout by flattening row children of rows
         * or column children of columns */
        config = simplifyLayout(config);
        return config;
    };
    return editLayout(inside);
};


export const filterPanels = (names: string[], inside: LayoutConfig) => {
    const editLayout = (visitedConfig: LayoutConfig): LayoutConfig | null => {
        let config: LayoutConfig | null = visitedConfig;
        if (config.kind === "leaf" && !(config as LeafLayoutConfig).tabs.every(name => names.includes(name))) {
            /* If it's a simple leaf, try to remove the matching tab if it was
             * the tab that was picked by the user (since we're moving it) */
            config = {
                ...config,
                tabs: config.tabs.filter(name => names.includes(name)),
                tabIndex: Math.min(config.tabs.length - 1, config.tabIndex),
            };
            if (config.tabs.length === 0) {
                config = null;
            }
        }
        // If there is nothing left after removing the dropped zone
        if (config === null) {
            return null;
        }
        // Otherwise, recurse into the node
        else {
            let hasChanged = false;
            if (config.kind !== "leaf") {
                const children = config.children
                    .map((child) => {
                        const updated = editLayout(child);
                        if (updated !== child) {
                            hasChanged = true;
                        }
                        return updated;
                    })
                    .filter((child) => child !== null) as LayoutConfig[];
                if (hasChanged) {
                    config = {...config, children};
                }
            }
        }
        if (
            (config.kind === "leaf" && config.tabs.length === 0) ||
            (config.kind !== "leaf" && config.children.length === 0)
        ) {
            return null;
        }
        /* Simplify a node of the layout by flattening row children of rows
         * or column children of columns */
        config = simplifyLayout(config);
        return config;
    };
    return editLayout(inside);
};
