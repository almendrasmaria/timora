import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-text-field',
  standalone: true,
  templateUrl: './text-field.component.html',
  styleUrl: './text-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextFieldComponent),
      multi: true,
    },
  ],
})
export class TextFieldComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type: 'text' | 'email' | 'password' = 'text';
  @Input() placeholder = '';
  @Input() autocomplete = '';
  @Input() error = '';

  value = '';
  disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
