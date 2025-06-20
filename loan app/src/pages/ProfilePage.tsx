import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageTitle from '../components/PageTitle';
import Input from '../components/Input';
import Button from '../components/Button';

const ProfilePage: React.FC = () => {
    const { user, updateUserPassword } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setMessage('');
        if (!newPassword || !confirmPassword) { setError("All fields are required."); return; }
        if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
        if (!user?.id) { setError("User not found. Please log in again."); return; }
        setIsLoading(true);
        const success = await updateUserPassword(user.id, newPassword);
        setIsLoading(false);
        if (success) {
            setMessage("Password updated successfully!");
            setNewPassword(''); setConfirmPassword('');
        } else {
            setError("Failed to update password. Please try again.");
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <PageTitle title="My Profile" subtitle={`Update password for ${user?.username || 'user'}`} />
            <div className="bg-white p-8 rounded-lg shadow-xl mt-6">
                <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {error && <p className="text-sm text-red-500 bg-red-100 p-2 rounded">{error}</p>}
                    {message && <p className="text-sm text-green-500 bg-green-100 p-2 rounded">{message}</p>}
                    <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                    <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    <div className="pt-2"><Button type="submit" isLoading={isLoading} className="w-full">Update Password</Button></div>
                </form>
            </div>
        </div>
    );
};
export default ProfilePage;
