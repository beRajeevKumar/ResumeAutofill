import React from 'react';
import RegistrationForm from './components/RegistrationForm';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <header className="w-full max-w-3xl mb-8">
        <h1 className="text-3xl font-bold text-slate-800">HiTouchCX</h1>
      </header>
      <main className="w-full max-w-3xl">
        <RegistrationForm />
      </main>
    </div>
  );
};

export default App;