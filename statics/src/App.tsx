import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Chat from "./pages/Chat";
import Tasks from "./pages/Tasks";
import Notes from "./pages/Notes";
import Calendar from "./pages/Calendar";
import Memory from "./pages/Memory";
import Settings from "./pages/Settings";
import { ThemeProvider } from "./components/ThemeProvider";
import { ToastProvider } from "./components/ToastProvider";
import Background from "./components/Background";

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Background />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Chat />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/memory" element={<Memory />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
