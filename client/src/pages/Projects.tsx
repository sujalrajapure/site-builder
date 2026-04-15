import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Project } from '../types'
import { ArrowBigDownDashIcon, EyeIcon, EyeOffIcon, FullscreenIcon, LaptopIcon, Loader2Icon, MessageSquareIcon, SaveIcon, SmartphoneIcon, TabletIcon, XIcon } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import ProjectPreview, { type ProjectPreviewRef } from '../components/ProjectPreview'
import api from '@/configs/axios'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'

interface GenerationProgress {
  currentIndex: number;
  doneCount: number;
  total: number;
  currentLabel?: string;
}

const Projects = () => {
  const {projectId} = useParams()
  const navigate = useNavigate()
  const {data: session, isPending} = authClient.useSession()

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const [isGenerating, setIsGenerating] = useState(true)
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    currentIndex: -1,
    doneCount: 0,
    total: 7,
  })
  const [device, setDevice] = useState<'phone' | 'tablet' | 'desktop'>("desktop")

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const previewRef = useRef<ProjectPreviewRef>(null)
  const sseRef = useRef<EventSource | null>(null)

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/api/user/project/${projectId}`);
      setProject(data.project)
      setIsGenerating(data.project.current_code ? false : true)
      setLoading(false)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
      console.log(error);
    }
  }

  /** Connect to SSE stream for live component-by-component generation */
  const connectSSE = () => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    const baseUrl = import.meta.env.VITE_BASEURL || 'http://localhost:3000';
    const sse = new EventSource(
      `${baseUrl}/api/user/generate-stream/${projectId}`,
      { withCredentials: true }
    );
    sseRef.current = sse;

    sse.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);

        if (msg.event === 'start') {
          setGenerationProgress({ currentIndex: 0, doneCount: 0, total: msg.total ?? 7 });
          setIsGenerating(true);

        } else if (msg.event === 'component') {
          const doneCount = msg.index + 1;

          // Update the project preview with merged HTML so far (live preview!)
          setProject((prev) =>
            prev ? { ...prev, current_code: msg.mergedSoFar } : prev
          );

          setGenerationProgress({
            currentIndex: msg.index + 1,   // next one is now active
            doneCount,
            total: msg.total ?? 7,
            currentLabel: msg.label,
          });

        } else if (msg.event === 'done') {
          setIsGenerating(false);
          sse.close();
          sseRef.current = null;
          // Final fetch to get complete project with versions/conversations
          fetchProject();

        } else if (msg.event === 'error') {
          toast.error('Generation error: ' + msg.message);
          setIsGenerating(false);
          sse.close();
          sseRef.current = null;
        }
      } catch (_) {}
    };

    sse.onerror = () => {
      // SSE connection dropped — fall back to polling
      sse.close();
      sseRef.current = null;
    };
  };

  const saveProject = async () => {
    if(!previewRef.current) return;
    const code = previewRef.current.getCode();
    if(!code) return;
    setIsSaving(true);
    try {
      const { data } = await api.put(`/api/project/save/${projectId}`, {code});
      toast.success(data.message)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
      console.log(error);
    }finally{
      setIsSaving(false);
    }
    };

  const downloadCode = ()=>{
    const code = previewRef.current?.getCode() || project?.current_code;
    if(!code){
      if(isGenerating){
        return
      }
      return
    }
    const element = document.createElement('a');
    const file = new Blob([code], {type: "text/html"});
    element.href = URL.createObjectURL(file)
    element.download = "index.html";
    document.body.appendChild(element)
    element.click();
  }

  const togglePublish = async () => {
    try {
      const { data } = await api.get(`/api/user/publish-toggle/${projectId}`);
      toast.success(data.message)
      setProject((prev)=> prev ? ({...prev, isPublished: !prev.isPublished}) : null)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
      console.log(error);
    }
  }

  useEffect(()=>{
    if(session?.user){
      // Load the project first
      fetchProject().then(() => {
        // After we know if generation is needed, SSE will be opened below via the project state effect
      });
    }else if(!isPending && !session?.user){
      navigate("/")
      toast("Please login to view your projects")
    }
  },[session?.user])

  // When project loads with no code, open the SSE stream for live updates
  useEffect(()=>{
    if(project && !project.current_code && isGenerating){
      connectSSE();
    }
    // Cleanup SSE on unmount
    return ()=>{
      sseRef.current?.close();
    }
  },[project?.id, isGenerating])

  // Fallback polling (every 8s) if SSE isn't connected and still generating
  useEffect(()=>{
    if(project && !project.current_code && !sseRef.current){
      const intervalId = setInterval(fetchProject, 8000);
      return ()=> clearInterval(intervalId)
    }
  },[project])

  if(loading){
    return (
      <>
      <div className="flex items-center justify-center h-screen">
        <Loader2Icon className="size-7 animate-spin text-violet-200"/>
      </div>
      </>
    )
  }
  return project ? (
    <div className='flex flex-col h-screen w-full bg-gray-900 text-white'>
      {/* builder navbar  */}
      <div className='flex max-sm:flex-col sm:items-center gap-4 px-4 py-2 no-scrollbar'>
        {/* left  */}
        <div className='flex items-center gap-2 sm:min-w-90 text-nowrap'>
          <img src="/favicon.svg" alt="logo" className="h-6 cursor-pointer" onClick={()=> navigate('/')}/>
          <div className='max-w-64 sm:max-w-xs'>
            <p className='text-sm text-medium capitalize truncate'>{project.name}</p>
            <p className='text-xs text-gray-400 -mt-0.5'>
              {isGenerating
                ? `Building… ${generationProgress.doneCount}/${generationProgress.total} sections`
                : 'Previewing last saved version'}
            </p>
          </div>
          <div className='sm:hidden flex-1 flex justify-end'>
            {isMenuOpen ? 
            <MessageSquareIcon onClick={()=> setIsMenuOpen(false)} className="size-6 cursor-pointer" />
            : <XIcon onClick={()=> setIsMenuOpen(true)} className="size-6 cursor-pointer"/>}
          </div>
        </div>
        {/* middle  */}
        <div className='hidden sm:flex gap-2 bg-gray-950 p-1.5 rounded-md'>
          <SmartphoneIcon onClick={()=> setDevice('phone')} className={`size-6 p-1 rounded cursor-pointer ${device === 'phone' ? "bg-gray-700" : ""}`}/>

          <TabletIcon onClick={()=> setDevice('tablet')} className={`size-6 p-1 rounded cursor-pointer ${device === 'tablet' ? "bg-gray-700" : ""}`}/>

          <LaptopIcon onClick={()=> setDevice('desktop')} className={`size-6 p-1 rounded cursor-pointer ${device === 'desktop' ? "bg-gray-700" : ""}`}/>
        </div>
        {/* right  */}
        <div className='flex items-center justify-end gap-3 flex-1 text-xs sm:text-sm'>
              <button onClick={saveProject} disabled={isSaving} className='max-sm:hidden bg-gray-800 hover:bg-gray-700 text-white px-3.5 py-1 flex items-center gap-2 rounded sm:rounded-sm transition-colors border border-gray-700'>
                {isSaving ? <Loader2Icon className="animate-spin" size={16}/> : <SaveIcon size={16}/>} Save
              </button>
              <Link target='_blank' to={`/preview/${projectId}`} className="flex items-center gap-2 px-4 py-1 rounded sm:rounded-sm border border-gray-700 hover:border-gray-500 transition-colors">
                <FullscreenIcon size={16} /> Preview
              </Link>
              <button onClick={downloadCode} className='bg-linear-to-br from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white px-3.5 py-1 flex items-center gap-2 rounded sm:rounded-sm transition-colors'>
                <ArrowBigDownDashIcon size={16} /> Download
              </button>
              <button onClick={togglePublish} className='bg-linear-to-br from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white px-3.5 py-1 flex items-center gap-2 rounded sm:rounded-sm transition-colors'>
                {project.isPublished ?
                <EyeOffIcon size={16}/> : <EyeIcon size={16}/> 
              }
                {project.isPublished ? "Unpublish" : "Publish"}
              </button>
        </div>
      </div>
      <div className='flex-1 flex overflow-auto'>
             <Sidebar isMenuOpen={isMenuOpen} project={project} setProject={(p)=>setProject(p)} isGenerating={isGenerating} setIsGenerating={setIsGenerating}/>

              <div className='flex-1 p-2 pl-0'>
                <ProjectPreview
                  ref={previewRef}
                  project={project}
                  isGenerating={isGenerating}
                  generationProgress={generationProgress}
                  device={device}
                />
              </div>
      </div>
    </div>
  )
  : 
  (
    <div className='flex items-center justify-center h-screen'>
      <p className="text-2xl font-medium text-gray-200">Unable to load project!</p>
    </div>
  )
}

export default Projects
