import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Claims from './pages/Claims';
import Policies from './pages/Policies';
import FraudAlerts from './pages/FraudAlerts';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import DeepfakeDetection from './pages/DeepfakeDetection';
import NetworkGraph from './pages/NetworkGraph';
import FraudLens from './pages/FraudLens';
import SplashScreen from './components/SplashScreen';

function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      <AnimatePresence>
        {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
      </AnimatePresence>

      {splashDone && (
        <Router>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="alerts" element={<FraudAlerts />} />
              <Route path="claims" element={<Claims />} />
              <Route path="policies" element={<Policies />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="forensic" element={<DeepfakeDetection />} />
              <Route path="network-graph" element={<NetworkGraph />} />
              <Route path="users" element={<Users />} />
              <Route path="fraudlens" element={<FraudLens />} />
            </Route>
          </Routes>
        </Router>
      )}
    </>
  );
}

export default App;
