import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, X, FileText, Image, Loader2, Link2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

interface FileUploadProps {
    /** Called with the URL (either uploaded file path or external link) */
    onFileUploaded: (url: string) => void;
    /** Current value */
    value: string;
    /** Label text */
    label?: string;
    /** Accepted file types */
    accept?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    onFileUploaded,
    value,
    label = 'Proof / Attachment',
    accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string>('');
    const [mode, setMode] = useState<'file' | 'link'>('file');
    const [linkValue, setLinkValue] = useState(value || '');

    useEffect(() => {
        setLinkValue(value || '');
    }, [value]);

    const uploadFile = useCallback(async (file: File) => {
        setUploading(true);
        try {
            const token = localStorage.getItem('clubsync_token');
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${API_BASE}/uploads`, {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                // Use the URL returned by the backend directly
                onFileUploaded(data.file.url);
                setUploadedFileName(data.file.originalName);
            } else {
                toast.error(data.message || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            toast.error('Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    }, [onFileUploaded]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) uploadFile(file);
    };

    const handleLinkSubmit = () => {
        if (linkValue.trim()) {
            onFileUploaded(linkValue.trim());
        }
    };

    const handleClear = () => {
        onFileUploaded('');
        setUploadedFileName('');
        setLinkValue('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-700">{label}</label>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button
                        type="button"
                        onClick={() => setMode('file')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${mode === 'file' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                            }`}
                    >
                        <Upload size={12} className="inline mr-1" />
                        Upload
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('link')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${mode === 'link' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                            }`}
                    >
                        <Link2 size={12} className="inline mr-1" />
                        Link
                    </button>
                </div>
            </div>

            {/* Already uploaded indicator */}
            {value && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
                    <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                    <span className="text-emerald-700 font-medium truncate flex-1">
                        {uploadedFileName || 'File attached'}
                    </span>
                    <a
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 text-xs font-bold hover:underline flex-shrink-0"
                    >
                        View
                    </a>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {!value && mode === 'file' && (
                <>
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={accept}
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* Drag-and-drop zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
              relative cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
              ${isDragging
                                ? 'border-teal-400 bg-teal-50 scale-[1.02]'
                                : 'border-gray-200 bg-gray-50 hover:border-teal-300 hover:bg-teal-50/50'
                            }
              ${uploading ? 'pointer-events-none opacity-60' : ''}
            `}
                    >
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 size={28} className="text-teal-500 animate-spin" />
                                <span className="text-sm font-medium text-teal-600">Uploading...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <Upload size={18} className="text-gray-400" />
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600">
                                        Drop file here or <span className="text-teal-600 font-bold">browse</span>
                                    </span>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Images, PDFs, Documents — Max 10MB
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {!value && mode === 'link' && (
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="url"
                            placeholder="Paste a link (Google Drive, photo URL, etc.)"
                            className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm"
                            value={linkValue}
                            onChange={e => setLinkValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleLinkSubmit(); } }}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleLinkSubmit}
                        disabled={!linkValue.trim()}
                        className="px-4 py-3 bg-teal-500 text-white rounded-xl font-bold text-sm hover:bg-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Attach
                    </button>
                </div>
            )}
        </div>
    );
};
