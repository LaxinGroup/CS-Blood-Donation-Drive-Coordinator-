// Centralized API Client for CS Blood Donation Drive Coordinator
import { authClient } from '@/lib/auth/client';

function normalizeApiBaseUrl(baseUrl: string): string {
    const trimmedBaseUrl = baseUrl.trim().replace(/\/+$/, '');
    return /\/api$/i.test(trimmedBaseUrl) ? trimmedBaseUrl : `${trimmedBaseUrl}/api`;
}

const BASE_URL = normalizeApiBaseUrl(
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
);

export interface User {
    id: string;
    full_name: string;
    email: string;
    role: 'DONOR' | 'COORDINATOR' | 'STAFF' | 'ADMIN';
    blood_group?: string | null;
    phone?: string | null;
    date_of_birth?: string | null;
    last_donation_date?: string | null;
    created_at?: string;
}

export interface DriveSlot {
    id: string;
    drive_id: string;
    start_time: string;
    end_time: string;
    max_capacity: number;
    current_bookings: number;
}

export interface Drive {
    id: string;
    organizer_id: string;
    organizer_name?: string;
    title: string;
    description: string;
    location_name: string;
    building_room?: string;
    drive_date: string;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
    capacity_per_slot: number;
    target_units: number;
    status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    created_at: string;
    slots?: DriveSlot[];
    total_capacity?: number;
    total_bookings?: number;
    available_spots?: number;
}

export interface Appointment {
    id: string;
    booking_reference: string;
    user_id: string;
    drive_id: string;
    slot_id: string;
    status: 'CONFIRMED' | 'CHECKED_IN' | 'IN_CHAIR' | 'COMPLETED' | 'DEFERRED' | 'CANCELLED' | 'NO_SHOW';
    pre_screen_passed: boolean;
    pre_screen_answers?: Record<string, unknown>;
    booked_at: string;
    check_in_time?: string | null;
    drive_title?: string;
    location_name?: string;
    building_room?: string;
    drive_date?: string;
    slot_start_time?: string;
    slot_end_time?: string;
    donor_name?: string;
    donor_email?: string;
    donor_blood_group?: string;
    donor_phone?: string;
    units_collected?: number;
    deferral_reason?: string;
    blood_group_collected?: string;
}

export interface NotificationItem {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'INFO' | 'REMINDER' | 'URGENT_BROADCAST' | 'CONFIRMATION';
    is_read: boolean;
    created_at: string;
}

export interface DriveAnalytics {
    drive: Drive;
    metrics: {
        target_units: number;
        total_units_collected: number;
        target_progress_percentage: number;
        total_booked: number;
        checked_in_count: number;
        completed_count: number;
        deferred_count: number;
        no_show_count: number;
        turnout_rate_percentage: number;
    };
    blood_group_distribution: Record<string, number>;
    hourly_distribution: Record<string, number>;
    deferral_reasons: Record<string, number>;
    donor_list: Appointment[];
}

export interface SystemOverview {
    total_donors: number;
    total_drives: number;
    upcoming_drives: number;
    total_units_collected_all_time: number;
    lives_impacted_estimate: number;
}

// Request helper
/** Error thrown for non-2xx API responses. `code` is set for auth states the UI reacts to. */
export class ApiError extends Error {
    constructor(message: string, public readonly status: number, public readonly code?: string) {
        super(message);
        this.name = 'ApiError';
    }
}

// Neon Auth JWTs live 15 minutes. Reuse one until shortly before it expires.
const TOKEN_REFRESH_MARGIN_SECONDS = 60;
let cachedToken: { value: string; expiresAt: number } | null = null;

function readTokenExpiry(token: string): number {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
        return typeof payload.exp === 'number' ? payload.exp : 0;
    } catch {
        return 0;
    }
}

/** A Neon JWT (three dot-separated parts) that isn't about to expire. Opaque session tokens fail this. */
function usableJwt(token: string | null | undefined): { value: string; expiresAt: number } | null {
    if (!token || token.split('.').length !== 3) return null;
    const expiresAt = readTokenExpiry(token);
    return expiresAt - TOKEN_REFRESH_MARGIN_SECONDS > Date.now() / 1000 ? { value: token, expiresAt } : null;
}

export function clearAuthToken(): void {
    cachedToken = null;
}

// Neon delivers the JWT on get-session responses (`set-auth-jwt` header, which the SDK copies into
// session.token). Note: `authClient.token()` is routed to the SDK's session cache and returns the
// session object, not { token }, so it can't be used here.
async function getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    if (usableJwt(cachedToken?.value)) return cachedToken!.value;

    const { data: session } = await authClient.getSession();
    cachedToken = usableJwt(session?.session?.token);
    if (cachedToken || !session?.user) return cachedToken?.value ?? null;

    // Signed in but the cached session has no fresh JWT: ask Neon directly, bypassing the
    // SDK's in-browser cache (X-Force-Fetch) and the proxy's session cookie cache.
    const { data: fresh } = await authClient.getSession({
        query: { disableCookieCache: true },
        fetchOptions: { headers: { 'X-Force-Fetch': 'true' } },
    });
    cachedToken = usableJwt(fresh?.session?.token);
    return cachedToken?.value ?? null;
}

async function send(url: string, options: RequestInit, token: string | null): Promise<Response> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    try {
        return await fetch(url, { ...options, headers });
    } catch {
        // fetch only rejects when the server can't be reached at all (down, wrong URL, CORS)
        throw new ApiError('Cannot reach the server right now. Please try again in a moment.', 0, 'NETWORK_ERROR');
    }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    let response = await send(url, options, await getAuthToken());
    if (response.status === 401 && cachedToken) {
        // Cached token was rejected (e.g. expired early): fetch a fresh one and retry once
        clearAuthToken();
        response = await send(url, options, await getAuthToken());
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new ApiError(data.message || `Request failed with status ${response.status}`, response.status, data.code);
    }

    return data;
}

export const api = {
    // Auth
    // Links the signed-in Neon Auth identity to the app's user row (or creates it). Idempotent.
    async syncProfile(role?: User['role']) {
        return request<{ success: boolean; linked: boolean; user: User }>('/auth/profile', {
            method: 'POST',
            body: JSON.stringify(role ? { role } : {}),
        });
    },

    async getMe() {
        return request<{ success: boolean; user: User }>('/auth/me');
    },

    async updateMe(payload: Partial<User>) {
        return request<{ success: boolean; user: User }>('/auth/me', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    },

    // Drives
    async getDrives(status?: string) {
        const query = status ? `?status=${status}` : '';
        return request<{ success: boolean; drives: Drive[] }>(`/drives${query}`);
    },

    async getDriveById(id: string) {
        return request<{ success: boolean; drive: Drive }>(`/drives/${id}`);
    },

    async createDrive(payload: Partial<Drive>) {
        return request<{ success: boolean; drive: Drive }>('/drives', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    async updateDrive(id: string, payload: Partial<Drive>) {
        return request<{ success: boolean; drive: Drive }>(`/drives/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    },

    async deleteDrive(id: string) {
        return request<{ success: boolean; message: string }>(`/drives/${id}`, {
            method: 'DELETE',
        });
    },

    // Appointments & Pre-Screening
    async evaluatePreScreening(answers: {
        age?: number;
        weight_kg?: number;
        feeling_well?: boolean;
        has_tattoos_recent?: boolean;
        on_antibiotics?: boolean;
        pregnant?: boolean;
        last_donation_date?: string | null;
    }) {
        return request<{
            success: boolean;
            eligible: boolean;
            reasons: string[];
            next_eligible_date?: string | null;
            guidelines: string;
        }>('/appointments/pre-screen', {
            method: 'POST',
            body: JSON.stringify(answers),
        });
    },

    async bookAppointment(payload: {
        drive_id: string;
        slot_id: string;
        pre_screen_answers?: Record<string, unknown>;
        blood_group?: string;
    }) {
        return request<{ success: boolean; appointment: Appointment }>('/appointments', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    async getMyAppointments() {
        return request<{ success: boolean; appointments: Appointment[] }>('/appointments/my-appointments');
    },

    async cancelAppointment(id: string) {
        return request<{ success: boolean; appointment: Appointment }>(`/appointments/${id}/cancel`, {
            method: 'PUT',
        });
    },

    async rescheduleAppointment(id: string, new_slot_id: string) {
        return request<{ success: boolean; appointment: Appointment }>(`/appointments/${id}/reschedule`, {
            method: 'PUT',
            body: JSON.stringify({ new_slot_id }),
        });
    },

    getIcsUrl(appointmentId: string) {
        return `${BASE_URL}/appointments/${appointmentId}/ics`;
    },

    // Staff Live Console
    async getDriveQueue(driveId: string) {
        return request<{ success: boolean; drive: Drive; queue: Appointment[] }>(`/staff/drives/${driveId}/queue`);
    },

    async checkInDonor(appointmentId: string) {
        return request<{ success: boolean; appointment: Appointment }>(`/staff/appointments/${appointmentId}/checkin`, {
            method: 'PUT',
        });
    },

    async updateQueueStatus(appointmentId: string, status: string) {
        return request<{ success: boolean; appointment: Appointment }>(`/staff/appointments/${appointmentId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },

    async recordDonationOutcome(appointmentId: string, payload: {
        outcome: 'COMPLETED' | 'DEFERRED' | 'NO_SHOW';
        units_collected?: number;
        blood_group_collected?: string;
        deferral_reason?: string;
        notes?: string;
    }) {
        return request<{ success: boolean; record: unknown }>(`/staff/appointments/${appointmentId}/complete`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    async registerWalkIn(driveId: string, payload: {
        full_name: string;
        email: string;
        phone?: string;
        blood_group?: string;
        slot_id?: string;
    }) {
        return request<{ success: boolean; data: { user: User; appointment: Appointment } }>(`/staff/drives/${driveId}/walkin`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    // Analytics & Reports
    async getDriveAnalytics(driveId: string) {
        return request<{ success: boolean; analytics: DriveAnalytics }>(`/analytics/drives/${driveId}`);
    },

    async getSystemOverview() {
        return request<{ success: boolean; overview: SystemOverview }>('/analytics/overview');
    },

    getCsvExportUrl(driveId: string) {
        return `${BASE_URL}/analytics/drives/${driveId}/export/csv`;
    },

    // Notifications
    async getNotifications() {
        return request<{ success: boolean; unread_count: number; notifications: NotificationItem[] }>('/notifications');
    },

    async markNotificationRead(id: string) {
        return request<{ success: boolean; notification: NotificationItem }>(`/notifications/${id}/read`, {
            method: 'PUT',
        });
    },

    async markAllNotificationsRead() {
        return request<{ success: boolean }>('/notifications/read-all', {
            method: 'PUT',
        });
    },

    async broadcastAlert(payload: { title: string; message: string; target_blood_groups?: string[]; drive_id?: string }) {
        return request<{ success: boolean; sent_count: number }>('/notifications/broadcast', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    // Admin
    async getUsers() {
        return request<{ success: boolean; users: User[] }>('/admin/users');
    },

    async updateUserRole(id: string, role: string) {
        return request<{ success: boolean; user: User }>(`/admin/users/${id}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role }),
        });
    },

    async getAuditLogs() {
        return request<{ success: boolean; logs: Array<{ id: string; action: string; full_name?: string; email?: string; role?: string; created_at: string; details?: unknown }> }>('/admin/audit-logs');
    },
};
