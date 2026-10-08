'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, User } from '@/lib/api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (payload: { full_name: string; email: string; password: string; role?: string; blood_group?: string; phone?: string; date_of_birth?: string }) => Promise<void>;
    logout: () => void;
    quickLoginAs: (role: 'DONOR' | 'COORDINATOR' | 'STAFF' | 'ADMIN') => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                setToken(storedToken);
                const res = await api.getMe();
                setUser(res.user);
            } else {
                setUser(null);
                setToken(null);
            }
        } catch {
            localStorage.removeItem('token');
            setUser(null);
            setToken(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = async (email: string, password: string) => {
        const res = await api.login({ email, password });
        localStorage.setItem('token', res.token);
        setToken(res.token);
        setUser(res.user);
    };

    const register = async (payload: { full_name: string; email: string; password: string; role?: string; blood_group?: string; phone?: string; date_of_birth?: string }) => {
        const res = await api.register(payload);
        localStorage.setItem('token', res.token);
        setToken(res.token);
        setUser(res.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
    };

    const quickLoginAs = async (role: 'DONOR' | 'COORDINATOR' | 'STAFF' | 'ADMIN') => {
        const roleEmails = {
            DONOR: 'donor@campus.edu',
            COORDINATOR: 'coordinator@campus.edu',
            STAFF: 'staff@campus.edu',
            ADMIN: 'admin@campus.edu',
        };
        await login(roleEmails[role], 'password123');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                quickLoginAs,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
