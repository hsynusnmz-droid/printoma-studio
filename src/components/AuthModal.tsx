'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, LogIn, UserPlus } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'login' | 'signup';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();

        try {
            if (activeTab === 'login') {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                // Success - modal will close via AuthListener
                onClose();
            } else {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });

                if (signUpError) throw signUpError;

                // Show success message
                setError(null);
                alert('Kayıt başarılı! Lütfen email adresinizi kontrol edin.');
                onClose();
            }
        } catch (err) {
            const error = err as { message?: string };
            setError(error.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 mx-4">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <X className="w-5 h-5 text-slate-600" />
                </button>

                {/* Title */}
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    {activeTab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                </h2>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
                    <button
                        onClick={() => {
                            setActiveTab('login');
                            setError(null);
                        }}
                        className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all ${activeTab === 'login'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <LogIn className="w-4 h-4 inline mr-2" />
                        Giriş
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('signup');
                            setError(null);
                        }}
                        className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all ${activeTab === 'signup'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <UserPlus className="w-4 h-4 inline mr-2" />
                        Kayıt
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {activeTab === 'signup' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                İsim Soyisim
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="Adınız"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="ornek@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Şifre
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                        {activeTab === 'signup' && (
                            <p className="text-xs text-slate-500 mt-1">En az 6 karakter</p>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Yükleniyor...
                            </span>
                        ) : activeTab === 'login' ? (
                            'Giriş Yap'
                        ) : (
                            'Kayıt Ol'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
