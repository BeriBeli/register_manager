import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { ProjectView } from "./pages/ProjectView";

import { ExportPage } from "./pages/Export";
import { DocsPage } from "./pages/Docs";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="project/:id" element={<ProjectView />} />
        <Route path="export" element={<ExportPage />} />
        <Route path="docs" element={<DocsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
