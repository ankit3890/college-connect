// Helper functions for admin checks
function isAdmin(community, username) {
  return community.creator === username;
}

function isSubadmin(community, username) {
  return community.subadmins && community.subadmins.includes(username);
}

function isBanned(community, username) {
  return community.bannedUsers && community.bannedUsers.some(b => b.username === username);
}

function canModerate(community, username) {
  return isAdmin(community, username) || isSubadmin(community, username);
}
