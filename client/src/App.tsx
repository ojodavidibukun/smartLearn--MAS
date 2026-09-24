import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import loginDummy from "./pages/Logindummy"; // dummy login page
import signUp from "./pages/signUp";
import StudentDashboard from "./pages/StudentDashboard";
import Explore from "./pages/Explore";
import LecturerDashboard from "./pages/LecturerDashboard";
import LecturerProfile from "./pages/LecturerProfile";
import DebugUserLookup from "./pages/DebugUserLookup";
import CourseDetails from "./pages/CourseDetails";
import LecturerCourseManager from "./pages/LecturerCourseManager";
import LecturerLearning from "./pages/LecturerLearning";
import FacilitatorCourses from "./pages/FacilitatorCourses";
import CreateCourse from "./pages/CreateCourse";
import Learning from "./pages/Learning";
import Performance from "./pages/Performance";
import Agents from "./pages/Agents";
import { useEffect, useState } from "react";
import { auth } from "./firebase/config";
import { getDoc, doc, getFirestore } from "firebase/firestore";
import ForgotPassword from "./components/ForgotPassword";
import { ProtectedRoute } from "./pages/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";

const db = getFirestore();

//function to handle Users' respective Role Dashboards
function DashboardRouter() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) return;
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        setRole(docSnap.data().role);
      }
      setLoading(false);
    };
    fetchRole();
  }, [user]);

  if (loading) return <p>Loading...</p>;
  if (!role) return <p>No profile found.</p>;

  return role === "lecturer" ? <LecturerDashboard /> : <StudentDashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={signUp} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/dashboard">
        {/*Protected routes to orevent authorized access */}
        <ProtectedRoute>
          <DashboardRouter />
        </ProtectedRoute>
      </Route>
      <Route path="/explore">
        <ProtectedRoute>
          <Explore />
        </ProtectedRoute>
      </Route>
      <Route path="/lecturer-profile">
        <ProtectedRoute>
          <LecturerProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/course/:courseId">
        <ProtectedRoute>
          <CourseDetails />
        </ProtectedRoute>
      </Route>
      <Route path="/lecturer/manage-courses">
        <ProtectedRoute>
          <LecturerCourseManager />
        </ProtectedRoute>
      </Route>
      <Route path="/lecturer/courses">
        <ProtectedRoute>
          <FacilitatorCourses />
        </ProtectedRoute>
      </Route>
      <Route path="/lecturer/create-course">
        <ProtectedRoute>
          <CreateCourse />
        </ProtectedRoute>
      </Route>
      <Route path="/lecturer/courses/:courseId">
        <ProtectedRoute>
          <LecturerLearning />
        </ProtectedRoute>
      </Route>
      <Route path="/learning" component={Learning} />
      <Route path="/learning/:courseId" component={Learning} />
      <Route path="/performance" component={Performance} />
      <Route path="/agents" component={Agents} />
      <Route path="/debug/user-lookup">
        <ProtectedRoute>
          <DebugUserLookup />
        </ProtectedRoute>
      </Route>
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
