// Centralized API Client for CS Blood Donation Drive Coordinator

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        (error as unknown as { status: number }).status = response.status;
        throw error;
    }

    return data;
}

export const api = {
    // Auth
    async login(credentials: { email: string; password: string }) {
        return request<{ success: boolean; token: string; user: User }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    },

    async register(payload: { full_name: string; email: string; password: string; role?: string; blood_group?: string; phone?: string; date_of_birth?: string }) {
        return request<{ success: boolean; token: string; user: User }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
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
