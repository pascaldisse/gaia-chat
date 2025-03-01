import React, { useState, useEffect } from 'react';
import { userDB } from '../../services/db';
import '../../styles/UserList.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await userDB.getAllUsers();
      setUsers(allUsers);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Make sure specific user is an admin
  useEffect(() => {
    const ensureSpecificUserIsAdmin = async () => {
      const targetUserId = 'user-1740732759256';
      try {
        // Check if user exists
        const user = await userDB.getUserById(targetUserId);
        
        if (user) {
          // If user exists but is not admin, make them admin
          if (!user.isAdmin) {
            console.log(`Making user ${targetUserId} an admin as requested`);
            await userDB.updateUser(targetUserId, { isAdmin: true });
            // Refresh the user list
            fetchUsers();
          }
        } else {
          console.log(`User ${targetUserId} not found in database`);
        }
      } catch (err) {
        console.error(`Error ensuring admin status for user ${targetUserId}:`, err);
      }
    };
    
    fetchUsers();
    
    // Run the function to ensure specific user is admin
    ensureSpecificUserIsAdmin();
  }, []);

  // Effect to clear success message after 3 seconds
  useEffect(() => {
    if (updateSuccess) {
      const timer = setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [updateSuccess]);

  const toggleAdminRole = async (userId, makeAdmin) => {
    try {
      setLoading(true);
      await userDB.updateUser(userId, { isAdmin: makeAdmin });
      // Check specifically for the user requested to be made admin
      if (userId === 'user-1740732759256' && makeAdmin) {
        console.log('Successfully made user-1740732759256 an admin');
      }
      setUpdateSuccess(true);
      fetchUsers(); // Refresh user list
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(`Failed to ${makeAdmin ? 'promote' : 'demote'} user`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="user-list-container">
      <h2>All Users</h2>
      {updateSuccess && <div className="success-message">User role updated successfully!</div>}
      {users.length === 0 ? (
        <p>No users found in the database</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Display Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username || 'N/A'}</td>
                <td>{user.displayName || 'N/A'}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleString()}</td>
                <td>{new Date(user.lastLogin).toLocaleString()}</td>
                <td>
                  <button 
                    className={`role-toggle-btn ${user.isAdmin ? 'demote' : 'promote'}`}
                    onClick={() => toggleAdminRole(user.id, !user.isAdmin)}
                  >
                    {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserList;