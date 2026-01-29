import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { getLecturerOnboardingStatus } from '../services/lecturerProfile.service';

const roleHome = {
  superadmin: '/superadmin',
  admin: '/admin',
  lecturer: '/lecturer',
  management: '/management',
};

export default function RequireRole({ allowed, children }) {
  const { authUser, isCheckingAuth } = useAuthStore();
  const location = useLocation();
  const [onboardingStatus, setOnboardingStatus] = useState({ loading: false, complete: true });

  useEffect(()=>{
    let ignore=false;
    async function check(){
      if(!authUser || authUser.role !== 'lecturer') {
        // Reset to default for non-lecturers
        setOnboardingStatus({ loading: false, complete: true });
        return;
      }
      setOnboardingStatus(s=>({...s,loading:true}));
      try{
        const data = await getLecturerOnboardingStatus();
        if(!ignore){
          setOnboardingStatus({ loading:false, complete: !!data?.complete });
        }
      }catch(err){ 
        console.error('Failed to check onboarding status:', err);
        if(!ignore) setOnboardingStatus({ loading:false, complete:true }); 
      }
    }
    check();
    return ()=>{ ignore=true; };
  },[authUser, location.pathname]); // Re-check when location changes

  // While auth state is being verified, render nothing (parent can show global loader)
  if (isCheckingAuth) return null;

  if (!authUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (allowed && !allowed.includes(authUser.role)) {
    // If user has a different allowed role, let them stay on their own home, otherwise login
    return <Navigate to={roleHome[authUser.role] || '/login'} replace />;
  }

  // Lecturer onboarding gate: if lecturer accessing any lecturer route except /onboarding and not complete -> redirect
  if(authUser.role==='lecturer'){
    const pathname = location.pathname;
    const isOnboardingPage = pathname.startsWith('/onboarding');
    if(onboardingStatus.loading) return null; // wait
    if(!onboardingStatus.complete && !isOnboardingPage){
      return <Navigate to="/onboarding" replace state={{ from: pathname }} />;
    }
    if(onboardingStatus.complete && isOnboardingPage){
      return <Navigate to="/lecturer" replace />;
    }
  }

  return children;
}
