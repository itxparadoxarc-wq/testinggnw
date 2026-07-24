import { createFileRoute } from "@tanstack/react-router";
import App from "../App";

// Delegate to the React Router app. The root component already renders <App />,
// so this route file just satisfies the router tree.
export const Route = createFileRoute("/")({
  component: App,
});
