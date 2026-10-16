import { Component, inject, type OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ExerciseService } from "@core/exercises/exercise.service";
import { decodeExercise, type SharedExercise } from "@core/exercises/share";
import { logger } from "@core/logger/logger";
import { MachineService } from "@core/machine/machine.service";
import { TranslatePipe } from "@ngx-translate/core";

/** A link to a shared exercise (EDU-07): what it has, and a button to open it in the editor */
@Component({
  selector: "view-shared-exercise",
  imports: [TranslatePipe],
  template: `
    <div class="card card-outline card-primary">
      <div class="card-header"><h1 class="card-title h3">{{ 'SHARE.OPEN_TITLE' | translate }}</h1></div>
      <div class="card-body">
        @if (failed()) {
          <p class="text-danger" role="alert">{{ 'SHARE.INVALID' | translate }}</p>
        } @else if (exercise(); as exercise) {
          <h2 class="h5" id="sharedName">{{ exercise.name }}</h2>
          @if (exercise.statement) { <p id="sharedStatement">{{ exercise.statement }}</p> }
          <ul class="small">
            <li>{{ 'SHARE.LOCK_FORWARDING' | translate }}: {{ (exercise.forwarding ? 'ACCOUNT.YES' : 'ACCOUNT.NO') | translate }}</li>
            <li>{{ 'SHARE.LOCK_MEMORYSIZE' | translate }}: {{ exercise.memorySize }}</li>
          </ul>
          @if (exercise.locked.length > 0) {
            <p class="small">{{ 'SHARE.LOCKED' | translate }}
              @for (key of exercise.locked; track key) { <span class="badge badge-secondary mr-1">{{ 'SHARE.LOCK_' + key.toUpperCase() | translate }}</span> }
            </p>
          }
          <pre class="border rounded p-2 small shared-code">{{ exercise.content }}</pre>
          <button type="button" class="btn btn-primary" id="sharedOpen" (click)="open(exercise)">{{ 'SHARE.OPEN' | translate }}</button>
        } @else {
          <p class="text-muted"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i> {{ 'SHARE.LOADING' | translate }}</p>
        }
      </div>
    </div>
  `,
  styles: [".shared-code { max-height: 40vh; overflow: auto; }"],
})
export class SharedExerciseView implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private exercises = inject(ExerciseService);
  private machine = inject(MachineService);

  public readonly exercise = signal<SharedExercise | null>(null);
  public readonly failed = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      this.exercise.set(await decodeExercise(this.route.snapshot.queryParamMap.get("d") ?? ""));
    } catch (error) {
      logger.warn(error);
      this.failed.set(true);
    }
  }

  public async open(exercise: SharedExercise): Promise<void> {
    const interfaceFileItem = await this.exercises.open(exercise);
    await this.machine.resetMachineStatus();
    await this.router.navigateByUrl("/auth/editor", { state: { interfaceFileItem } });
  }
}
