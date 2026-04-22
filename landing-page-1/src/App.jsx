import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-10 py-6 max-w-7xl mx-auto">
        <div className="text-xl font-black tracking-tighter">STUDENT.DEV</div>
        <div className="hidden md:flex gap-8 font-medium text-sm uppercase tracking-widest">
          <a href="#" className="hover:text-blue-600 transition">Portfolio</a>
          <a href="#" className="hover:text-blue-600 transition">Internship</a>
          <a href="#" className="hover:text-blue-600 transition">Contact</a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-10 pt-20 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-7xl font-extrabold leading-[1.1] tracking-tight mb-8">
              Turning Code <br />
              <span className="text-blue-600 italic">Into Solutions.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-10 max-w-md leading-relaxed">
              22-year-old IT Student at CTU. Currently building asset management systems and modern web experiences.
            </p>
            
            <div className="flex gap-4">
              <button className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold hover:bg-blue-600 transition duration-300">
                View My Projects
              </button>
              <button className="border-2 border-slate-200 px-8 py-4 rounded-full font-bold hover:border-slate-900 transition duration-300">
                Read My Story
              </button>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative">
            <div className="w-full aspect-square bg-slate-100 rounded-3xl overflow-hidden flex items-center justify-center border border-slate-200">
              <div className="text-center">
                <div className="text-5xl mb-4">🚀</div>
                <p className="text-slate-400 font-medium tracking-widest uppercase text-xs">Project Preview Area</p>
              </div>
            </div>
            {/* A small floating "Stat" card for detail */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
              <p className="text-2xl font-bold text-slate-900">720+</p>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Internship Hours</p>
            </div>
          </div>
        </div>
      </main>

      {/* Skills Section Tag */}
      <section className="bg-slate-50 py-20 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-10 flex flex-wrap justify-between items-center gap-8 opacity-50 grayscale">
          <span className="font-bold text-2xl">REACT</span>
          <span className="font-bold text-2xl">LARAVEL</span>
          <span className="font-bold text-2xl">TAILWIND</span>
          <span className="font-bold text-2xl">MYSQL</span>
        </div>
      </section>
    </div>
  );
}

export default App;