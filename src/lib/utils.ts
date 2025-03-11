import { Zone, LayoutConfig, ContainerLayoutConfig, LeafLayoutConfig } from "./types";

/**
 * Simplifies a layout configuration by flattening nested layouts with the same kind.
 *
 * If the layout configuration is a row or column, this function will flatten any nested child configurations
 * that have the same kind as the parent. It recalculates the size of nested items based on their parent's size.
 *
 * @param config - The layout configuration to simplify.
 * @returns The simplified layout configuration.
 */
const simplifyLayout = (config: LayoutConfig) => {
    if (config.kind === "row" || config.kind === "column") {
        let expandedChildren: LayoutConfig[] = [];
        let changed = false;
        config.children.forEach((child) => {
            if (child.kind === (config as LayoutConfig).kind) {
                changed = true;
                const totalChildContainerSize = (child as ContainerLayoutConfig).children.reduce(
                    (a, b) => a + b.size,
                    0,
                );
                (child as ContainerLayoutConfig).children.forEach((grandChild) => {
                    expandedChildren.push({
                        ...grandChild,
                        size: (child.size * grandChild.size) / totalChildContainerSize,
                    });
                });
            } else {
                expandedChildren.push(child);
            }
        });
        if (changed) {
            config = { ...config, children: expandedChildren };
        }
    }
    return config;
};

/**
 * Recomputes the nesting levels of a layout configuration, inplace.
 *
 * Traverses the layout configuration tree and updates the nesting level of each node
 * based on the nesting level of its parent.
 *
 * @param config - The layout configuration to recompute nesting levels for.
 * @param nesting - The nesting level of the parent node.
 * @returns The updated layout configuration with recomputed nesting levels.
 */
const recomputeNesting_ = (config: LayoutConfig, nesting: number): LayoutConfig => {
    config.nesting = nesting;
    if (config.kind !== "leaf") {
        config.children.forEach((child) => recomputeNesting_(child, nesting + 1));
    }
    return config;
};

/**
 * Moves a panel within the layout based on a drop zone and panel name.
 *
 * This function traverses the layout config tree, removing the panel from its original position,
 * and re-inserting it based on the provided drop zone. It handles both leaf and container nodes,
 * ensuring proper size calculations and layout updates.
 *
 * @param zone - The drop zone where the panel is to be moved.
 * @param name - The name of the panel being moved.
 * @param inside - The layout config in which the move operation takes place.
 * @returns The updated layout config after moving the panel.
 */
export const movePanel = (zone: Zone | null, name: string, inside: LayoutConfig) => {
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
                    nesting: -1,
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
                const newConfigKind = zone.index === "TOP" || zone.index === "BOTTOM" ? "column" : "row";
                if (config.kind === newConfigKind) {
                    const newZone: LayoutConfig = {
                        kind: "leaf",
                        tabs: [name],
                        tabIndex: 0,
                        nesting: -1,
                        size: (totalSize * fraction) / (1 - fraction),
                    };
                    config = {
                        ...config,
                        children:
                            zone.index === "LEFT" || zone.index === "TOP"
                                ? [newZone, ...config.children.map(editLayout).filter((c) => c !== null)]
                                : [...config.children.map(editLayout).filter((c) => c !== null), newZone],
                    } as LayoutConfig;
                } else {
                    const newZone: LayoutConfig = {
                        kind: "leaf",
                        tabs: [name],
                        tabIndex: 0,
                        nesting: -1,
                        size: 50,
                    };
                    const oldConfig = {
                        ...config,
                        // Remove the panel that is being moved
                        children: config.children.map(editLayout).filter((c) => c !== null),
                        size: 50,
                        nesting: -1,
                    };
                    config = {
                        kind: newConfigKind,
                        children:
                            zone.index === "TOP" || zone.index === "LEFT" ? [newZone, oldConfig] : [oldConfig, newZone],
                        size: config.size,
                        nesting: -1,
                    };
                }
            }
            // Or it's a leaf zone
            else if (config.kind === "leaf") {
                if (zone.index === "CENTER") {
                    const newTabs = [...config.tabs.filter((tabName) => tabName !== name), name];
                    config = {
                        ...config,
                        tabs: newTabs,
                        tabIndex: newTabs.length - 1,
                    };
                } else if (zone.index === "TAB") {
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
                    const newZone: LayoutConfig = {
                        kind: "leaf",
                        tabs: [name],
                        tabIndex: 0,
                        nesting: -1,
                        size: 50,
                    };
                    config = {
                        kind: zone.index === "TOP" || zone.index === "BOTTOM" ? "column" : "row",
                        children:
                            zone.index === "TOP" || zone.index === "LEFT"
                                ? [newZone, { ...config, nesting: -1, size: 50 }]
                                : [{ ...config, size: 50, nesting: -1 }, newZone],
                        size: config.size,
                        nesting: config.nesting,
                    };
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
                    config = { ...config, children };
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

    return recomputeNesting_(editLayout(inside), 0);
};

/**
 * Filters panels from a layout configuration based on a provided list of panel names.
 *
 * Traverses the layout configuration tree and removes any panels (or tabs within panels)
 * whose names are not included in the specified list. It simplifies nodes by filtering
 * out unwanted tabs and recursively updating container nodes.
 *
 * @param names - An array of panel names that should remain in the layout.
 * @param inside - The layout configuration to filter.
 * @returns The updated layout configuration with only the specified panels, or null if empty.
 */
export const filterPanels = (names: string[], inside: LayoutConfig) => {
    const editLayout = (visitedConfig: LayoutConfig): LayoutConfig | null => {
        let config: LayoutConfig | null = visitedConfig;
        if (config.kind === "leaf" && !(config as LeafLayoutConfig).tabs.every((name) => names.includes(name))) {
            /* If it's a simple leaf, try to remove the matching tab if it was
             * the tab that was picked by the user (since we're moving it) */
            config = {
                ...config,
                tabs: config.tabs.filter((name) => names.includes(name)),
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
                    config = { ...config, children };
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
