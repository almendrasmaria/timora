import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DaySchedule,
  ProfessionalAvailability,
  ScheduleBlock,
  WEEK_DAYS,
} from '../../../../core/onboarding/professional-schedule.model';

@Component({
  selector: 'app-professional-schedule',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './professional-schedule.component.html',
  styleUrl: './professional-schedule.component.scss',
})
export class ProfessionalScheduleComponent {
  readonly days = WEEK_DAYS;

  @Input({ required: true }) availability!: ProfessionalAvailability;
  @Output() availabilityChange = new EventEmitter<ProfessionalAvailability>();

  toggleDay(key: string, enabled: boolean): void {
    this.patchDay(key, { enabled });
  }

  updateTime(key: string, field: 'start' | 'end', value: string): void {
    const day = this.availability[key];
    const blocks = [...day.blocks];
    blocks[0] = { ...blocks[0], [field]: value };
    this.patchDay(key, { blocks });
  }

  applyToAll(sourceKey: string): void {
    const source = this.availability[sourceKey];
    const next: ProfessionalAvailability = { ...this.availability };

    for (const day of this.days) {
      next[day.key] = {
        enabled: source.enabled,
        blocks: source.blocks.map((block: ScheduleBlock) => ({ ...block })),
      };
    }

    this.availabilityChange.emit(next);
  }

  applyFromFirstOpenDay(): void {
    const sourceDay = this.days.find((day) => this.availability[day.key].enabled);
    if (!sourceDay) {
      return;
    }
    this.applyToAll(sourceDay.key);
  }

  private patchDay(key: string, patch: Partial<DaySchedule>): void {
    this.availabilityChange.emit({
      ...this.availability,
      [key]: { ...this.availability[key], ...patch },
    });
  }
}
