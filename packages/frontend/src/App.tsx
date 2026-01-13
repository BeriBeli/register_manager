import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Projects } from "./pages/Projects";
import { ProjectView } from "./pages/ProjectView";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Projects />} />
        <Route path="project/:id" element={<ProjectView />} />
      </Route>
    </Routes>
  );
}

export default App;
