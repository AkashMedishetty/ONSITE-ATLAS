import RegistrationDetail from './pages/event/RegistrationDetail';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/events/:eventId/registrations/:registrationId" element={
            <PrivateRoute>
              <Layout>
                <RegistrationDetail />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/events/:eventId/edit-registration/:registrationId" element={
            <PrivateRoute>
              <Layout>
                <EventEditPage />
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 