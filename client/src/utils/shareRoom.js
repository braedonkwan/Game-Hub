export const getRoomUrl = (
  location = typeof window === 'undefined' ? null : window.location
) => location?.href || '';

export const copyRoomUrl = async (
  roomUrl,
  clipboard = typeof navigator === 'undefined' ? null : navigator.clipboard
) => {
  if (!roomUrl || typeof clipboard?.writeText !== 'function') {
    return false;
  }

  try {
    await clipboard.writeText(roomUrl);
    return true;
  } catch (_err) {
    return false;
  }
};
