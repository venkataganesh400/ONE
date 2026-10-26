import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../utils/notifications.ts';
import type { ScheduleBlock, TaskItem } from '../types/index.ts';

export interface UseTaskNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;
  sendTestAlert: () => void;
}

export function useTaskNotifications(
  tasks: TaskItem[],
  scheduleBlocks: ScheduleBlock[],
  enabled: boolean = true
): UseTaskNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return notificationService.getPermissionStatus();
  });

  const isSupported = notificationService.isSupported();

  const handleRequestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await notificationService.requestPermission();
    setPermission(notificationService.getPermissionStatus());
    return granted;
  }, []);

  const sendTestAlert = useCallback(() => {
    notificationService.testNotification();
  }, []);

  // Periodic monitor for overdue tasks and completed blocks
  useEffect(() => {
    if (!enabled || permission !== 'granted') return;

    // Run immediately once
    notificationService.checkOverdueAndMissed(tasks, scheduleBlocks);

    // Then check every 45 seconds
    const interval = window.setInterval(() => {
      notificationService.checkOverdueAndMissed(tasks, scheduleBlocks);
    }, 45000);

    return () => window.clearInterval(interval);
  }, [tasks, scheduleBlocks, enabled, permission]);

  return {
    permission,
    isSupported,
    requestPermission: handleRequestPermission,
    sendTestAlert,
  };
}
