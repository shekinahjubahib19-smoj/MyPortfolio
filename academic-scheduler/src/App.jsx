/** 
security: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
cd landing-page-1 
..\node-v24.15.0-win-x64\npm.cmd install **/
/**Run daily: ..\node-v24.15.0-win-x64\npm.cmd run dev 

short cut:

$env:Path += ";C:\xampp\htdocs\Portfolio\node-v24.15.0-win-x64"

Now, for the rest of that session, you can just type:npm.cmd run dev

..\node-v24.15.0-win-x64\npm.cmd install @tailwindcss/postcss postcss
**/

import React from 'react';
import LandingPage from './pages/landing-page';

function App() {
  return (
    <LandingPage />
  );
}

export default App;