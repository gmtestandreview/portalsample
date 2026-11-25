import {
  createBrowserRouter,
  type RouteObject,
  Link,
} from "react-router";
import {
  RouterProvider as Provider,
} from "react-router/dom";
import type { LinkProps } from 'react-router';
import { RouterProvider } from "react-router/dom";
export { createBrowserRouter as makeRouter, type RouteObject as Routes } from 'react-router';
export { RouterProvider } from "react-router/dom";
import { Link as ExistingLink } from "react-router";
import { RouterProvider as DOMProvider } from "react-router/dom";

const unrelated = "react-router-dom";
// import { Link } from "react-router-dom";
