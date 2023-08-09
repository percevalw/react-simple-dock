import React from "react";

export type LeafLayoutConfig = {
  kind: "leaf";
  tabs: string[];
  tabIndex: number;
  size: number;
};

export type ContainerLayoutConfig = {
  kind: "row" | "column";
  children: LayoutConfig[];
  size: number;
};

export type LayoutConfig = LeafLayoutConfig | ContainerLayoutConfig;

export type PanelProps = {
  children: React.ReactNode;
  name?: string;
  header?: React.ReactNode;
};

export type Zone = {
  rect: { left: number; top: number; width: number; height: number };
  config: LayoutConfig;
  index: number;
  element: HTMLElement;
  before?: string;
};

export type DnDItem = { name: string; handleElement: HTMLDivElement };
