/** 
security: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

..\node-v24.15.0-win-x64\npm.cmd install **/
/**Run daily: ..\node-v24.15.0-win-x64\npm.cmd run dev 

..\node-v24.15.0-win-x64\npm.cmd install @tailwindcss/postcss postcss

short cut:

1. cd academic-scheduler

2. $env:Path += ";C:\xampp\htdocs\Portfolio\node-v24.15.0-win-x64"

3. npm.cmd run dev

**/

import React from 'react';
import LandingPage from './pages/landing-page';

function App() {
  return (
    <LandingPage />
  );
}

export default App;