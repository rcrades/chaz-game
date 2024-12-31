'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useChat } from 'ai/react'
import { Mic, MicOff, Send, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ModsList } from './ModsList'

interface Mod {
  id: string;
  name: string;
  enabled: boolean;
}

export default function Game() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [enabledMods, setEnabledMods] = useState<string[]>(['drinking_game'])
  const [audioError, setAudioError] = useState<string | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [useAudioWorklet, setUseAudioWorklet] = useState(true)
  const [debugMode, setDebugMode] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const echoCancellationNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    initialMessages: [
      { role: 'assistant', content: "Hey there! I'm your AI host for this awesome party game. Once you enable audio, I'll guide you through the game. Let's have some fun!" }
    ],
  })

  const cleanupAudio = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error)
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const initializeSpeechRecognition = useCallback(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()

      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex
        const transcript = event.results[current][0].transcript
        setTranscript(transcript)
        setInput(transcript)
      }

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current?.start()
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setAudioError(`Speech recognition error: ${event.error}`)
      }

      if (isListening) {
        recognitionRef.current.start()
      }
    } else {
      setAudioError("Speech recognition is not supported in this browser.")
    }
  }, [isListening, setInput])

  useEffect(() => {
    if (audioEnabled) {
      initializeSpeechRecognition()
    }
    return () => {
      recognitionRef.current?.stop()
    }
  }, [audioEnabled, initializeSpeechRecognition])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = '/ai-emcee-placeholder.mp4'
      videoRef.current.loop = true
    }
  }, [])

  const createScriptProcessorFallback = (audioContext: AudioContext) => {
    const bufferSize = 4096;
    const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);
    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
      const inputBuffer = audioProcessingEvent.inputBuffer;
      const outputBuffer = audioProcessingEvent.outputBuffer;

      for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
        const inputData = inputBuffer.getChannelData(channel);
        const outputData = outputBuffer.getChannelData(channel);

        for (let sample = 0; sample < inputBuffer.length; sample++) {
          // Simple noise reduction
          outputData[sample] = inputData[sample] * 0.8;
        }
      }
    };
    return scriptProcessor;
  };

  const initAudio = async () => {
    try {
      if (!window.AudioContext && !window.webkitAudioContext) {
        throw new Error("AudioContext is not supported in this browser.")
      }
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is not supported in this browser.")
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(error => {
        console.error('Error accessing media devices:', error)
        throw new Error(`Failed to access media devices: ${error.message}`)
      })

      const sourceNode = audioContext.createMediaStreamSource(stream)
      sourceNodeRef.current = sourceNode

      if (audioContext.audioWorklet && useAudioWorklet) {
        try {
          await audioContext.audioWorklet.addModule('/echo-cancellation-processor.js')
          const echoCancellationNode = new AudioWorkletNode(audioContext, 'echo-cancellation-processor')
          echoCancellationNodeRef.current = echoCancellationNode
          sourceNode.connect(echoCancellationNode).connect(audioContext.destination)
        } catch (workletError) {
          console.error('Error loading audio worklet:', workletError)
          setUseAudioWorklet(false)
          const scriptProcessor = createScriptProcessorFallback(audioContext)
          echoCancellationNodeRef.current = scriptProcessor
          sourceNode.connect(scriptProcessor).connect(audioContext.destination)
        }
      } else {
        const scriptProcessor = createScriptProcessorFallback(audioContext)
        echoCancellationNodeRef.current = scriptProcessor
        sourceNode.connect(scriptProcessor).connect(audioContext.destination)
      }

      setAudioEnabled(true)
      setAudioError(null)
    } catch (error) {
      console.error("Error initializing audio:", error)
      setAudioError(error.message || "An unknown error occurred while initializing audio.")
    }
  }

  useEffect(() => {
    if (audioEnabled) {
      const latestMessage = messages[messages.length - 1]
      if (latestMessage && latestMessage.role === 'assistant') {
        const utterance = new SpeechSynthesisUtterance(latestMessage.content)
        utterance.onend = () => console.log('Speech synthesis finished')
        utterance.onerror = (event) => console.error('Speech synthesis error:', event)
        speechSynthesis.speak(utterance)
      }
    }
  }, [messages, audioEnabled])

  const toggleListening = () => {
    setIsListening(!isListening)
    if (!isListening) {
      setInput('')
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsListening(false)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      await handleSubmit(e, { signal: abortControllerRef.current.signal })
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted')
      } else {
        console.error('Error submitting form:', error)
      }
    }
  }

  const handleModsChange = (mods: Mod[]) => {
    const newEnabledMods = mods.filter(mod => mod.enabled).map(mod => mod.id)
    setEnabledMods(newEnabledMods)
    
    setMessages(prevMessages => [
      ...prevMessages,
      { role: 'system', content: `Mods updated. Enabled mods: ${newEnabledMods.join(', ')}` }
    ])
  }

  const handleEnableAudio = () => {
    initAudio()
  }

  const toggleDebugMode = () => {
    setDebugMode(!debugMode)
  }

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">AI-Powered Party Game</CardTitle>
      </CardHeader>
      <CardContent>
        {!audioEnabled && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4" role="alert">
            <p className="font-bold">Audio is currently disabled</p>
            <p>Click the button below to enable audio and microphone access for the full game experience.</p>
            <Button onClick={handleEnableAudio} className="mt-2">
              <Volume2 className="mr-2 h-4 w-4" />
              Enable Audio and Microphone
            </Button>
          </div>
        )}
        {audioError && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
            <p className="font-bold">Audio Initialization Warning</p>
            <p>{audioError}</p>
            <p>The game will continue, but some audio features may not be available.</p>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <video ref={videoRef} autoPlay muted loop className="w-full h-auto rounded-lg" />
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Interact with the AI host using your voice or text. The host will guide you through the game.
              </p>
              <Button
                onClick={toggleListening}
                variant={isListening ? "destructive" : "default"}
                className={cn(
                  "w-full transition-all duration-200",
                  isListening && "animate-pulse"
                )}
                disabled={!audioEnabled || !!audioError}
              >
                {isListening ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Start Listening
                  </>
                )}
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Game Mods</h3>
              <ModsList onModsChange={handleModsChange} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-[calc(100vh-16rem)] overflow-y-auto border p-4 rounded-lg bg-white">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "mb-2 p-2 rounded",
                    message.role === 'assistant' 
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-green-100 text-green-800"
                  )}
                >
                  <strong>{message.role === 'assistant' ? 'AI Host' : 'Player'}:</strong> {message.content}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type your response or use voice input..."
                className="flex-grow"
              />
              <Button type="submit" disabled={isLoading || !input}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            {isListening && (
              <div className="text-sm text-muted-foreground flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
                Listening...
              </div>
            )}
          </div>
        </div>
        <Button onClick={toggleDebugMode} variant="outline" className="mt-4">
          {debugMode ? 'Disable Debug Mode' : 'Enable Debug Mode'}
        </Button>
        {debugMode && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-bold mb-2">Debug Information:</h3>
            <p>Audio Enabled: {audioEnabled ? 'Yes' : 'No'}</p>
            <p>Using AudioWorklet: {useAudioWorklet ? 'Yes' : 'No'}</p>
            <p>Audio Error: {audioError || 'None'}</p>
            <p>Is Listening: {isListening ? 'Yes' : 'No'}</p>
            <p>Number of Messages: {messages.length}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

