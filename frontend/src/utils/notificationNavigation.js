/** Resolve in-app route for a notification (task or project). */
export function getNotificationTargetPath(item) {
  if (item?.task?._id && item?.project?._id) {
    return `/projects/${item.project._id}/tasks/${item.task._id}`;
  }
  if (item?.project?._id) {
    return `/projects/${item.project._id}`;
  }
  return null;
}
