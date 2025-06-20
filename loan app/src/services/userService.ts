// src/services/userService.ts (Versi Final dengan Backend Flask)

import { User } from '../types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-api.vercel.app/api' 
  : 'http://localhost:5000/api';

export const userService = {
  /**
   * Mengotentikasi pengguna dengan mencari username dan mencocokkan password.
   * Pencarian username tidak case-sensitive.
   */
  async authenticate(username: string, password_sent: string): Promise<User | null> {
    try {
      // 1. Ambil SEMUA pengguna dari database
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) {
        throw new Error("Could not connect to the user database.");
      }
      const allUsers: User[] = await response.json();

      // 2. Cari pengguna yang cocok di sisi klien (lebih andal)
      // Kita bandingkan dengan mengubah keduanya menjadi huruf besar
      const foundUser = allUsers.find(
        user => user.username.toUpperCase() === username.toUpperCase()
      );

      // 3. Jika pengguna ditemukan, bandingkan passwordnya
      if (foundUser && foundUser.password === password_sent) {
        // Jangan pernah kirim password kembali ke aplikasi frontend
        const { password, ...userToReturn } = foundUser;
        return userToReturn;
      }

      // Jika tidak ditemukan atau password salah, kembalikan null
      return null;

    } catch (error) {
      console.error("Authentication service failed:", error);
      // Lempar error agar bisa ditangkap oleh AuthContext
      throw error;
    }
  },
  
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
     const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!response.ok) return null;
    const updatedUser = await response.json();
    // Pastikan password tidak dikembalikan setelah update
    const { password, ...userToReturn } = updatedUser;
    return userToReturn;
  },
};
