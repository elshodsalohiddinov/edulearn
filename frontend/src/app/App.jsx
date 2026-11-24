// Barcha sahifalar va ularga kim kira olishi (marshrutlar xaritasi).
import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import { ConfirmProvider } from '../components/Modal';
import ProtectedRoute, { GuestOnly } from '../components/ProtectedRoute';
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';

import Home from '../pages/public/Home';
import Courses from '../pages/public/Courses';
import CourseDetail from '../pages/public/CourseDetail';
import Teachers, { TeacherProfile } from '../pages/public/Teachers';
import { About, Contact } from '../pages/public/Static';
import NotFound from '../pages/public/NotFound';
import { ForgotPassword, Login, Register } from '../pages/auth/AuthPages';
import { PageLoader } from '../components/ui';

// Panellar alohida fayllarga bo'linadi (code splitting): mehmon admin panel kodini yuklamaydi
const named = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const StudentDashboard = named(() => import('../pages/student/StudentPages'), 'StudentDashboard');
const StudentCourses = named(() => import('../pages/student/StudentPages'), 'StudentCourses');
const MyCourses = named(() => import('../pages/student/StudentPages'), 'MyCourses');
const Learn = lazy(() => import('../pages/student/Learn'));
const TeacherDashboard = named(() => import('../pages/teacher/TeacherPages'), 'TeacherDashboard');
const TeacherCourses = named(() => import('../pages/teacher/TeacherPages'), 'TeacherCourses');
const CourseForm = named(() => import('../pages/teacher/TeacherPages'), 'CourseForm');
const CourseLessons = named(() => import('../pages/teacher/CourseLessons'), 'CourseLessons');
const CourseStudents = named(() => import('../pages/teacher/CourseLessons'), 'CourseStudents');
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminUsers = named(() => import('../pages/admin/AdminPages'), 'AdminUsers');
const AdminCourses = named(() => import('../pages/admin/AdminPages'), 'AdminCourses');
const AdminCategories = named(() => import('../pages/admin/AdminPages'), 'AdminCategories');
const AdminMessages = named(() => import('../pages/admin/AdminPages'), 'AdminMessages');

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ---------- Ommaviy sahifalar (login shart emas) ---------- */}
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:slug" element={<CourseDetail />} />
              <Route path="teachers" element={<Teachers />} />
              <Route path="teachers/:id" element={<TeacherProfile />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* ---------- Faqat kirmaganlar uchun ---------- */}
            <Route element={<GuestOnly />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>
            <Route path="forgot-password" element={<ForgotPassword />} />

            {/* ---------- Talaba ---------- */}
            <Route path="student" element={<ProtectedRoute roles={['STUDENT']} />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="courses" element={<StudentCourses />} />
                <Route path="my-courses" element={<MyCourses />} />
                <Route path="learn/:courseId/:lessonId?" element={<Learn />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* ---------- O'qituvchi ---------- */}
            <Route path="teacher" element={<ProtectedRoute roles={['TEACHER']} />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="courses" element={<TeacherCourses />} />
                <Route path="courses/new" element={<CourseForm />} />
                <Route path="courses/:id/edit" element={<CourseForm />} />
                <Route path="courses/:id/lessons" element={<CourseLessons />} />
                <Route path="courses/:id/students" element={<CourseStudents />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* ---------- Super admin ---------- */}
            <Route path="admin" element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="messages" element={<AdminMessages />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>
          </Routes>
          </Suspense>
          <Toaster position="top-right" toastOptions={{ duration: 3500, style: { borderRadius: '12px', fontSize: '14px' } }} />
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
