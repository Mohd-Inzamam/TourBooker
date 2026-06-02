export const formatDate = (dateString) => {
  if (!dateString) return 'Date not available';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Date not available';
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Just now';
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';

  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(dateString);
};
