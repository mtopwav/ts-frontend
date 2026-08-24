/**
 * Branch access for Boma / Geita employee dashboards.
 * Admins can access any branch; employees must match their stored location.
 */
export function canAccessBranch(user, branch) {
  if (!user) return false;
  if (user.userType === 'admin') return true;
  if (user.userType !== 'employee') return false;

  const userLocation = String(user.location || '').trim().toLowerCase();
  const branchKey = String(branch || '').trim().toLowerCase();
  return userLocation === branchKey;
}
