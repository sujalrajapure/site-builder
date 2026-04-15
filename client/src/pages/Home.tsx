import api from '@/configs/axios';
import { authClient } from '@/lib/auth-client';
import { Loader2Icon } from 'lucide-react';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Home = () => {

  const {data: session} = authClient.useSession()
  const navigate = useNavigate()

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false)

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if(!session?.user){
        return toast.error('Please sign in to create a project')
      }else if(!input.trim()){
        return toast.error('Please enter a message')
      }
      setLoading(true)
      const {data} = await api.post('/api/user/project', {initial_prompt: input});
      setLoading(false);
      navigate(`/projects/${data.projectId}`)
    } catch (error: any) {
      setLoading(false);
      toast.error(error?.response?.data?.message || error.message);
      console.log(error);
    }

  }

  return (
  
      <section className="flex flex-col items-center text-white text-sm pb-20 px-4 font-poppins">

        <a href="https://prebuiltui.com" className="flex items-center gap-2 border border-slate-700 rounded-full p-1 pr-3 text-sm mt-20">
          <span className="bg-indigo-600 text-xs px-3 py-1 rounded-full">NEW</span>
          <p className="flex items-center gap-2">
            <span>Try 30 days free trial option</span>
            <svg className="mt-px" width="6" height="9" viewBox="0 0 6 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m1 1 4 3.5L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </p>
        </a>

        <h1 className="text-center text-[40px] leading-[48px] md:text-6xl md:leading-[70px] mt-4 font-semibold max-w-3xl">
          Turn thoughts into websites instantly, with AI.
        </h1>

        <p className="text-center text-base max-w-md mt-2">
          Create, customize and publish website faster than ever with our AI Site Builder.
        </p>

        <form onSubmit={onSubmitHandler} className="bg-white/10 max-w-2xl w-full rounded-xl p-4 mt-10 border border-indigo-600/70 focus-within:ring-2 ring-indigo-500 transition-all">
          <textarea onChange={e => setInput(e.target.value)} className="bg-transparent outline-none text-gray-300 resize-none w-full" rows={4} placeholder="Describe your presentation in details" required />
          <button className="ml-auto flex items-center gap-2 bg-gradient-to-r from-[#CB52D4] to-indigo-600 rounded-md px-4 py-2">
            {!loading ? 'Create with AI' : (
              <>
              Creating <Loader2Icon className='animate-spin size-4 text-white'/>
              </>
            )}
            
          </button>
        </form>

        <p className="text-gray-500 text-xs mt-16 mb-4 uppercase tracking-widest">Trusted by teams at</p>
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-14 mx-auto">
          {/* Framer */}
          <svg className="h-6 md:h-7 opacity-60 hover:opacity-100 transition-opacity" viewBox="0 0 100 150" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0h100v50H50L0 0zm0 50h50l50 50H0V50zm0 50h50v50L0 100z"/>
          </svg>
          {/* Microsoft */}
          <svg className="h-6 md:h-7 opacity-60 hover:opacity-100 transition-opacity" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="95" height="95" fill="#F25022"/>
            <rect x="105" y="0" width="95" height="95" fill="#7FBA00"/>
            <rect x="0" y="105" width="95" height="95" fill="#00A4EF"/>
            <rect x="105" y="105" width="95" height="95" fill="#FFB900"/>
          </svg>
          {/* Instagram */}
          <svg className="h-6 md:h-7 opacity-60 hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f09433"/>
                <stop offset="25%" stopColor="#e6683c"/>
                <stop offset="50%" stopColor="#dc2743"/>
                <stop offset="75%" stopColor="#cc2366"/>
                <stop offset="100%" stopColor="#bc1888"/>
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#ig-gradient)"/>
            <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="1.8"/>
            <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
          </svg>
          {/* Huawei */}
          <svg className="h-6 md:h-7 opacity-60 hover:opacity-100 transition-opacity" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="white">
            <path d="M50 5 C50 5, 62 20, 62 35 C62 50, 50 55, 50 55 C50 55, 38 50, 38 35 C38 20, 50 5, 50 5Z"/>
            <path d="M95 50 C95 50, 80 62, 65 62 C50 62, 45 50, 45 50 C45 50, 50 38, 65 38 C80 38, 95 50, 95 50Z"/>
            <path d="M50 95 C50 95, 38 80, 38 65 C38 50, 50 45, 50 45 C50 45, 62 50, 62 65 C62 80, 50 95, 50 95Z"/>
            <path d="M5 50 C5 50, 20 38, 35 38 C50 38, 55 50, 55 50 C55 50, 50 62, 35 62 C20 62, 5 50, 5 50Z"/>
          </svg>
          {/* Walmart */}
          <svg className="h-6 md:h-7 opacity-60 hover:opacity-100 transition-opacity" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="8" fill="#FFC220"/>
            <rect x="46" y="5" width="8" height="30" rx="4" fill="#FFC220"/>
            <rect x="46" y="65" width="8" height="30" rx="4" fill="#FFC220"/>
            <rect x="5" y="46" width="30" height="8" rx="4" fill="#FFC220"/>
            <rect x="65" y="46" width="30" height="8" rx="4" fill="#FFC220"/>
            <rect x="22" y="22" width="30" height="8" rx="4" transform="rotate(45 37 37)" fill="#FFC220"/>
            <rect x="48" y="48" width="30" height="8" rx="4" transform="rotate(45 63 63)" fill="#FFC220"/>
            <rect x="22" y="70" width="30" height="8" rx="4" transform="rotate(-45 37 63)" fill="#FFC220"/>
            <rect x="48" y="22" width="30" height="8" rx="4" transform="rotate(-45 63 37)" fill="#FFC220"/>
          </svg>
        </div>
      </section>

  )
}

export default Home
