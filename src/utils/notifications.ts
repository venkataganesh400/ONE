/**
 * System notification manager & Web Audio chime generator.
 * Triggers native OS / browser notifications when tasks are overdue or study blocks start/end.
 */

class NotificationService {
  private audioCtx: AudioContext | null = null;
  private lastAlertedTaskIds: Set<string> = new Set();
  private lastAlertedBlockIds: Set<string> = new Set();

  /**
   * Play a clean, Apple-styled two-tone notification chime via Web Audio API.
   * Works across desktop and mobile browsers without requiring external audio files.
   */
  public playChime(type: 'alert' | 'success' | 'reminder' = 'alert') {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      if (type === 'alert') {
        // Urgent 2-tone chime: 587Hz (D5) -> 880Hz (A5)
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880, now + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35);

        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc1.start(now);
        osc2.start(now + 0.15);
        osc1.stop(now + 0.15);
        osc2.stop(now + 0.6);
      } else if (type === 'success') {
        // Melodic confirmation chime
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5

        gainNode.gain.setValueAtTime(0.01, now);
        gainNode.gain.linearRampToValueAtTime(0.25, now + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch {
      // AudioContext might be blocked until user gesture
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.playChime('success');
        this.sendSystemNotification(
          'Notifications Enabled',
          'One Workspace will alert you when tasks are due or when scheduled study blocks begin.',
          'perm-success'
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public sendSystemNotification(title: string, body: string, tag?: string): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      this.playChime('alert');
      const notif = new Notification(title, {
        body,
        tag: tag || `notif-${Date.now()}`,
        requireInteraction: false,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (err) {
      console.warn('Could not dispatch native notification:', err);
      return false;
    }
  }

  /**
   * Monitor task deadlines and schedule blocks, alerting on missed items.
   */
  public checkOverdueAndMissed(
    tasks: Array<{ id: string; title: string; course: string; completed: boolean; dueDate: string; scheduledEndTime?: string }>,
    scheduleBlocks: Array<{ id: string; title: string; course: string; endTime: string; completed: boolean }>
  ) {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];

    // 1. Check tasks due today or with scheduled end times that have elapsed
    for (const task of tasks) {
      if (task.completed) continue;
      if (this.lastAlertedTaskIds.has(task.id)) continue;

      let isOverdue = false;
      let alertReason = '';

      if (task.scheduledEndTime && task.scheduledEndTime < currentTimeStr) {
        isOverdue = true;
        alertReason = `Scheduled block ended at ${task.scheduledEndTime}`;
      } else if (task.dueDate && task.dueDate < todayStr) {
        isOverdue = true;
        alertReason = `Due date was ${task.dueDate}`;
      }

      if (isOverdue) {
        this.lastAlertedTaskIds.add(task.id);
        this.sendSystemNotification(
          `Missed Task: ${task.title}`,
          `[${task.course}] ${alertReason}. Mark completed or reschedule in One Workspace.`,
          `task-overdue-${task.id}`
        );
        break; // Alert one at a time to avoid spam
      }
    }

    // 2. Check scheduled study blocks that ended without completion
    for (const block of scheduleBlocks) {
      if (block.completed) continue;
      if (this.lastAlertedBlockIds.has(block.id)) continue;

      if (block.endTime && block.endTime < currentTimeStr) {
        this.lastAlertedBlockIds.add(block.id);
        this.sendSystemNotification(
          `Schedule Block Ended: ${block.title}`,
          `[${block.course}] Ended at ${block.endTime}. Did you finish this study session?`,
          `block-ended-${block.id}`
        );
        break;
      }
    }
  }

  public testNotification() {
    this.playChime('alert');
    if (this.isSupported() && Notification.permission === 'granted') {
      this.sendSystemNotification(
        'One Workspace Alert Test',
        'System notifications are active. You will be alerted when tasks or schedule blocks are missed.',
        'test-alert'
      );
    }
  }
}

export const notificationService = new NotificationService();
