"use client";
import { createContext, useContext } from "react";

export const DemoContext = createContext(false);
export const useIsDemo = () => useContext(DemoContext);
