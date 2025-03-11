import React from "react";

const LEFT = 0;
const RIGHT = 1;
const TOP = 2;
const BOTTOM = 3;
const TAB = 4;

/**
 * Leaf layout configuration.
 *
 * Represents a panel that contains one or more tabs along with the current tab index and its size.
 */
export type LeafLayoutConfig = {
  kind: "leaf";
  tabs: string[];
  tabIndex: number;
  size: number;
  nesting?: number;
};

/**
 * Container layout configuration.
 *
 * Represents a container panel that arranges its child panels in either a row or a column.
 */
export type ContainerLayoutConfig = {
  kind: "row" | "column";
  children: LayoutConfig[];
  size: number;
  // At the moment, we only use nesting to detect if a container is the root container.
  nesting?: number;
};

/**
 * Layout configuration.
 *
 * A union type that represents either a leaf panel (with tabs) or a container panel (row/column with children).
 */
export type LayoutConfig = LeafLayoutConfig | ContainerLayoutConfig;

/**
 * Properties for a panel component.
 *
 * Defines the children to render within the panel, an optional name, and an optional header.
 */
export type PanelProps = {
  children: React.ReactNode;
  name?: string;
  header?: React.ReactNode;
};

/**
 * Represents a drop zone within the layout.
 *
 * Includes the rectangular coordinates, the associated layout configuration,
 * an a to indicate the drop position, and a reference to the related DOM element.
 */
export type Zone = {
  rect: { left: number; top: number; width: number; height: number };
  config: LayoutConfig;
  index: "LEFT" | "RIGHT" | "TOP" | "BOTTOM" | "CENTER" | "TAB";
  element: HTMLElement;
  before?: string;
};

/**
 * Drag and drop item for tab header drag operations.
 *
 * Contains the panel name and a reference to the draggable element.
 */
export type DnDItem = { name: string; handleElement: HTMLDivElement };