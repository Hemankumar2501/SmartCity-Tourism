"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { TripService, MemoryItem } from "../../lib/db";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2, Camera, Sparkles, Loader2, Image as ImageIcon, AlertCircle, X } from "lucide-react";

export default function MemoriesPage() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMemories() {
      if (user?.email) {
        const list = await TripService.getUserMemories(user.email);
        setMemories(list);
      }
    }
    loadMemories();
  }, [user]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG/JPEG).");
      return;
    }
    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be smaller than 5MB.");
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedImage(event.target.result as string);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedImage || loading || !user?.email) return;

    setLoading(true);
    setError(null);

    try {
      // Call Next.js Vision caption API
      const res = await fetch("/api/vision-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          mimeType: mimeType,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate AI caption.");
      }

      const data = await res.json();
      const generatedCaption = data.caption || "A precious memory frozen in time.";

      // Save memory to DB / localStorage
      const newMemory = await TripService.saveMemory({
        imageUrl: selectedImage,
        caption: generatedCaption,
        email: user.email,
      });

      setMemories((prev) => [newMemory, ...prev]);
      setSelectedImage(null);
    } catch (err: any) {
      setError(err.message || "Something went wrong generating the caption.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.email) return;
    const success = await TripService.deleteMemory(id, user.email);
    if (success) {
      setMemories((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#070A13] text-gray-100 px-6 py-12 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full filter blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-500/5 rounded-full filter blur-[120px] animate-pulse" />
      </div>

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* Title Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm tracking-widest uppercase">
            <Camera className="w-5 h-5" />
            <span>AI Travel Journal</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
            Travel Memories Board
          </h1>
          <p className="text-sm text-gray-400 max-w-xl">
            Upload your travel moments and watch our AI Vision analyze the photo to compose a poetic, handwritten Polaroid caption.
          </p>
        </div>

        {/* Upload Panel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl max-w-2xl">
          <h2 className="text-base font-bold text-gray-200 mb-4 flex items-center gap-2">
            <Upload className="w-4.5 h-4.5 text-cyan-400" />
            Pin a New Memory
          </h2>

          <div className="space-y-4">
            {!selectedImage ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative ${
                  dragActive
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <input
                  type="file"
                  id="image-file-input"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="space-y-3.5 flex flex-col items-center">
                  <div className="p-3 bg-white/5 rounded-full border border-white/10">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-200">
                      Drag and drop your travel photo here
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Supports JPEG, PNG (Max 5MB)
                    </p>
                  </div>
                  <span className="text-[10px] px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg font-bold">
                    Browse File
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-[300px] flex items-center justify-center bg-slate-950">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="max-h-[300px] object-contain"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-3 right-3 p-1.5 bg-slate-950/80 hover:bg-slate-900 border border-white/10 rounded-full text-gray-450 hover:text-white cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleUploadSubmit}
                    disabled={loading}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-[0_4px_12px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Analyzing Photo...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Caption & Pin Polaroid</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedImage(null)}
                    disabled={loading}
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Masonry Polaroids Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-gray-200 flex items-center gap-2">
            <span>Pinned Memories</span>
            <span className="text-xs px-2.5 py-0.5 bg-white/5 rounded-full border border-white/5 font-semibold text-gray-400">
              {memories.length} Cards
            </span>
          </h2>

          {memories.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center text-gray-500 space-y-2">
              <Camera className="w-8 h-8 mx-auto text-gray-600" />
              <p className="text-sm font-semibold">No travel memories pinned yet.</p>
              <p className="text-xs text-gray-650">Capture your moments and build your travel wall board above.</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
              <AnimatePresence>
                {memories.map((mem) => (
                  <motion.div
                    key={mem.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="break-inside-avoid relative group bg-white p-4 pb-6 rounded-md shadow-2xl border border-slate-200 flex flex-col gap-4 transition-transform hover:-rotate-1"
                  >
                    {/* Retro sticky tape overlay */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-20 h-7 bg-amber-100/60 border border-amber-200/20 backdrop-blur-[2px] shadow-sm transform -rotate-2 z-20 pointer-events-none" />

                    {/* Image frame */}
                    <div className="w-full bg-slate-950 aspect-[4/3] rounded overflow-hidden relative border border-slate-100">
                      <img
                        src={mem.imageUrl}
                        alt="Memory"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        onClick={() => handleDelete(mem.id)}
                        className="absolute bottom-2.5 right-2.5 p-2 bg-slate-950/80 hover:bg-rose-600 border border-white/10 text-gray-400 hover:text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Poetic Handwriting-style caption area */}
                    <div className="text-center px-1 font-serif text-slate-800 italic leading-relaxed text-sm">
                      "{mem.caption}"
                      <span className="block text-[8px] text-slate-400 uppercase tracking-widest mt-2.5 font-sans font-bold not-italic">
                        {new Date(mem.savedAt).toLocaleDateString([], {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
